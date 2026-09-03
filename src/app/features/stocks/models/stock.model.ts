export interface FundamentalsOverviewResponse {
  symbol: string;
  asOfDate: string; // YYYY-MM-DD

  latestRevenue: number | null;
  revenueGrowthRateYoY: number | null;
  revenueCAGR: number | null;

  latestEbit: number | null;
  ebitMargin: number | null;

  latestNetIncome: number | null;
  netMargin: number | null;
  latestOperatingCashFlow: number | null;
  freeCashFlow: number | null;
  fcfMargin: number | null;

  totalDebt: number | null;
  totalEquity: number | null;
  debtToEquityRatio: number | null;

  currentRatio: number | null;
  roe: number | null;
  roa: number | null;

  yearOfData: number;

  historicalStatement: FinancialStatementResponse[];
}


export interface FinancialStatementResponse {
  symbol: string;
  fiscalYear: number;
  fiscalQuarter: number;
  reportDate: string; // YYYY-MM-DD

  revenue: number | null;
  operatingIncome: number | null;
  ebit: number | null;
  netIncome: number | null;

  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null;

  totalAssets: number | null;
  totalLiability: number | null;
  totalEquity: number | null;
  totalDebt: number | null;
  cash: number | null;
  workingCapital: number | null;

  source: string | null;
}

export interface TechnicalAnalysis {
  symbol: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  recordsUsed: number;

  indicators: TechnicalIndicator[];

  macd: MacdResult | null;
  bollingerBands: BollingerBands | null;

  fiftyTwoWeeksHigh: number | null;
  fiftyTwoWeeksLow: number | null;
}

export interface TechnicalIndicator {
  indicator: string;
  value: number;
  signal: string | null;
  calculatedAt: string; // ISO datetime
  source: string | null;
}

export interface MacdResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
  signal: string | null;
}

export interface BollingerBands {
  lowerBand: number;
  middleBand: number;
  upperBand: number;
}

export interface DcfValuationResponse {
  symbol: string;
  enterpriseValue: number;
  intrinsicValuePerShare: number;
  projectedFreeCashFlow: number[];
}

export interface DcfFromFundamentalsRequest {
  revenueGrowthRateOverride?: number | null;
  ebitMarginOverride?: number | null;
  capexPercentOfRevenueOverride?: number | null;
  workingCapitalPercentOfRevenueOverride?: number | null;

  taxRate: number;
  wacc: number;
  terminalGrowthRate: number;
  shareOutstanding: number;

  projectionYear: number;
}
