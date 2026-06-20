import { withTimeout } from '../utils/timeout';
import { withRetry } from '../utils/retry';

export interface FinbertResult {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  confidence: number;
  score: number;
  rawJson: string;
}

export class FinbertProvider {
  private apiUrl: string;
  private timeoutMs: number;

  constructor() {
    this.apiUrl = process.env.FINBERT_API_URL || 'https://3kmfi6hp-finbert-sentiment-api.hf.space/predict';
    this.timeoutMs = parseInt(process.env.FINBERT_TIMEOUT_MS || '20000', 10);
  }

  /**
   * Predicts sentiment for a given title/summary.
   */
  async predict(text: string): Promise<FinbertResult | null> {
    if (!text || text.trim() === '') {
      return {
        sentiment: 'Neutral',
        confidence: 1.0,
        score: 0.0,
        rawJson: '{"info": "Empty text supplied"}',
      };
    }

    // Limit text size to 512 characters to remain safety-bound
    const cleanText = text.length > 512 ? text.substring(0, 512) : text;
    
    const fetchFn = async () => {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!res.ok) {
        throw new Error(`FinBERT API returned HTTP error: ${res.status}`);
      }

      return res.json();
    };

    try {
      const data = await withRetry(
        () => withTimeout(fetchFn(), this.timeoutMs, `FinBERT API timed out after ${this.timeoutMs}ms`),
        2,
        300
      );

      if (!data || !data.sentiment) {
        throw new Error('FinBERT API response was empty or incorrectly structured');
      }

      // Check classification mapping and normalize
      let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
      const label = String(data.sentiment).trim().toLowerCase();
      
      if (label.includes('positive') || label.startsWith('pos')) {
        sentiment = 'Positive';
      } else if (label.includes('negative') || label.startsWith('neg')) {
        sentiment = 'Negative';
      } else if (label.includes('neutral') || label.startsWith('neu')) {
        sentiment = 'Neutral';
      }

      const confidence = typeof data.confidence === 'number' ? data.confidence : (parseFloat(data.confidence) || 0.5);

      // Score assignment as per PRD:
      // Positive: +confidence
      // Neutral: 0
      // Negative: -confidence
      let score = 0.0;
      if (sentiment === 'Positive') {
        score = confidence;
      } else if (sentiment === 'Negative') {
        score = -confidence;
      }

      return {
        sentiment,
        confidence,
        score,
        rawJson: JSON.stringify(data),
      };
    } catch (err) {
      console.warn(`[FinbertProvider] Sentiment analysis query failed:`, err);
      return null;
    }
  }
}
