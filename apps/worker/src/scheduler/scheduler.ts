import cron from "node-cron";
import { Logger } from "../utils/logger.js";
import { GrammyMessageSender } from "../services/delivery-queue.js";

export interface SchedulerOptions {
  cronExpression?: string;
  timezone?: string;
  adminTelegramId?: string;
}

export type CycleRunner = () => Promise<void>;

export class CronSchedulerService {
  private logger = new Logger({ service: "CronScheduler" });
  private cronExpression: string;
  private timezone: string;
  private adminTelegramId?: string;
  private task: cron.ScheduledTask | null = null;
  private isCycleRunning = false;
  private alertSender: GrammyMessageSender | null = null;
  private runner?: CycleRunner;

  constructor(runnerOrOptions?: CycleRunner | SchedulerOptions, maybeOptions?: SchedulerOptions) {
    let runner: CycleRunner | undefined;
    let options: SchedulerOptions = {};

    if (typeof runnerOrOptions === "function") {
      runner = runnerOrOptions;
      options = maybeOptions || {};
    } else if (typeof runnerOrOptions === "object" && runnerOrOptions !== null) {
      options = runnerOrOptions;
    }

    this.runner = runner;
    // Default: 09:00 and 20:00 Tashkent time (Asia/Tashkent)
    this.cronExpression = options.cronExpression || process.env.CRON_SCHEDULE || "0 9,20 * * *";

    this.timezone = options.timezone || process.env.SCHEDULE_TIMEZONE || "Asia/Tashkent";

    this.adminTelegramId = options.adminTelegramId || process.env.ADMIN_TELEGRAM_ID;

    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        this.alertSender = new GrammyMessageSender();
      } catch {
        // Optional alerting
      }
    }
  }

  /**
   * Sends an alert notification if a cycle encounters an unhandled fatal failure.
   */
  private async notifyFailure(error: unknown): Promise<void> {
    const errorMsg = error instanceof Error ? error.stack || error.message : String(error);
    this.logger.error("Worker cycle encountered a critical failure", { error: errorMsg });

    if (this.alertSender && this.adminTelegramId) {
      try {
        const text = `🚨 *[Telegram Radar Worker Ogohlantirish]*\n\nBülleten yaratish siklida jiddiy xatolik yuz berdi:\n\`\`\`\n${errorMsg.slice(0, 500)}\n\`\`\``;
        await this.alertSender.sendMessage(this.adminTelegramId, text);
        this.logger.info(`Failure alert sent to admin TG=${this.adminTelegramId}`);
      } catch (alertErr) {
        this.logger.error("Failed to send failure alert to admin", { error: String(alertErr) });
      }
    }
  }

  /**
   * Executes the cycle with concurrency locking and failure alerting.
   */
  public async executeCycle(): Promise<boolean> {
    if (this.isCycleRunning) {
      this.logger.warn(
        "A worker cycle is already in progress. Skipping this trigger to prevent race conditions.",
      );
      return false;
    }

    this.isCycleRunning = true;
    const startTime = Date.now();
    this.logger.info(
      `[Scheduler] Initiating scheduled digest cycle at ${new Date().toISOString()} (${this.timezone})`,
    );

    try {
      if (this.runner) {
        await this.runner();
      }
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.info(
        `[Scheduler] Scheduled digest cycle finished successfully in ${elapsedSec}s.`,
      );
      return true;
    } catch (err: unknown) {
      await this.notifyFailure(err);
      return false;
    } finally {
      this.isCycleRunning = false;
    }
  }

  /**
   * Starts the cron scheduler.
   */
  public start(): void {
    if (this.task) {
      this.logger.warn("Scheduler is already active.");
      return;
    }

    this.logger.info(
      `Starting Cron Scheduler with expression "${this.cronExpression}" in timezone "${this.timezone}"`,
    );

    this.task = cron.schedule(
      this.cronExpression,
      async () => {
        await this.executeCycle();
      },
      {
        timezone: this.timezone,
      },
    );
  }

  /**
   * Stops the cron scheduler.
   */
  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.logger.info("Cron Scheduler stopped.");
    }
  }

  public isRunning(): boolean {
    return this.isCycleRunning;
  }

  public getSchedule(): string {
    return this.cronExpression;
  }
}
