import dotenv from "dotenv";

dotenv.config();

export * from "./sources/index.js";
export * from "./llm/index.js";
export * from "./services/channel-fetcher.js";
export * from "./services/post-summarizer.js";
export * from "./services/digest-builder.js";
export * from "./services/delivery-queue.js";
export * from "./scheduler/scheduler.js";
export * from "./utils/logger.js";
export * from "./utils/retry.js";

import { logger } from "./utils/logger.js";
import { ChannelFetcherService } from "./services/channel-fetcher.js";
import { PostSummarizerService } from "./services/post-summarizer.js";
import { DigestBuilderService } from "./services/digest-builder.js";
import { ThrottledDeliveryQueue } from "./services/delivery-queue.js";
import { CronSchedulerService } from "./scheduler/scheduler.js";

export async function runFullWorkerCycle(): Promise<void> {
  logger.info("[Worker] Starting full twice-daily cycle...");

  // 1. Fetch channel posts (deduplicated across all active subscribers)
  const fetcher = new ChannelFetcherService();
  const fetchStats = await fetcher.fetchAllTrackedChannels();
  logger.info("[Worker] Channel fetch completed", { ...fetchStats });

  // 2. Summarize & categorize pending posts with LLM (Uzbek 1-2 sentences)
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

// Main process execution
if (process.argv[1] && process.argv[1].includes("apps/worker")) {
  if (process.env.RUN_ONCE === "true") {
    logger.info("[Worker] RUN_ONCE=true detected. Executing single cycle...");
    runFullWorkerCycle()
      .then(() => {
        logger.info("[Worker] One-off cycle completed. Exiting.");
        process.exit(0);
      })
      .catch((err) => {
        logger.error("[Worker] Fatal error during one-off worker cycle", { error: String(err) });
        process.exit(1);
      });
  } else {
    // Start persistent cron daemon
    const scheduler = new CronSchedulerService(runFullWorkerCycle);
    scheduler.start();

    const gracefulStop = () => {
      logger.info("[Worker] Shutting down scheduler gracefully...");
      scheduler.stop();
      process.exit(0);
    };

    process.once("SIGINT", gracefulStop);
    process.once("SIGTERM", gracefulStop);
  }
}
