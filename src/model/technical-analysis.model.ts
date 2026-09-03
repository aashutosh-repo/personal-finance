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
}


export interface WatchlistEntry {
    symbol: string;
    addedAt: string;
    targetPrice: number | null;
    alertOnDrop: number | null;
    notes?: string
}