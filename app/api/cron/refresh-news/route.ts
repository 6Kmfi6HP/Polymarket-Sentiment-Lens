import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { MarketService } from '@/lib/services/market-service';
import { NewsService } from '@/lib/services/news-service';
import { SentimentService } from '@/lib/services/sentiment-service';
import { RefreshService } from '@/lib/services/refresh-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authHeader = req.headers.get('Authorization');
  const secretParam = searchParams.get('secret');
  
  const providedSecret = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : secretParam;
  const CRON_SECRET = process.env.CRON_SECRET || 'replace-with-random-secret';

  // 1. Authorization validation
  if (providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lockName = 'refresh-news';
  const lockTTL = 15 * 60 * 1000; // 15 mins lock expiry

  // 2. Lock Acquisition
  const lockAcquired = await RefreshService.acquireLock(lockName, lockTTL);
  if (!lockAcquired) {
    return NextResponse.json({
      success: false,
      locked: true,
      message: 'Another news sentiment refresh cron is currently in progress.',
    }, { status: 423 });
  }

  const startTime = Date.now();
  const summary: any[] = [];

  try {
    const marketBatchLimit = parseInt(process.env.REFRESH_NEWS_MARKETS_LIMIT || '5', 10);

    // Find active markets, ordered by ones least-recently refreshed (oldest fetchedAt)
    const candidates = await prisma.market.findMany({
      where: {
        active: true,
        closed: false,
      },
      orderBy: { fetchedAt: 'asc' },
      take: marketBatchLimit,
    });

    console.log(`[Cron/News] Refreshing sentiment feed for ${candidates.length} candidate markets.`);

    for (const m of candidates) {
      const mStartTime = Date.now();
      let newsFetched = 0;
      let sentimentAnalyzed = 0;
      let sentimentReused = 0;
      let errorMsg: string | null = null;

      try {
        // A. Sourcing news stream
        newsFetched = await NewsService.fetchNewsForMarket(m.id);

        // B. Querying classification results (allowing hash duplication matching)
        const analysis = await SentimentService.analyzeMarketNews(m.id);
        sentimentAnalyzed = analysis.analyzedCount;
        sentimentReused = analysis.reuseCount;

        // C. Update fetched timestamp
        await prisma.market.update({
          where: { id: m.id },
          data: { fetchedAt: new Date() },
        });

      } catch (err: any) {
        console.error(`[Cron/News] Failed to refresh market ${m.id}:`, err);
        errorMsg = err.message || 'Error occurred';
      }

      summary.push({
        marketId: m.id,
        question: m.question.substring(0, 40) + '...',
        newsFetched,
        sentimentAnalyzed,
        sentimentReused,
        durationMs: Date.now() - mStartTime,
        error: errorMsg,
      });
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      processedCount: candidates.length,
      durationMs,
      details: summary,
    });
  } catch (err: any) {
    console.error('[Cron/News] Sourcing process crashed:', err);
    return NextResponse.json({
      success: false,
      error: 'Cron execution failed',
      details: err.message,
    }, { status: 500 });
  } finally {
    // 3. Lock Release
    await RefreshService.releaseLock(lockName);
  }
}
