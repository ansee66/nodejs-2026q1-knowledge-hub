export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  shouldRetry?: (error: any) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { retries, baseDelayMs, shouldRetry } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      const retryable = shouldRetry?.(error) ?? false;

      if (!retryable || attempt >= retries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);

      await new Promise((res) => setTimeout(res, delay));

      attempt++;
    }
  }
}
