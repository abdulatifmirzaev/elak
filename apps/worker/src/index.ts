import dotenv from "dotenv";

dotenv.config();

export * from "./sources/index.js";
export * from "./llm/index.js";
export * from "./services/channel-fetcher.js";
export * from "./services/post-summarizer.js";
export * from "./services/digest-builder.js";
export * from "./services/delivery-queue.js";
export * from "./utils/logger.js";
export * from "./utils/retry.js";

import { logger } from "./utils/logger.js";
import { ChannelFetcherService } from "./services/channel-fetcher.js";
import { PostSummarizerService } from "./services/post-summarizer.js";
import { DigestBuilderService } from "./services/digest-builder.js";
import { ThrottledDeliveryQueue } from "./services/delivery-queue.js";

export async function runFullWorkerCycle(): Promise<void> {
  logger.info("[Worker] Starting full twice-daily cycle...");

  // 1. Fetch channel posts (deduplicated)
  const fetcher = new ChannelFetcherService();
  const fetchStats = await fetcher.fetchAllTrackedChannels();
  logger.info("[Worker] Channel fetch completed", { ...fetchStats });

  // 2. Summarize & categorize pending posts with LLM
  const summarizer = new PostSummarizerService();
  const sumStats = await summarizer.summarizePendingPosts();
  logger.info("[Worker] Post summarization completed", { ...sumStats });

  // 3. Assemble personalized digests
  const builder = new DigestBuilderService();
  const digests = await builder.buildDigestsForActiveUsers();
  logger.info(`[Worker] Generated ${digests.length} user digests`);

  // 4. Deliver digests via throttled queue
  if (digests.length > 0) {
    const queue = new ThrottledDeliveryQueue();
    const deliveryStats = await queue.deliverDigests(digests);
    logger.info("[Worker] Delivery queue completed", { ...deliveryStats });
  }

  logger.info("[Worker] Full worker cycle completed successfully.");
}

export const runScraperCycle = runFullWorkerCycle;

if (process.env.RUN_ONCE === "true") {
  runFullWorkerCycle()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error("[Worker] Fatal error during worker cycle", { error: String(err) });
      process.exit(1);
    });
}
