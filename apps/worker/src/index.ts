import dotenv from "dotenv";

dotenv.config();

console.log("[Worker Service] Initializing Telegram Radar Worker & Scraper Pipeline...");

export function getWorkerStatus(): string {
  return "Worker service initialized";
}
