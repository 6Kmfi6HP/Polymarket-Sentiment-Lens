import { prisma } from '../db/prisma';
import { getMarketProvider } from '../providers/market-provider-factory';
import { MarketDTO } from '../providers/market-provider';
import { TTL, isStale } from '../cache/ttl';

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  weightedScore: number;
}

export class MarketService {
  /**
   * Syncs top markets from the provider into SQLite database.
   */
  static async syncMarkets(limit = 30): Promise<{ synced: number; failed: number }> {
    const provider = getMarketProvider();
    
    try {
      const dtos = await provider.listMarkets({ limit });
      let syncedCount = 0;
      let failedCount = 0;

      for (const dto of dtos) {
        try {
          await this.upsertMarket(dto);
          syncedCount++;
        } catch (err) {
          console.error(`Failed to upsert market ${dto.id}:`, err);
          failedCount++;
        }
      }

      return { synced: syncedCount, failed: failedCount };
    } catch (err) {
      console.error('Error syncing markets from provider:', err);
      throw err;
    }
  }

  /**
   * Upserts a single market DTO into the DB, and records a price snapshot.
   */
  static async upsertMarket(dto: MarketDTO): Promise<any> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL.MARKET_DETAIL);

    // Map Yes and No prices
    let yesPrice = dto.yesPrice;
    let noPrice = dto.noPrice;

    // Standard binary outcome determination
    if (yesPrice === null && dto.outcomePrices && dto.outcomePrices.length >= 2) {
      yesPrice = dto.outcomePrices[0];
      noPrice = dto.outcomePrices[1];
    }

    const marketData = {
      provider: dto.provider,
      question: dto.question,
      slug: dto.slug || null,
      category: dto.category || null,
      conditionId: dto.conditionId || null,
      clobTokenIdsJson: dto.clobTokenIdsJson || null,
      outcomesJson: JSON.stringify(dto.outcomes),
      outcomePricesJson: JSON.stringify(dto.outcomePrices),
      yesPrice,
      noPrice,
      volume: dto.volume || 0,
      liquidity: dto.liquidity || 0,
      endDate: dto.endDate,
      active: dto.endDate ? dto.endDate > now : true,
      closed: dto.endDate ? dto.endDate <= now : false,
      rawJson: dto.rawJson,
      sourceUpdatedAt: dto.sourceUpdatedAt || now,
      fetchedAt: now,
      expiresAt,
    };

    const market = await prisma.market.upsert({
      where: { id: dto.id },
      update: marketData,
      create: {
        id: dto.id,
        ...marketData,
      },
    });

    // Record price snapshot for historical trend mapping
    if (yesPrice !== null || noPrice !== null) {
      await prisma.marketPriceSnapshot.create({
        data: {
          marketId: dto.id,
          yesPrice,
          noPrice,
          volume: dto.volume || 0,
          liquidity: dto.liquidity || 0,
          capturedAt: now,
        },
      });
    }

    return market;
  }

  /**
   * Fetches market from cache first, triggering fetch if completely missing.
   */
  static async getMarketsCached(params: {
    limit?: number;
    category?: string;
    sort?: string;
    q?: string;
    includeClosed?: boolean;
  }) {
    const limit = params.limit || 50;
    const { category, sort, q, includeClosed } = params;

    // Filter build
    const where: any = {};
    
    if (!includeClosed) {
      where.closed = false;
      where.active = true;
    }

    if (category && category.trim() !== '') {
      where.category = { equals: category, className: 'insensitive' };
    }

    if (q && q.trim() !== '') {
      where.OR = [
        { question: { contains: q } },
        { category: { contains: q } },
      ];
    }

    // Sort order definition
    let orderBy: any = { volume: 'desc' };
    if (sort === 'liquidity') orderBy = { liquidity: 'desc' };
    else if (sort === 'endDate') orderBy = { endDate: 'asc' };
    else if (sort === 'updated') orderBy = { fetchedAt: 'desc' };

    // Primary retrieval from DB cache
    const markets = await prisma.market.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        newsItems: {
          select: { id: true },
        },
      },
    });

    // Calculate aggregated sentiment indicators on-the-fly for high-fidelity responses
    const enrichedMarkets = await Promise.all(
      markets.map(async (m) => {
        const sentimentSummary = await this.getMarketSentimentSummary(m.id);
        const staleStatus = isStale(m.fetchedAt, TTL.MARKET_LIST);

        return {
          id: m.id,
          question: m.question,
          category: m.category,
          yesPrice: m.yesPrice,
          noPrice: m.noPrice,
          volume: m.volume,
          liquidity: m.liquidity,
          endDate: m.endDate,
          newsCount: m.newsItems.length,
          sentimentSummary,
          fetchedAt: m.fetchedAt,
          stale: staleStatus,
        };
      })
    );

    return enrichedMarkets;
  }

  /**
   * Retrieves specific market along with price trend records.
   */
  static async getMarketDetailCached(id: string) {
    const market = await prisma.market.findUnique({
      where: { id },
      include: {
        priceSnapshots: {
          orderBy: { capturedAt: 'asc' },
          take: 50, // Get last 50 data points for UI presentation
        },
      },
    });

    if (!market) {
      // If missing entirely from DB, try fetching directly via provider to avoid empty page
      const provider = getMarketProvider();
      const dto = await provider.getMarket(id);
      if (dto) {
        return this.upsertMarket(dto);
      }
      return null;
    }

    const staleStatus = isStale(market.fetchedAt, TTL.MARKET_DETAIL);

    return {
      ...market,
      outcomes: JSON.parse(market.outcomesJson),
      outcomePrices: JSON.parse(market.outcomePricesJson),
      priceSnapshots: market.priceSnapshots.map(s => ({
        capturedAt: s.capturedAt,
        yesPrice: s.yesPrice,
        noPrice: s.noPrice,
      })),
      stale: staleStatus,
    };
  }

  /**
   * Dynamic mathematical decay-weighted score analyzer.
   * weightedScore = sum(sentimentScore * timeDecay * sourceWeight) / sum(timeDecay * sourceWeight)
   * where timeDecay = e^(-ageHours / 72)
   */
  static async getMarketSentimentSummary(marketId: string): Promise<SentimentSummary> {
    const newsItems = await prisma.newsItem.findMany({
      where: { marketId },
      include: { sentiment: true },
    });

    let positive = 0;
    let neutral = 0;
    let negative = 0;
    
    let weightedSum = 0;
    let totalWeight = 0;
    const now = Date.now();

    for (const item of newsItems) {
      if (!item.sentiment) continue;

      const sent = item.sentiment;
      const sentimentLabel = sent.sentiment;

      if (sentimentLabel === 'Positive') positive++;
      else if (sentimentLabel === 'Negative') negative++;
      else neutral++;

      // Math Decay calculation
      const pubDate = item.publishedAt || item.fetchedAt;
      const ageHours = Math.max(0, (now - pubDate.getTime()) / (1000 * 60 * 60));
      const timeDecay = Math.exp(-ageHours / 72); // 72 hours half-decay influence
      
      const sourceWeight = 1.0; // Uniform default source weights
      const score = sent.score; // +confidence for Positive, 0 for Neutral, -confidence for Negative

      weightedSum += score * timeDecay * sourceWeight;
      totalWeight += timeDecay * sourceWeight;
    }

    const weightedScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0.0;

    return {
      positive,
      neutral,
      negative,
      weightedScore: parseFloat(weightedScore.toFixed(4)),
    };
  }
}
