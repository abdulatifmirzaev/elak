import { prisma } from "@radar/database";
import { ChannelSource, FetchChannelResult } from "../sources/types.js";
import { CompositeChannelSource } from "../sources/composite-source.js";
import { Logger } from "../utils/logger.js";

export interface ChannelFetchStats {
  totalChannelsQueued: number;
  uniqueChannelsProcessed: number;
  successfulFetches: number;
  unreachableChannels: number;
  newPostsDiscovered: number;
}

export class ChannelFetcherService {
  private source: ChannelSource;
  private logger = new Logger({ service: "ChannelFetcherService" });

  constructor(source?: ChannelSource) {
    this.source = source ?? new CompositeChannelSource();
  }

  /**
   * Fetches updates for all actively tracked channels, deduplicating so each channel
   * is fetched at most once per execution cycle regardless of how many users follow it.
   */
  public async fetchAllTrackedChannels(maxPostsPerChannel = 10): Promise<ChannelFetchStats> {
    this.logger.info("Starting tracked channels fetch cycle...");

    // 1. Query distinct channels that belong to active users
    const trackedChannels = await prisma.channel.findMany({
      where: {
        users: {
          some: {
            user: {
              isActive: true,
            },
          },
        },
      },
      select: {
        id: true,
        username: true,
        title: true,
        lastScrapedAt: true,
      },
    });

    const stats: ChannelFetchStats = {
      totalChannelsQueued: trackedChannels.length,
      uniqueChannelsProcessed: 0,
      successfulFetches: 0,
      unreachableChannels: 0,
      newPostsDiscovered: 0,
    };

    if (trackedChannels.length === 0) {
      this.logger.info("No active tracked channels found. Skipping cycle.");
      return stats;
    }

    // 2. Deduplicate channels by clean username
    const uniqueChannelMap = new Map<string, (typeof trackedChannels)[0]>();
    for (const channel of trackedChannels) {
      const cleanName = channel.username.trim().toLowerCase();
      if (!uniqueChannelMap.has(cleanName)) {
        uniqueChannelMap.set(cleanName, channel);
      }
    }

    stats.uniqueChannelsProcessed = uniqueChannelMap.size;
    this.logger.info(
      `Processing ${stats.uniqueChannelsProcessed} unique channels (deduplicated from ${stats.totalChannelsQueued} user subscriptions)`,
    );

    // 3. Process each unique channel
    for (const [username, channelRecord] of uniqueChannelMap.entries()) {
      try {
        const result: FetchChannelResult = await this.source.fetchPosts(
          username,
          maxPostsPerChannel,
        );

        if (!result.isReachable) {
          stats.unreachableChannels++;
          this.logger.warn(`Channel @${username} is unreachable: ${result.error}`);
          await prisma.channel.update({
            where: { id: channelRecord.id },
            data: {
              isReachable: false,
              lastScrapedAt: new Date(),
            },
          });
          continue;
        }

        stats.successfulFetches++;

        // Update channel metadata
        await prisma.channel.update({
          where: { id: channelRecord.id },
          data: {
            isReachable: true,
            title: result.title ?? channelRecord.title,
            lastScrapedAt: new Date(),
          },
        });

        // 4. Save new posts with deduplication against DB
        let channelNewPosts = 0;
        for (const post of result.posts) {
          try {
            // Upsert or create if not exists
            const existing = await prisma.post.findUnique({
              where: {
                channelId_telegramMsgId: {
                  channelId: channelRecord.id,
                  telegramMsgId: post.telegramMsgId,
                },
              },
            });

            if (!existing) {
              await prisma.post.create({
                data: {
                  channelId: channelRecord.id,
                  telegramMsgId: post.telegramMsgId,
                  rawText: post.rawText,
                  postedAt: post.postedAt,
                  fetchedAt: new Date(),
                },
              });
              channelNewPosts++;
              stats.newPostsDiscovered++;
            }
          } catch (postErr) {
            this.logger.error(
              `Failed to store post ${post.telegramMsgId} for channel @${username}`,
              { error: String(postErr) },
            );
          }
        }

        this.logger.info(`Channel @${username} synced: ${channelNewPosts} new posts added.`);
      } catch (channelErr) {
        this.logger.error(`Error processing channel @${username}`, { error: String(channelErr) });
      }
    }

    this.logger.info("Completed channel fetch cycle", { ...stats });
    return stats;
  }
}
