export const TTL = {
  MARKET_LIST: 60 * 1000, // 60 seconds
  MARKET_DETAIL: 60 * 1000, // 60 seconds
  PRICE_SNAPSHOT: 60 * 1000, // 60 seconds
  NEWS_LIST: 15 * 60 * 1000, // 15 minutes
  AGGREGATED_SENTIMENT: 5 * 60 * 1000, // 5 minutes
  JOB_STATUS: 24 * 60 * 60 * 1000, // 24 hours
};

export function isStale(fetchedAt: Date | string | null, ttlMs: number): boolean {
  if (!fetchedAt) return true;
  const fetched = new Date(fetchedAt).getTime();
  const now = Date.now();
  return now - fetched > ttlMs;
}
