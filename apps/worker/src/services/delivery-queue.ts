import { Bot } from "grammy";
import { prisma } from "@radar/database";
import { UserDigestPayload } from "./digest-builder.js";
import { Logger } from "../utils/logger.js";

export interface MessageSender {
  sendMessage(chatId: string | number | bigint, text: string): Promise<boolean>;
}

export class GrammyMessageSender implements MessageSender {
  private bot: Bot;

  constructor(token?: string) {
    const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is required for GrammyMessageSender");
    }
    this.bot = new Bot(botToken);
  }

  public async sendMessage(chatId: string | number | bigint, text: string): Promise<boolean> {
    const targetChat = typeof chatId === "bigint" ? chatId.toString() : chatId;
    await this.bot.api.sendMessage(targetChat, text, {
      parse_mode: undefined,
      link_preview_options: { is_disabled: false },
    });
    return true;
  }
}

export interface DeliveryQueueStats {
  totalJobs: number;
  messagesSent: number;
  failedJobs: number;
  deactivatedUsers: number;
}

export class ThrottledDeliveryQueue {
  private sender: MessageSender;
  private logger = new Logger({ service: "ThrottledDeliveryQueue" });

  // Rate limiting states
  private lastGlobalSendTime = 0;
  private lastChatSendTimes = new Map<string, number>();

  // Limits
  private readonly minGlobalIntervalMs: number; // ~30 msgs/sec => ~35ms
  private readonly minPerChatIntervalMs: number; // ~1 msg/sec => 1000ms
  private readonly persistToDb: boolean;

  constructor(
    sender?: MessageSender,
    options: {
      minGlobalIntervalMs?: number;
      minPerChatIntervalMs?: number;
      persistToDb?: boolean;
    } = {},
  ) {
    this.sender = sender ?? new GrammyMessageSender();
    this.minGlobalIntervalMs = options.minGlobalIntervalMs ?? 35;
    this.minPerChatIntervalMs = options.minPerChatIntervalMs ?? 1000;
    this.persistToDb = options.persistToDb ?? true;
  }

  private async throttle(chatIdStr: string): Promise<void> {
    const now = Date.now();

    // 1. Check global rate limit
    const globalElapsed = now - this.lastGlobalSendTime;
    if (globalElapsed < this.minGlobalIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minGlobalIntervalMs - globalElapsed));
    }

    // 2. Check per-chat rate limit
    const lastChatTime = this.lastChatSendTimes.get(chatIdStr) || 0;
    const chatElapsed = Date.now() - lastChatTime;
    if (chatElapsed < this.minPerChatIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minPerChatIntervalMs - chatElapsed));
    }

    const sendTimestamp = Date.now();
    this.lastGlobalSendTime = sendTimestamp;
    this.lastChatSendTimes.set(chatIdStr, sendTimestamp);
  }

  public async deliverDigests(digests: UserDigestPayload[]): Promise<DeliveryQueueStats> {
    this.logger.info(`Starting delivery queue processing for ${digests.length} user digests`);

    const stats: DeliveryQueueStats = {
      totalJobs: digests.length,
      messagesSent: 0,
      failedJobs: 0,
      deactivatedUsers: 0,
    };

    for (const digest of digests) {
      const chatIdStr = digest.telegramId.toString();
      let jobSuccess = true;

      try {
        for (const message of digest.formattedMessages) {
          await this.throttle(chatIdStr);

          try {
            await this.sender.sendMessage(digest.telegramId, message);
            stats.messagesSent++;
          } catch (sendErr: unknown) {
            const errStr = String(sendErr);

            // Handle 403 Forbidden: User blocked bot
            if (errStr.includes("403") || errStr.toLowerCase().includes("blocked by the user")) {
              this.logger.warn(
                `User ${digest.userId} (TG: ${chatIdStr}) blocked the bot. Deactivating.`,
              );
              if (this.persistToDb) {
                await prisma.user.update({
                  where: { id: digest.userId },
                  data: { isActive: false },
                });
              }
              stats.deactivatedUsers++;
              jobSuccess = false;
              break;
            }

            // Handle 429 Too Many Requests
            if (errStr.includes("429") || errStr.toLowerCase().includes("too many requests")) {
              this.logger.warn(`Telegram 429 rate limit encountered. Backing off 5s.`);
              await new Promise((resolve) => setTimeout(resolve, 5000));
              // Retry once
              await this.sender.sendMessage(digest.telegramId, message);
              stats.messagesSent++;
              continue;
            }

            throw sendErr;
          }
        }

        // Record successful digest in DB
        if (this.persistToDb) {
          await prisma.digest.create({
            data: {
              userId: digest.userId,
              status: jobSuccess ? "sent" : "failed",
              postIds: digest.postIds,
            },
          });
        }

        if (!jobSuccess) {
          stats.failedJobs++;
        }
      } catch (err: unknown) {
        stats.failedJobs++;
        this.logger.error(`Failed to deliver digest to user ${digest.userId}`, {
          error: String(err),
        });

        // Record failed digest in DB
        if (this.persistToDb) {
          try {
            await prisma.digest.create({
              data: {
                userId: digest.userId,
                status: "failed",
                postIds: digest.postIds,
              },
            });
          } catch {
            // ignore db error
          }
        }
      }
    }

    this.logger.info("Delivery queue processing completed", { ...stats });
    return stats;
  }
}
