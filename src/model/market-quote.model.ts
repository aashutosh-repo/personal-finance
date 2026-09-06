export interface MarketQuote {
  symbol: string;
  companyName: string;
  exchange?: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketTime: string;
  fetchedAt: string;
  source: string;
  marketStatus: 'OPEN' | 'CLOSED' | string;
}
