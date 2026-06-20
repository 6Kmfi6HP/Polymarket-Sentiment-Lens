export const CACHE_KEYS = {
  MARKETS_LIST: '/api/markets',
  MARKET_DETAIL: (id: string) => `/api/markets/${id}`,
  MARKET_NEWS: (id: string) => `/api/markets/${id}/news`,
  JOB_STATUS: (id: string) => `/api/jobs/${id}`,
};
