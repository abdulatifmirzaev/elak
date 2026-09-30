import { SummarizeResult } from "./types.js";

export function parseLlmJsonResponse(text: string, availableCategories: string[]): SummarizeResult {
  const fallbackCategory = availableCategories[0] || "Umumiy";

  // Try direct parse first
  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as { summary?: string; category?: string };

    const summary = (parsed.summary || "").trim();
    let category = (parsed.category || "").trim();

    // Verify if category matches one of the available ones (case-insensitive)
    const matchedCategory = availableCategories.find(
      (c) => c.toLowerCase() === category.toLowerCase(),
    );

    if (matchedCategory) {
      category = matchedCategory;
    } else if (!category) {
      category = fallbackCategory;
    }

    if (summary) {
      return { summary, category };
    }
  } catch {
    // If JSON parsing fails, extract heuristically
  }

  // Fallback: search for {"summary": ...} with regex
  const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);
  const categoryMatch = text.match(/"category"\s*:\s*"([^"]+)"/);

  const summary = summaryMatch?.[1]?.trim() || text.slice(0, 150) + "...";
  const rawCat = categoryMatch?.[1]?.trim() || "";
  const category =
    availableCategories.find((c) => c.toLowerCase() === rawCat.toLowerCase()) || fallbackCategory;

  return { summary, category };
}
