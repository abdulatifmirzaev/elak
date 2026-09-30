import { LlmClient, SummarizeResult } from "./types.js";
import { Logger } from "../utils/logger.js";

export class HeuristicLlmClient implements LlmClient {
  public readonly name = "HeuristicFallbackLLM";
  private logger = new Logger({ component: "HeuristicLlmClient" });

  public async summarizeAndCategorize(
    rawText: string,
    availableCategories: string[],
    _channelTitle?: string,
  ): Promise<SummarizeResult> {
    this.logger.debug("Generating heuristic Uzbek summary & category");

    // Clean text
    const cleaned = rawText
      .replace(/https?:\/\/\S+/g, "")
      .replace(/@\w+/g, "")
      .replace(/[#*`_~]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Extract first 1-2 sentences
    const sentences = cleaned
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    let summary = "";
    if (sentences.length >= 2) {
      summary = `${sentences[0]} ${sentences[1]}`;
    } else if (sentences.length === 1 && sentences[0]) {
      summary = sentences[0];
    } else {
      summary = cleaned.slice(0, 160) + (cleaned.length > 160 ? "..." : "");
    }

    if (summary.length > 250) {
      summary = summary.slice(0, 247) + "...";
    }

    // Determine category based on keyword matching
    const lower = rawText.toLowerCase();
    let bestCategory = availableCategories[0] || "Texnologiya";

    const keywordRules: Record<string, string[]> = {
      AI: ["ai", "sun'iy intellekt", "chatgpt", "claude", "llm", "deepseek", "neyrotarmoq"],
      Texnologiya: ["texnologiya", "smartfon", "apple", "google", "gadjet", "android", "windows"],
      Dasturlash: ["python", "javascript", "code", "dastur", "frontend", "backend", "git", "react"],
      Startap: ["startap", "startup", "investitsiya", "venture", "pitch", "fond"],
      Biznes: ["biznes", "savdo", "kompaniya", "bozor", "daromad", "boshqaruv"],
      Karyera: ["ish", "vakansiya", "rezyume", "suhbat", "maosh", "karyera"],
      "Kripto & Moliya": ["kripto", "bitcoin", "dollar", "valyuta", "bank", "kredit", "btc"],
      "Ta'lim": ["kurs", "talaba", "universitet", "dars", "o'rganish", "kitob"],
      Marketing: ["marketing", "reklama", "target", "smm", "brend", "sotuv"],
    };

    for (const [catName, keywords] of Object.entries(keywordRules)) {
      if (availableCategories.includes(catName)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          bestCategory = catName;
          break;
        }
      }
    }

    return {
      summary: summary || "Yangi post e'lon qilindi.",
      category: bestCategory,
    };
  }
}
