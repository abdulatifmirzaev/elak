export interface SummarizeResult {
  summary: string; // 1-2 concise sentences in Uzbek
  category: string; // Matched against available categories
}

export interface LlmClient {
  readonly name: string;
  summarizeAndCategorize(
    rawText: string,
    availableCategories: string[],
    channelTitle?: string,
  ): Promise<SummarizeResult>;
}
