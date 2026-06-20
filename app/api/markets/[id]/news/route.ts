import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // Retrieve news items sorted by publishedAt
    const newsItems = await prisma.newsItem.findMany({
      where: { marketId: id },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { sentiment: true },
    });

    // Mapped items
    const parsedData = newsItems.map((item: any) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      publishedAt: item.publishedAt,
      source: item.sourceId || 'rsshub',
      sentiment: item.sentiment
        ? {
            label: item.sentiment.sentiment,
            confidence: item.sentiment.confidence,
            score: item.sentiment.score,
          }
        : null,
    }));

    // Calculate aggregated metrics using decay weights
    const summary = await MarketService.getMarketSentimentSummary(id);

    // Find latest analyzed date
    const latestAnalysis = newsItems
      .filter((n: any) => n.sentiment !== null)
      .map((n: any) => n.sentiment!.analyzedAt)
      .sort((a: any, b: any) => b.getTime() - a.getTime())[0];

    return NextResponse.json({
      data: parsedData,
      summary: {
        ...summary,
        lastAnalyzedAt: latestAnalysis || null,
      },
    });
  } catch (err: any) {
    console.error('Error fetching market news:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve market news items', details: err.message },
      { status: 500 }
    );
  }
}
