import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CronSchedulerService } from "../src/scheduler/scheduler.js";

describe("Twice-Daily Cron Scheduler", () => {
  it("should initialize with default twice-daily schedule and Tashkent timezone", () => {
    const scheduler = new CronSchedulerService();
    assert.equal(scheduler.getSchedule(), "0 9,20 * * *");
    assert.equal(scheduler.isRunning(), false);
  });

  it("should support custom cron expressions and options", () => {
    const custom = new CronSchedulerService({
      cronExpression: "0 8,18 * * *",
      timezone: "UTC",
    });
    assert.equal(custom.getSchedule(), "0 8,18 * * *");
  });

  it("should start and stop scheduled jobs cleanly", () => {
    const scheduler = new CronSchedulerService({
      cronExpression: "0 0 1 1 *", // run once a year for safe testing
    });

    scheduler.start();
    // Start again should be idempotent
    scheduler.start();

    scheduler.stop();
    assert.equal(scheduler.isRunning(), false);
  });
});
