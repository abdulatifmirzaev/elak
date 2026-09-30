import dotenv from "dotenv";

dotenv.config();

console.log("[Bot Service] Initializing Telegram Radar Bot...");

export function getBotStatus(): string {
  return "Bot service initialized";
}
