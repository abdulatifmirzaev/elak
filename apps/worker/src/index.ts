import dotenv from "dotenv";

dotenv.config();

export * from "./sources/index.js";
export * from "./llm/index.js";
export * from "./services/channel-fetcher.js";
export * from "./services/post-summarizer.js";
export * from "./utils/logger.js";
export * from "./utils/retry.js";

import { logger } from "./utils/logger.js";
import { ChannelFetcherService } from "./services/channel-fetcher.js";
import { PostSummarizerService } from "./services/post-summarizer.js";

export async function runScraperCycle(): Promise<void> {
  logger.info("[Worker] Executing on-demand scraper cycle...");
  const fetcher = new ChannelFetcherService();
  const fetchStats = await fetcher.fetchAllTrackedChannels();
  logger.info("[Worker] Channel fetch completed", { ...fetchStats });

  const summarizer = new PostSummarizerService();
  const sumStats = await summarizer.summarizePendingPosts();
  logger.info("[Worker] Post summarization completed", { ...sumStats });
}

if (process.env.RUN_ONCE === "true") {
  runScraperCycle()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error("[Worker] Fatal error during worker cycle", { error: String(err) });
      process.exit(1);
    });
}
