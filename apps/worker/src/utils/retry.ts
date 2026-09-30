export interface RetryOptions {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  timeoutMs?: number;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const minDelayMs = options.minDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 10000;
  const factor = options.factor ?? 2;
  const timeoutMs = options.timeoutMs ?? 15000;

  let lastError: unknown;
  let delay = minDelayMs;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const abortController = new AbortController();
      const timer = setTimeout(() => abortController.abort(), timeoutMs);

      try {
        const result = await operation(attempt);
        clearTimeout(timer);
        return result;
      } catch (innerErr) {
        clearTimeout(timer);
        throw innerErr;
      }
    } catch (err: unknown) {
      lastError = err;
      if (attempt === retries) {
        break;
      }

      const jitter = Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay + jitter, maxDelayMs)));
      delay *= factor;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
