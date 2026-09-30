import { Bot } from "grammy";
import { ChannelSource, FetchChannelResult } from "./types.js";
import { Logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

export class BotApiChannelSource implements ChannelSource {
  public readonly name = "BotApi";
  private logger = new Logger({ component: "BotApiChannelSource" });
  private bot: Bot | null = null;
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token || process.env.TELEGRAM_BOT_TOKEN;
    if (this.token) {
      this.bot = new Bot(this.token);
    }
  }

  private cleanUsername(username: string): string {
    return username.replace(/^@/, "").trim().toLowerCase();
  }

  public async fetchPosts(channelUsername: string, _limit = 10): Promise<FetchChannelResult> {
    const username = this.cleanUsername(channelUsername);

    if (!this.bot || !this.token) {
      return {
        username,
        isReachable: false,
        posts: [],
        error: "TELEGRAM_BOT_TOKEN not provided for BotApiChannelSource",
      };
    }

    try {
      this.logger.debug(`Verifying channel @${username} via official Telegram Bot API`);

      const chat = await withRetry(
        async () => {
          return await this.bot!.api.getChat(`@${username}`);
        },
        { retries: 2, minDelayMs: 1000, timeoutMs: 8000 },
      );

      const title = "title" in chat ? chat.title : undefined;

      // Note: Standard Telegram Bot API doesn't provide a direct getHistory method for bots
      // unless messages are received via webhook/updates or the bot is an admin with message history rights.
      // Therefore, BotApi source provides official channel metadata & reachability validation,
      // while delegating raw content fetching to the fallback chain.
      return {
        username,
        title,
        isReachable: true,
        posts: [], // Delegated to fallback if no direct update history
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Bot API cannot access @${username}: ${errorMsg}`);

      return {
        username,
        isReachable: false,
        posts: [],
        error: errorMsg,
      };
    }
  }
}
