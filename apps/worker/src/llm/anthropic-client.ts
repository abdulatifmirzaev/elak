import Anthropic from "@anthropic-ai/sdk";
import { LlmClient, SummarizeResult } from "./types.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";
import { parseLlmJsonResponse } from "./json-parser.js";
import { Logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

export class AnthropicLlmClient implements LlmClient {
  public readonly name = "AnthropicClaude";
  private client: Anthropic;
  private model: string;
  private logger = new Logger({ component: "AnthropicLlmClient" });

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY is required to initialize AnthropicLlmClient");
    }
    this.client = new Anthropic({ apiKey: key });
    this.model = model || process.env.LLM_MODEL || "claude-3-5-haiku-latest";
  }

  public async summarizeAndCategorize(
    rawText: string,
    availableCategories: string[],
    channelTitle?: string,
  ): Promise<SummarizeResult> {
    const userPrompt = buildUserPrompt(rawText, availableCategories, channelTitle);

    this.logger.debug(`Calling Claude LLM (${this.model}) for post summarization`);

    const result = await withRetry(
      async () => {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 300,
          temperature: 0.2,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

        const firstBlock = response.content[0];
        const contentText = firstBlock && firstBlock.type === "text" ? firstBlock.text : "";
        return parseLlmJsonResponse(contentText, availableCategories);
      },
      { retries: 2, minDelayMs: 1000, timeoutMs: 15000 },
    );

    return result;
  }
}
