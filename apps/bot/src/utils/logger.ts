export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private level: LogLevel;
  private context: Record<string, unknown>;

  constructor(context: Record<string, unknown> = {}, level: LogLevel = "info") {
    this.context = context;
    const envLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || level;
    this.level = LOG_LEVELS[envLevel] !== undefined ? envLevel : "info";
  }

  public child(subContext: Record<string, unknown>): Logger {
    return new Logger({ ...this.context, ...subContext }, this.level);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...this.context,
      ...meta,
    };

    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(payload);
    }

    const contextStr =
      Object.keys(this.context).length > 0
        ? ` [${Object.entries(this.context)
            .map(([k, v]) => `${k}=${v}`)
            .join(" ")}]`
        : "";
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}${metaStr}`;
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, meta));
    }
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, meta));
    }
  }
}

export const logger = new Logger({ service: "bot" });
