import { MarketProvider } from './market-provider';
import { PolymarketRestProvider } from './polymarket-provider';
import { McpPolywinProvider } from './mcp-polywin-provider';

export function getMarketProvider(): MarketProvider {
  const providerType = process.env.MARKET_PROVIDER || 'polymarket_rest';
  if (providerType === 'mcp_polywin') {
    return new McpPolywinProvider();
  }
  return new PolymarketRestProvider();
}
