const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const MAX_BUCKETS = 10_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(clientIp: string, now = Date.now()): number {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  const bucket = buckets.get(clientIp);

  if (bucket) {
    if (bucket.count >= MAX_REQUESTS) {
      return Math.ceil((bucket.resetAt - now) / 1000);
    }

    bucket.count++;
    return 0;
  }

  if (buckets.size >= MAX_BUCKETS) return 60;

  buckets.set(clientIp, { count: 1, resetAt: now + WINDOW_MS });
  return 0;
}
