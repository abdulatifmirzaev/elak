import * as cheerio from "cheerio";
import { ChannelSource, FetchChannelResult, ScrapedPost } from "./types.js";
import { Logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

interface CacheEntry {
  data: FetchChannelResult;
  timestamp: number;
}

export class PublicPreviewChannelSource implements ChannelSource {
  public readonly name = "PublicPreview";
  private logger = new Logger({ component: "PublicPreviewChannelSource" });

  // In-memory cache to guarantee multiple users tracking the same channel don't trigger extra fetches
  private cache = new Map<string, CacheEntry>();
  private cacheTtlMs: number;

  // Rate limiting timestamp between external t.me fetches
  private lastFetchTime = 0;
  private minIntervalMs: number;

  constructor(options: { cacheTtlMinutes?: number; minIntervalMs?: number } = {}) {
    this.cacheTtlMs = (options.cacheTtlMinutes ?? 30) * 60 * 1000;
    this.minIntervalMs = options.minIntervalMs ?? 1500; // at least 1.5s between requests
  }

  private cleanUsername(username: string): string {
    return username.replace(/^@/, "").trim().toLowerCase();
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastFetchTime;
    if (elapsed < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastFetchTime = Date.now();
  }

  public async fetchPosts(channelUsername: string, limit = 10): Promise<FetchChannelResult> {
    const username = this.cleanUsername(channelUsername);

    // 1. Check in-memory cache
    const cached = this.cache.get(username);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      this.logger.debug(`Cache hit for channel: ${username}`);
      return cached.data;
    }

    // 2. Enforce minimum delay between calls
    await this.enforceRateLimit();

    const targetUrl = `https://t.me/s/${username}`;
    this.logger.info(`Fetching channel preview: ${targetUrl}`);

    try {
      const result = await withRetry(
        async () => {
          const res = await fetch(targetUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "uz,en;q=0.9,ru;q=0.8",
            },
            signal: AbortSignal.timeout(10000),
          });

          if (res.status === 404) {
            return {
              username,
              isReachable: false,
              posts: [],
              error: "Channel not found (404)",
            };
          }

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const html = await res.text();
          return this.parsePreviewHtml(username, html, limit);
        },
        { retries: 2, minDelayMs: 1500, timeoutMs: 12000 },
      );

      // Save to cache
      this.cache.set(username, { data: result, timestamp: Date.now() });
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to fetch channel @${username} via public preview: ${errorMsg}`);

      const failureResult: FetchChannelResult = {
        username,
        isReachable: false,
        posts: [],
        error: errorMsg,
      };

      return failureResult;
    }
  }

  private parsePreviewHtml(username: string, html: string, limit: number): FetchChannelResult {
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $(".tgme_channel_info_header_title span").first().text().trim() ||
      $(".tgme_page_title").first().text().trim() ||
      undefined;

    // Check if channel is unreachable or private
    const isError =
      $(".tgme_page_error").length > 0 ||
      html.includes("If you have <strong>Telegram</strong>, you can contact");

    const messageElements = $(".tgme_widget_message_wrap");

    if (isError && messageElements.length === 0) {
      return {
        username,
        title,
        isReachable: false,
        posts: [],
        error: "Channel is private or does not exist",
      };
    }

    const posts: ScrapedPost[] = [];

    // Reverse iterate to get newest messages first, up to limit
    const elementsArray = messageElements.toArray().reverse();

    for (const el of elementsArray) {
      if (posts.length >= limit) break;

      const $msg = $(el);
      const dataPost = $msg.find(".tgme_widget_message").attr("data-post");
      if (!dataPost) continue;

      // data-post format is "channel_name/12345"
      const parts = dataPost.split("/");
      const rawMsgId = parts[1];
      if (!rawMsgId || isNaN(Number(rawMsgId))) continue;

      const telegramMsgId = BigInt(rawMsgId);

      // Extract raw text
      const text = $msg.find(".tgme_widget_message_text").text().trim();
      if (!text) continue; // Skip messages without readable text (e.g. pure sticker)

      // Extract date
      const dateStr = $msg.find("time").attr("datetime");
      const postedAt = dateStr ? new Date(dateStr) : undefined;

      posts.push({
        telegramMsgId,
        rawText: text,
        postedAt,
      });
    }

    return {
      username,
      title,
      isReachable: true,
      posts,
    };
  }
}
