import { prisma } from "@radar/database";
import { LlmClient, createLlmClient } from "../llm/index.js";
import { Logger } from "../utils/logger.js";

export interface SummarizeStats {
  totalPending: number;
  successfullySummarized: number;
  failed: number;
}

export class PostSummarizerService {
  private llmClient: LlmClient;
  private logger = new Logger({ service: "PostSummarizerService" });

  constructor(llmClient?: LlmClient) {
    this.llmClient = llmClient ?? createLlmClient();
  }

  /**
   * Process all unsummarized posts in the database:
   * Calls LLM to produce 1-2 sentence Uzbek summary and categorized tags,
   * then updates the Post records in PostgreSQL.
   */
  public async summarizePendingPosts(batchSize = 50): Promise<SummarizeStats> {
    this.logger.info("Checking for unsummarized posts...");

    // 1. Fetch available interests from DB
    const interests = await prisma.interest.findMany({
      select: { name: true },
    });
    const categoryNames = interests.map((i) => i.name);

    // 2. Fetch pending posts
    const pendingPosts = await prisma.post.findMany({
      where: {
        summary: null,
        rawText: {
          not: null,
        },
      },
      take: batchSize,
      include: {
        channel: true,
      },
      orderBy: {
        fetchedAt: "desc",
      },
    });

    const stats: SummarizeStats = {
      totalPending: pendingPosts.length,
      successfullySummarized: 0,
      failed: 0,
    };

    if (pendingPosts.length === 0) {
      this.logger.info("No unsummarized posts found.");
      return stats;
    }

    this.logger.info(
      `Found ${pendingPosts.length} posts to summarize with LLM (${this.llmClient.name})`,
    );

    // 3. Process each post sequentially or in controlled batches
    for (const post of pendingPosts) {
      if (!post.rawText || post.rawText.trim().length === 0) {
        continue;
      }

      try {
        const result = await this.llmClient.summarizeAndCategorize(
          post.rawText,
          categoryNames,
          post.channel.title ?? undefined,
        );

        // 4. Persist summary and category to database
        await prisma.post.update({
          where: { id: post.id },
          data: {
            summary: result.summary,
            category: result.category,
          },
        });

        stats.successfullySummarized++;
        this.logger.debug(
          `Post ${post.telegramMsgId} summarized: [${result.category}] ${result.summary}`,
        );
      } catch (err: unknown) {
        stats.failed++;
        this.logger.error(`Failed to summarize post ID ${post.id}`, { error: String(err) });
      }
    }

    this.logger.info("Post summarization cycle completed", { ...stats });
    return stats;
  }
}
