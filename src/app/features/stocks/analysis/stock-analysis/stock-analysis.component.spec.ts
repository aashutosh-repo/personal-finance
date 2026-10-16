import { StockAnalysisComponent } from './stock-analysis.component';

function createComponent(): StockAnalysisComponent {
  return new StockAnalysisComponent({} as never, {} as never, {} as never);
}

describe('StockAnalysisComponent provenance', () => {
  it('reports synthetic data when all returned price rows are synthetic', () => {
    const component = createComponent();
    component.prices = [
      { priceDate: '2026-10-09', open: 100, high: 101, low: 99, close: 100, volume: 10, source: 'MOCK', dataClassification: 'SYNTHETIC' }
    ];

    expect(component.getMarketDataClassification()).toBe('SYNTHETIC');
  });

  it('keeps missing provenance unknown for legacy response rows', () => {
    const component = createComponent();
    component.prices = [
      { priceDate: '2026-10-09', open: 100, high: 101, low: 99, close: 100, volume: 10, source: 'UNSPECIFIED' }
    ];

    expect(component.getMarketDataClassification()).toBe('UNKNOWN');
  });

  it('does not collapse mixed provider classifications into a verified source', () => {
    const component = createComponent();
    component.prices = [
      { priceDate: '2026-10-09', open: 100, high: 101, low: 99, close: 100, volume: 10, source: 'MOCK', dataClassification: 'SYNTHETIC' },
      { priceDate: '2026-10-12', open: 100, high: 101, low: 99, close: 100, volume: 10, source: 'FEED', dataClassification: 'PROVIDER_SOURCED' }
    ];

    expect(component.getMarketDataClassification()).toBe('UNKNOWN');
  });
});
