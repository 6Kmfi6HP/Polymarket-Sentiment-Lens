import { RSSHubProvider } from '../providers/rsshub-provider';
import { prisma } from '../db/prisma';
import { extractKeywords, normalizeUrl } from '../utils/normalize';
import { sha256 } from '../utils/hash';

export class NewsService {
  private static rsshub = new RSSHubProvider();

  /**
   * Automatically extracts market entities, queries Google News via RSSHub, 
   * normalizes URL structure, and registers new NewsItems.
   */
  static async fetchNewsForMarket(marketId: string): Promise<number> {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new Error(`Market not found for news sourcing: ${marketId}`);
    }

    // Extract up to 5 keywords
    const keywords = extractKeywords(market.question);
    if (keywords.length === 0) {
      keywords.push(market.category || 'finance');
    }

    let addedNewsCount = 0;
    const now = new Date();

    // Query RSSHub for top 3 query keyword variants to keep batch speeds quick
    const activeKeywords = keywords.slice(0, 3);

    for (const keyword of activeKeywords) {
      try {
        const path = `/google/news/search/${encodeURIComponent(keyword)}`;
        console.log(`[NewsService] Sourcing news for [${marketId}] via key [${keyword}]`);
        
        const feedItems = await this.rsshub.fetchFeed(path);
        
        // Take top 10 items for each keyword search
        const slicedItems = feedItems.slice(0, 10);

        for (const item of slicedItems) {
          const canonical = normalizeUrl(item.url);
          const urlHash = sha256(canonical);

          try {
            // Deduplicate per market item
            const existing = await prisma.newsItem.findUnique({
              where: {
                marketId_urlHash: {
                  marketId,
                  urlHash,
                },
              },
            });

            if (!existing) {
              await prisma.newsItem.create({
                data: {
                  marketId,
                  sourceId: 'rsshub',
                  title: item.title,
                  summary: item.summary || item.title,
                  url: canonical,
                  canonicalUrl: canonical,
                  urlHash,
                  publishedAt: item.publishedAt || now,
                  fetchedAt: now,
                  rawJson: item.rawJson || null,
                },
              });
              addedNewsCount++;
            }
          } catch (err) {
            console.warn(`[NewsService] Skip individual feed item recording due to error:`, err);
          }
        }
      } catch (err) {
        console.error(`[NewsService] Error fetching keyword [${keyword}]:`, err);
      }
    }

    return addedNewsCount;
  }
}
