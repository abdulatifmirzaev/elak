export interface ScrapedPost {
  telegramMsgId: bigint;
  rawText: string;
  postedAt?: Date;
}

export interface FetchChannelResult {
  username: string; // channel username without @
  title?: string;
  isReachable: boolean;
  posts: ScrapedPost[];
  error?: string;
}

export interface ChannelSource {
  readonly name: string;
  /**
   * Fetches latest posts from the specified channel username (without @).
   * @param channelUsername - Channel handle, e.g. "tashkent_news"
   * @param limit - Max number of recent posts to extract (e.g. 10)
   */
  fetchPosts(channelUsername: string, limit?: number): Promise<FetchChannelResult>;
}
