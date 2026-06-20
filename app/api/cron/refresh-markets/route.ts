import { NextRequest, NextResponse } from 'next/server';
import { MarketService } from '@/lib/services/market-service';
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

  const lockName = 'refresh-markets';
  const lockTTL = 10 * 60 * 1000; // 10 minutes lock expiry

  // 2. Lock Acquisition
  const lockAcquired = await RefreshService.acquireLock(lockName, lockTTL);
  if (!lockAcquired) {
    return NextResponse.json({
      success: false,
      locked: true,
      message: 'Another market refresh operation is currently in progress.',
    }, { status: 423 }); // Locked
  }

  const startTime = Date.now();

  try {
    const limit = parseInt(process.env.REFRESH_MARKETS_LIMIT || '50', 10);
    const syncResult = await MarketService.syncMarkets(limit);

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      synced: syncResult.synced,
      skipped: syncResult.failed,
      durationMs,
    });
  } catch (err: any) {
    console.error('[Cron/Markets] Sync process crashed:', err);
    return NextResponse.json({
      success: false,
      error: 'Triggered execution failed',
      details: err.message,
    }, { status: 500 });
  } finally {
    // 3. Guarantee Lock Release
    await RefreshService.releaseLock(lockName);
  }
}
