import { prisma } from '../db/prisma';
import { FinbertProvider } from '../providers/finbert-provider';
import { sha256 } from '../utils/hash';

export class SentimentService {
  private static finbert = new FinbertProvider();

  /**
   * Run FinBERT sentiment analysis on all unanalyzed news items of a market.
   * Leverages text-hash de-duplication to reuse existing analyses.
   */
  static async analyzeMarketNews(marketId: string): Promise<{ analyzedCount: number; reuseCount: number; failedCount: number }> {
    // Find news for the market that do not have any sentiment analyzed yet
    const unanalyzedNews = await prisma.newsItem.findMany({
      where: {
        marketId,
        sentiment: { is: null },
      },
      take: 15, // Keep batch limits controlled
    });

    let analyzedCount = 0;
    let reuseCount = 0;
    let failedCount = 0;

    for (const item of unanalyzedNews) {
      const textToAnalyze = item.title;
      const textHash = sha256(textToAnalyze);

      try {
        // 1. Text-hash deduplication: check if this text has already been parsed anywhere in the DB
        const existingSentiment = await prisma.sentimentResult.findFirst({
          where: { textHash },
        });

        if (existingSentiment) {
          // Skip API and duplicate the database entry
          await prisma.sentimentResult.create({
            data: {
              newsItemId: item.id,
              textHash,
              inputText: existingSentiment.inputText,
              sentiment: existingSentiment.sentiment,
              confidence: existingSentiment.confidence,
              score: existingSentiment.score,
              model: existingSentiment.model,
              rawJson: existingSentiment.rawJson,
              analyzedAt: new Date(),
            },
          });
          reuseCount++;
        } else {
          // 2. Query the FinBERT Endpoint
          const result = await this.finbert.predict(textToAnalyze);
          
          if (result) {
            await prisma.sentimentResult.create({
              data: {
                newsItemId: item.id,
                textHash,
                inputText: textToAnalyze,
                sentiment: result.sentiment,
                confidence: result.confidence,
                score: result.score,
                model: 'FinBERT',
                rawJson: result.rawJson,
                analyzedAt: new Date(),
              },
            });
            analyzedCount++;
          } else {
            failedCount++;
          }
        }
      } catch (err) {
        console.error(`[SentimentService] Error processing news item sentiment [${item.id}]:`, err);
        failedCount++;
      }
    }

    return { analyzedCount, reuseCount, failedCount };
  }
}
