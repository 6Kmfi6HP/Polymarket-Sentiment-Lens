import { NextRequest, NextResponse } from 'next/server';
import { MarketService } from '@/lib/services/market-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Market ID parameter is required' }, { status: 400 });
    }

    const market = await MarketService.getMarketDetailCached(id);
    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: market,
    });
  } catch (err: any) {
    console.error('Error fetching market details:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve market details', details: err.message },
      { status: 500 }
    );
  }
}
