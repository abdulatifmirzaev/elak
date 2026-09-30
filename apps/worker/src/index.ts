import dotenv from "dotenv";

dotenv.config();

export * from "./sources/index.js";
export * from "./services/channel-fetcher.js";
export * from "./utils/logger.js";
export * from "./utils/retry.js";

import { logger } from "./utils/logger.js";
import { ChannelFetcherService } from "./services/channel-fetcher.js";

export async function runScraperCycle(): Promise<void> {
  logger.info("[Worker] Executing on-demand scraper cycle...");
  const fetcher = new ChannelFetcherService();
  const stats = await fetcher.fetchAllTrackedChannels();
  logger.info("[Worker] Scraper cycle completed", { ...stats });
}

if (process.env.RUN_ONCE === "true") {
  runScraperCycle()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error("[Worker] Fatal error during scraper cycle", { error: String(err) });
      process.exit(1);
    });
}
