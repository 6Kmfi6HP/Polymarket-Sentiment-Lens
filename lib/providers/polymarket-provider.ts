import { MarketDTO, MarketProvider, ListMarketsInput, PricePointDTO } from './market-provider';
import { withTimeout } from '../utils/timeout';
import { withRetry } from '../utils/retry';

export class PolymarketRestProvider implements MarketProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.POLYMARKET_GAMMA_BASE_URL || 'https://gamma-api.polymarket.com';
  }

  async listMarkets(input: ListMarketsInput): Promise<MarketDTO[]> {
    const limit = input.limit || 30;
    
    // We fetch active and closed markets conditionally. 
    // Usually, we want active=true for typical listing.
    const activeQuery = input.includeClosed ? '' : 'active=true&closed=false&';
    let url = `${this.baseUrl}/markets?${activeQuery}limit=${limit}`;
    
    if (input.q) {
      url = `${this.baseUrl}/markets?${activeQuery}search=${encodeURIComponent(input.q)}&limit=${limit}`;
    } else if (input.category) {
      // Gamma API category filter
      url = `${this.baseUrl}/markets?${activeQuery}tag=${encodeURIComponent(input.category)}&limit=${limit}`;
    }

    const fetchFn = async () => {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`Polymarket REST listing failed: ${res.status}`);
      return res.json();
    };

    try {
      const data = await withRetry(
        () => withTimeout(fetchFn(), 10000, 'Polymarket REST listing timeout'),
        2,
        1000
      );
      if (!Array.isArray(data)) return [];

      return data
        .map((m: any) => this.mapToDTO(m))
        .filter((m): m is MarketDTO => m !== null);
    } catch (err) {
      console.error('Error listing Polymarket markets REST:', err);
      return [];
    }
  }

  async getMarket(id: string): Promise<MarketDTO | null> {
    const url = `${this.baseUrl}/markets/${id}`;
    const fetchFn = async () => {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`Polymarket REST getMarket failed: ${res.status}`);
      return res.json();
    };

    try {
      const data = await withRetry(
        () => withTimeout(fetchFn(), 10000, 'Polymarket REST getMarket timeout'),
        2,
        1000
      );
      if (!data || !data.id) return null;
      return this.mapToDTO(data);
    } catch (err) {
      console.error(`Error fetching Polymarket market REST [${id}]:`, err);
      return null;
    }
  }

  async getPriceHistory(id: string): Promise<PricePointDTO[]> {
    // Under REST, price snapshots are captured and stored historically in our DB.
    // The provider interface itself does not hit internal Polymarket CLOB price charts directly
    // in order to avoid heavy endpoints and timeouts.
    return [];
  }

  private mapToDTO(m: any): MarketDTO | null {
    try {
      if (!m.id || !m.question) return null;

      let outcomes: string[] = ['Yes', 'No'];
      if (m.outcomes) {
        if (Array.isArray(m.outcomes)) {
          outcomes = m.outcomes.map(String);
        } else if (typeof m.outcomes === 'string') {
          try {
            outcomes = JSON.parse(m.outcomes);
          } catch {
            outcomes = [m.outcomes];
          }
        }
      }

      let outcomePrices: number[] = [0.5, 0.5];
      if (m.outcomePrices) {
        if (Array.isArray(m.outcomePrices)) {
          outcomePrices = m.outcomePrices.map((p: any) => parseFloat(p) || 0);
        } else if (typeof m.outcomePrices === 'string') {
          try {
            outcomePrices = JSON.parse(m.outcomePrices).map((p: any) => parseFloat(p) || 0);
          } catch {
            outcomePrices = [parseFloat(m.outcomePrices) || 0];
          }
        }
      }

      let yesPrice = outcomePrices[0] !== undefined ? outcomePrices[0] : null;
      let noPrice = outcomePrices[1] !== undefined ? outcomePrices[1] : null;

      // Handle specific binary naming or structure
      if (yesPrice === null && m.yesPrice !== undefined) yesPrice = parseFloat(m.yesPrice) || null;
      if (noPrice === null && m.noPrice !== undefined) noPrice = parseFloat(m.noPrice) || null;

      const volume = m.volume ? parseFloat(m.volume) : 0;
      const liquidity = m.liquidity ? parseFloat(m.liquidity) : 0;

      let endDate: Date | null = null;
      if (m.endDate) endDate = new Date(m.endDate);
      else if (m.end_date) endDate = new Date(m.end_date);

      return {
        id: String(m.id),
        provider: 'polymarket_rest',
        question: m.question,
        slug: m.slug || null,
        category: m.category || null,
        conditionId: m.conditionId || null,
        clobTokenIdsJson: m.clobTokenIds ? JSON.stringify(m.clobTokenIds) : null,
        outcomes,
        outcomePrices,
        yesPrice,
        noPrice,
        volume,
        liquidity,
        endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
        rawJson: JSON.stringify(m),
        sourceUpdatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
      };
    } catch (err) {
      console.error('Error parsing Polymarket market properties:', err);
      return null;
    }
  }
}
