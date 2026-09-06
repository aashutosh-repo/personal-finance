export interface TechnicalIndicator {
  indicator: string;
  value: number;
  signal: string;
  calculatedAt?: string;
  source?: string;
}

export interface TechnicalAnalysis {
  symbol: string;
  fromDate: string;
  toDate: string;
  recordsUsed: number;
  indicators: TechnicalIndicator[];
  macd?: { macdLine: number; signalLine: number; histogram: number; signal: string } | null;
  bollingerBands?: { lowerBand: number; middleBand: number; upperBand: number } | null;
  fiftyTwoWeeksHigh?: number;
  fiftyTwoWeeksLow?: number;
  currentPrice?: number | null;
  dailyReturn?: number | null;
  periodReturn?: number | null;
  sma20?: number | null;
  sma50?: number | null;
  sma200?: number | null;
  rsi14?: number | null;
  volatility?: number | null;
  volumeTrend?: number | null;
  trend?: string | null;
}
