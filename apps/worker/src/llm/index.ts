import { LlmClient } from "./types.js";
import { AnthropicLlmClient } from "./anthropic-client.js";
import { HeuristicLlmClient } from "./heuristic-client.js";
import { logger } from "../utils/logger.js";

export * from "./types.js";
export * from "./prompts.js";
export * from "./json-parser.js";
export * from "./anthropic-client.js";
export * from "./heuristic-client.js";

export function createLlmClient(): LlmClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    logger.info("Initializing Anthropic Claude LLM client");
    return new AnthropicLlmClient(apiKey);
  }

  logger.warn(
    "ANTHROPIC_API_KEY is not defined. Using resilient HeuristicLlmClient for local execution/testing.",
  );
  return new HeuristicLlmClient();
}
