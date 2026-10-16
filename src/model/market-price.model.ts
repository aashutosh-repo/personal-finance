export interface MarketPrice {
  priceDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
  dataClassification?: 'SYNTHETIC' | 'PROVIDER_SOURCED' | 'UNKNOWN';
  dataQualityWarnings?: string[];
}