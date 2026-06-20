import { prisma } from '../db/prisma';
import { JobService } from './job-service';
import { NewsService } from './news-service';
import { SentimentService } from './sentiment-service';
import { MarketService } from './market-service';

export class RefreshService {
  /**
   * Triggers an asynchronous, non-blocking refresh of news and sentiment scores for a single market.
   * Updates Job status audit trial along the execution path.
   */
  static async runBackgroundRefresh(jobId: string, marketId: string): Promise<void> {
    try {
      await JobService.startJob(jobId, { marketId });
      
      console.log(`[RefreshService] Started background job [${jobId}] for market [${marketId}]`);
      
      // 1. Fetch live News items
      const newsFetched = await NewsService.fetchNewsForMarket(marketId);

      // 2. Perform sentiment classifications on unanalyzed records
      const { analyzedCount, reuseCount, failedCount } = await SentimentService.analyzeMarketNews(marketId);

      // 3. Mark cache as newly updated by setting current time to fetchedAt in Market
      await prisma.market.update({
        where: { id: marketId },
        data: {
          fetchedAt: new Date(),
        },
      });

      console.log(`[RefreshService] Finished background job [${jobId}]: Fetched=${newsFetched}, Analyzed=${analyzedCount}, Reused=${reuseCount}, Failed=${failedCount}`);

      await JobService.completeJob(jobId, {
        marketId,
        newsFetched,
        sentimentAnalyzed: analyzedCount,
        sentimentReused: reuseCount,
        sentimentFailed: failedCount,
      });
    } catch (err: any) {
      console.error(`[RefreshService] Background job [${jobId}] failed:`, err);
      await JobService.failJob(jobId, err.message || 'Unknown error occurred during background refresh', { marketId });
    }
  }

  /**
   * Acquires a global lock inside SQLite database to prevent concurrent cron runs.
   */
  static async acquireLock(name: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    const owner = `process-${process.pid || 'universal'}`;

    try {
      const lock = await prisma.cronLock.findUnique({
        where: { name },
      });

      // If lock exists and is active, we cannot acquire it
      if (lock && lock.expiresAt > now) {
        return false;
      }

      // Lock is either missing or expired - we upsert it
      await prisma.cronLock.upsert({
        where: { name },
        update: {
          lockedAt: now,
          expiresAt,
          owner,
        },
        create: {
          name,
          lockedAt: now,
          expiresAt,
          owner,
        },
      });

      return true;
    } catch (err) {
      console.error(`[RefreshService] Failed to acquire lock [${name}]:`, err);
      return false;
    }
  }

  /**
   * Releases a global cron lock.
   */
  static async releaseLock(name: string): Promise<void> {
    try {
      await prisma.cronLock.deleteMany({
        where: { name },
      });
    } catch (err) {
      console.error(`[RefreshService] Failed to release lock [${name}]:`, err);
    }
  }
}
