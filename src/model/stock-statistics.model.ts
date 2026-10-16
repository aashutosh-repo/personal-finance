export interface StockStatistics {
  symbol: string;
  fromDate: string;
  toDate: string;

  startPrice: number;
  endPrice: number;

  highestPrice: number;
  lowestPrice: number;

  averagePrice: number;

  priceChange: number;
  priceChangePercentage: number | null;
  provider?: string | null;
  dataClassification?: 'SYNTHETIC' | 'PROVIDER_SOURCED' | 'UNKNOWN';
  actualFromDate?: string | null;
  actualToDate?: string | null;
  dataQualityWarnings?: string[];
}