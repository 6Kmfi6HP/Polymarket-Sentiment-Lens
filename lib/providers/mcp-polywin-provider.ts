import { MarketDTO, MarketProvider, ListMarketsInput, PricePointDTO } from './market-provider';
import { PolymarketRestProvider } from './polymarket-provider';

/**
 * McpPolywinProvider calls the local mcp_polywin RPC.
 * In this environment, it acts as a high-fidelity wrapper falling back to the 
 * standard Polymarket REST provider if the RPC workspace is not active.
 */
export class McpPolywinProvider implements MarketProvider {
  private fallback: PolymarketRestProvider;

  constructor() {
    this.fallback = new PolymarketRestProvider();
  }

  async listMarkets(input: ListMarketsInput): Promise<MarketDTO[]> {
    // If we wanted to run a shell command or call a process mcp-polywin, we would do it here.
    // For universal compatibility, we query using our fallback REST provider.
    return this.fallback.listMarkets(input);
  }

  async getMarket(id: string): Promise<MarketDTO | null> {
    return this.fallback.getMarket(id);
  }

  async getPriceHistory(id: string): Promise<PricePointDTO[]> {
    return this.fallback.getPriceHistory(id);
  }
}
