import { NextRequest, NextResponse } from 'next/server';
import { MarketService } from '@/lib/services/market-service';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query params
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const category = searchParams.get('category') || undefined;
    const sort = searchParams.get('sort') || 'volume';
    const q = searchParams.get('q') || undefined;
    const includeClosed = searchParams.get('includeClosed') === 'true';

    // Bootstrap if completely empty - excellent first-time UX bootstrap
    const count = await prisma.market.count();
    if (count === 0) {
      console.log('[API/Markets] Cache is empty. Bootstrapping initial market list...');
      try {
        await MarketService.syncMarkets(40);
      } catch (err) {
        console.error('[API/Markets] Bootstrapping failed:', err);
      }
    }

    const data = await MarketService.getMarketsCached({
      limit,
      category,
      sort,
      q,
      includeClosed,
    });

    const staleCount = data.filter((m: any) => m.stale).length;

    return NextResponse.json({
      data,
      meta: {
        limit,
        staleCount,
      },
    });
  } catch (err: any) {
    console.error('Error fetching markets list:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve markets list', details: err.message },
      { status: 500 }
    );
  }
}
