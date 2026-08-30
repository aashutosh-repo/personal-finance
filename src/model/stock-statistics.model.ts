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
  percentageChange: number;
}