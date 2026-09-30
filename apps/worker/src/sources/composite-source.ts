import { ChannelSource, FetchChannelResult } from "./types.js";
import { PublicPreviewChannelSource } from "./public-preview-source.js";
import { BotApiChannelSource } from "./bot-api-source.js";
import { Logger } from "../utils/logger.js";

export class CompositeChannelSource implements ChannelSource {
  public readonly name = "CompositeFallbackChain";
  private logger = new Logger({ component: "CompositeChannelSource" });
  private botApiSource: BotApiChannelSource;
  private previewSource: PublicPreviewChannelSource;

  constructor(botApiToken?: string) {
    this.botApiSource = new BotApiChannelSource(botApiToken);
    this.previewSource = new PublicPreviewChannelSource();
  }

  public async fetchPosts(channelUsername: string, limit = 10): Promise<FetchChannelResult> {
    const cleanUser = channelUsername.replace(/^@/, "").trim().toLowerCase();

    // 1. Try public preview fetcher first for actual post content
    const previewResult = await this.previewSource.fetchPosts(cleanUser, limit);
    if (previewResult.isReachable && previewResult.posts.length > 0) {
      return previewResult;
    }

    // 2. If preview had no posts or failed, verify with Bot API to check reachability & channel title
    this.logger.info(`Preview empty or failed for @${cleanUser}, checking Bot API reachability`);
    const botApiResult = await this.botApiSource.fetchPosts(cleanUser, limit);

    if (botApiResult.isReachable) {
      return {
        username: cleanUser,
        title: botApiResult.title ?? previewResult.title,
        isReachable: true,
        posts: previewResult.posts, // May be empty if no new posts, but reachable
      };
    }

    // Neither source succeeded
    return {
      username: cleanUser,
      title: previewResult.title,
      isReachable: false,
      posts: [],
      error: previewResult.error || botApiResult.error || "Channel unreachable",
    };
  }
}
