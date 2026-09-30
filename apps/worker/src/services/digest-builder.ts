import { prisma } from "@radar/database";
import { Logger } from "../utils/logger.js";

export interface ChannelDigestItem {
  channelUsername: string;
  channelTitle?: string;
  telegramMsgId: bigint;
  postUrl: string;
  summary: string;
  category?: string;
  postId: string;
}

export interface UserDigestPayload {
  userId: string;
  telegramId: bigint;
  username?: string | null;
  items: ChannelDigestItem[];
  formattedMessages: string[];
  postIds: string[];
}

export class DigestBuilderService {
  private logger = new Logger({ service: "DigestBuilderService" });
  private maxPostsPerChannel: number;

  constructor(options: { maxPostsPerChannel?: number } = {}) {
    this.maxPostsPerChannel = options.maxPostsPerChannel ?? 3;
  }

  /**
   * Formats a collection of channel post items into Uzbek digest message(s)
   * following the exact template from Section 5.
   */
  public formatDigest(items: ChannelDigestItem[]): string[] {
    if (items.length === 0) return [];

    const header = "📰 Bugungi yangiliklar\n\n";
    const messages: string[] = [];
    let currentMessage = header;

    // Group items by channel
    const channelMap = new Map<string, ChannelDigestItem[]>();
    for (const item of items) {
      const existing = channelMap.get(item.channelUsername) || [];
      existing.push(item);
      channelMap.set(item.channelUsername, existing);
    }

    for (const [channelUsername, channelItems] of channelMap.entries()) {
      let channelBlock = `▸ @${channelUsername}\n`;

      for (const item of channelItems) {
        channelBlock += `${item.summary}\nBatafsil: ${item.postUrl}\n\n`;
      }

      // Check if adding this channel exceeds Telegram 4096 character limit (with safety margin at 3800)
      if (currentMessage.length + channelBlock.length > 3800) {
        messages.push(currentMessage.trimEnd());
        currentMessage = `📰 Bugungi yangiliklar (davomi)\n\n${channelBlock}`;
      } else {
        currentMessage += channelBlock;
      }
    }

    if (currentMessage.trim().length > 0) {
      messages.push(currentMessage.trimEnd());
    }

    return messages;
  }

  /**
   * Builds digests for all active users who have updates in their tracked channels.
   */
  public async buildDigestsForActiveUsers(): Promise<UserDigestPayload[]> {
    this.logger.info("Building digests for active users...");

    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        channels: {
          include: {
            channel: true,
          },
        },
        interests: {
          include: {
            interest: true,
          },
        },
      },
    });

    const results: UserDigestPayload[] = [];

    for (const user of activeUsers) {
      if (user.channels.length === 0) {
        continue;
      }

      // Find the cutoff date: timestamp of last sent digest or past 24 hours
      const lastDigest = await prisma.digest.findFirst({
        where: {
          userId: user.id,
          status: "sent",
        },
        orderBy: {
          sentAt: "desc",
        },
      });

      const cutoffDate = lastDigest
        ? lastDigest.sentAt
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const channelIds = user.channels.map((uc) => uc.channelId);
      const userInterestNames = new Set(user.interests.map((ui) => ui.interest.name.toLowerCase()));

      // Fetch summarized posts for user's tracked channels posted/fetched after cutoffDate
      const candidatePosts = await prisma.post.findMany({
        where: {
          channelId: { in: channelIds },
          summary: { not: null },
          fetchedAt: { gt: cutoffDate },
        },
        include: {
          channel: true,
        },
        orderBy: {
          telegramMsgId: "desc",
        },
      });

      // Group posts by channel and cap at maxPostsPerChannel
      const postsPerChannel = new Map<string, typeof candidatePosts>();
      for (const post of candidatePosts) {
        // If user has interest preferences, prioritize or filter matching categories
        if (userInterestNames.size > 0 && post.category) {
          if (!userInterestNames.has(post.category.toLowerCase())) {
            // If post has a known category that doesn't match user's interests, continue
            // (Unless candidatePosts is small, keeping strict to user preference)
            continue;
          }
        }

        const existing = postsPerChannel.get(post.channelId) || [];
        if (existing.length < this.maxPostsPerChannel) {
          existing.push(post);
          postsPerChannel.set(post.channelId, existing);
        }
      }

      // Flatten items
      const digestItems: ChannelDigestItem[] = [];
      const postIds: string[] = [];

      for (const posts of postsPerChannel.values()) {
        for (const post of posts) {
          const cleanUser = post.channel.username.replace(/^@/, "");
          const postUrl = `https://t.me/${cleanUser}/${post.telegramMsgId}`;

          digestItems.push({
            channelUsername: cleanUser,
            channelTitle: post.channel.title ?? undefined,
            telegramMsgId: post.telegramMsgId,
            postUrl,
            summary: post.summary || "",
            category: post.category ?? undefined,
            postId: post.id,
          });
          postIds.push(post.id);
        }
      }

      if (digestItems.length === 0) {
        // Record skipped_no_updates in DB so there is a log without sending spam
        await prisma.digest.create({
          data: {
            userId: user.id,
            status: "skipped_no_updates",
            postIds: [],
          },
        });
        continue;
      }

      const formattedMessages = this.formatDigest(digestItems);

      results.push({
        userId: user.id,
        telegramId: user.telegramId,
        username: user.username,
        items: digestItems,
        formattedMessages,
        postIds,
      });
    }

    this.logger.info(`Built digests for ${results.length} active users.`);
    return results;
  }
}
