import dotenv from "dotenv";

dotenv.config();

export * from "./bot.js";
export * from "./messages/uzbek.js";
export * from "./utils/channel-validator.js";
export * from "./utils/logger.js";

import { createBot } from "./bot.js";
import { logger } from "./utils/logger.js";

export async function startBot(): Promise<void> {
  logger.info("[Bot Service] Initializing Telegram Radar Bot...");

  const bot = createBot();

  // Handle graceful termination
  const stopRunner = async () => {
    logger.info("[Bot Service] Stopping bot...");
    await bot.stop();
    process.exit(0);
  };

  process.once("SIGINT", stopRunner);
  process.once("SIGTERM", stopRunner);

  logger.info("[Bot Service] Starting bot polling...");
  await bot.start({
    onStart: (botInfo) => {
      logger.info(`[Bot Service] Bot started successfully as @${botInfo.username}`);
    },
  });
}

// Run the bot unless in test environment
if (process.env.NODE_ENV !== "test") {
  startBot().catch((err) => {
    logger.error("[Bot Service] Fatal error while running bot", { error: String(err) });
    process.exit(1);
  });
}
