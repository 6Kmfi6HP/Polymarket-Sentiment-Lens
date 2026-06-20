export interface MarketDTO {
  id: string;
  provider: string;
  question: string;
  slug?: string | null;
  category?: string | null;
  conditionId?: string | null;
  clobTokenIdsJson?: string | null;
  outcomes: string[];
  outcomePrices: number[];
  yesPrice?: number | null;
  noPrice?: number | null;
  volume?: number | null;
  liquidity?: number | null;
  endDate?: Date | null;
  rawJson: string;
  sourceUpdatedAt?: Date | null;
}

export interface ListMarketsInput {
  limit?: number;
  category?: string;
  sort?: string;
  q?: string;
  includeClosed?: boolean;
}

export interface PricePointDTO {
  capturedAt: Date;
  yesPrice: number;
  noPrice: number;
}

export interface MarketProvider {
  listMarkets(input: ListMarketsInput): Promise<MarketDTO[]>;
  getMarket(id: string): Promise<MarketDTO | null>;
  getPriceHistory(id: string): Promise<PricePointDTO[]>;
}
