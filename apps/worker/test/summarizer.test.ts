import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildUserPrompt, SYSTEM_PROMPT } from "../src/llm/prompts.js";
import { parseLlmJsonResponse } from "../src/llm/json-parser.js";
import { HeuristicLlmClient } from "../src/llm/heuristic-client.js";

describe("Summarization Pipeline & Prompts", () => {
  const categories = ["Texnologiya", "Startap", "Karyera", "AI", "Biznes"];

  it("SYSTEM_PROMPT should enforce Uzbek language and brevity constraints", () => {
    assert.ok(SYSTEM_PROMPT.includes("o'zbek tilida"));
    assert.ok(SYSTEM_PROMPT.includes("1 yoki 2 gapdan oshmasligi"));
    assert.ok(SYSTEM_PROMPT.includes("Mualliflik huquqi"));
    assert.ok(SYSTEM_PROMPT.includes("JSON"));
  });

  it("buildUserPrompt should format text, categories, and channelTitle correctly", () => {
    const rawPost =
      "Anthropic yangi Claude 3.5 Haiku modelini taqdim etdi. U avvalgidan ancha tez ishlaydi.";
    const prompt = buildUserPrompt(rawPost, categories, "IT Yangiliklar");

    assert.ok(prompt.includes("Kanal nomi: IT Yangiliklar"));
    assert.ok(prompt.includes("Texnologiya, Startap, Karyera, AI, Biznes"));
    assert.ok(prompt.includes(rawPost));
  });

  it("parseLlmJsonResponse should parse clean JSON", () => {
    const jsonStr =
      '{"summary": "Claude 3.5 Haiku modeli rasman e\'lon qilindi.", "category": "AI"}';
    const result = parseLlmJsonResponse(jsonStr, categories);

    assert.equal(result.summary, "Claude 3.5 Haiku modeli rasman e'lon qilindi.");
    assert.equal(result.category, "AI");
  });

  it("parseLlmJsonResponse should handle markdown codeblocks", () => {
    const mdJson =
      '```json\n{"summary": "Yangi investitsiya jalb qilindi.", "category": "Startap"}\n```';
    const result = parseLlmJsonResponse(mdJson, categories);

    assert.equal(result.summary, "Yangi investitsiya jalb qilindi.");
    assert.equal(result.category, "Startap");
  });

  it("HeuristicLlmClient should generate Uzbek summary and correct category", async () => {
    const client = new HeuristicLlmClient();
    const rawPost =
      "Yangi sun'iy intellekt modeli ChatGPT va Claude bilan raqobatlasha oladi. Dasturchilar uchun qulay.";

    const result = await client.summarizeAndCategorize(rawPost, categories);
    assert.ok(result.summary.length > 0);
    assert.equal(result.category, "AI");
  });
});
