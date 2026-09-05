import { Component, inject, OnInit, signal } from '@angular/core';
import { SharedMaterialModules } from '../../../service/common/shared-material.module';
import { ActivatedRoute, Router } from '@angular/router';
import { WatchlitService } from '../../../service/stocks/watchlist.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DcfFromFundamentalsRequest, DcfValuationResponse, FundamentalsOverviewResponse, StockScore, TechnicalAnalysis } from '../models/stock.model';
import { StockService } from '../../../service/stocks/stock.service';

@Component({
  selector: 'app-stock-details',
  standalone: true,
  imports: [SharedMaterialModules],
  templateUrl: './stock-details.component.html',
  styleUrl: './stock-details.component.scss'
})
export class StockDetailsComponent implements OnInit{

  private route =inject(ActivatedRoute);
  private router = inject(Router);
  private stockService = inject(StockService);
  private watchlistService = inject(WatchlitService)
  private snackbar = inject(MatSnackBar);

  readonly symbol = signal<string>('');

  readonly loadingFundamentals = signal(false);
  readonly loadingTechnical = signal(false);
  readonly loadingDcf = signal(false);
  readonly loadingScore = signal(false);

  readonly fundamentals = signal<FundamentalsOverviewResponse| null>(null);
  readonly technicals = signal<TechnicalAnalysis | null>(null);
  readonly dcf = signal<DcfValuationResponse | null>(null);
  readonly score = signal<StockScore | null> (null);

  readonly errorFundamentals = signal<String | null>(null);
  readonly errorTechnicals = signal<String | null>(null);
  readonly errorDcf = signal<String | null>(null);
  readonly errorScore = signal<String | null>(null);

  dcfInput: DcfFromFundamentalsRequest ={
    revenueGrowthRateOverride: null,
    ebitMarginOverride: null,
    capexPercentOfRevenueOverride: null,
    workingCapitalPercentOfRevenueOverride: null,
    taxRate: 0.25,
    wacc: 0.09,
    terminalGrowthRate: 0.025,
    shareOutstanding: 1_000_000_00,
    projectionYear: 5,
  }

  scoreInput: Partial<StockScore> = {
    fundamentalScore: 70,
    growthScore: 65,
    valuationScore: 60,
    financialHealthScore: 75,
    technicalScore: 55,
    sentimentScore: 60,
    riskScore: 50
  }

  readonly historyColumns = [
    'fiscalYear',
    'fiscalQuarter',
    'reportDate',
    'revenue',
    'ebit',
    'netIncome',
    'freeCashFlow'
  ]

  readonly technicalColumns = ['indicator', 'value', 'signal'];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const sym = (params.get('symbol') ||'').toUpperCase();
      this.symbol.set(sym);
      if(sym) {
        this.loadAll(sym);
      }
    })
  }

  loadAll(symbol: string): void {
    this.loadFundamentals(symbol);
    this.loadTechnical(symbol);
  }

  loadFundamentals(symbol: string): void{
    this.loadingFundamentals.set(true);
    this.errorFundamentals.set(null);
    this.stockService.getFundamentals(symbol).subscribe({
      next: (data) => {
        this.fundamentals.set(data);
        this.loadingFundamentals.set(false);
      },
      error: (err) => {
        this.errorFundamentals.set(err?.error?.message || 'Failed to load fundamentals');
        this.loadingFundamentals.set(false);
      }
    })
  }

  loadTechnical(symbol: string) : void{
    this.loadingTechnical.set(true);
    this.errorTechnicals.set(null);

    const to = new Date();
    const from = new Date();
    from.setFullYear(to.getFullYear() - 1)

    const fromStr = from.toISOString().slice(0,10);
    const toStr = to.toISOString().slice(0,10);
    this.stockService.getTechnicalAnalysis(symbol, fromStr, toStr, 14).subscribe({
      next: (data) => {
        this.technicals.set(data);
        this.loadingTechnical.set(false)
      }, 
      error : (err) => {
        this.errorTechnicals.set(err?.error?.message || 'Failed to load technical Data');
      }
    });
  }


  runDcf(): void {
    const sym = this.symbol();
    if(!sym) {
      return;
    }
    this.loadingDcf.set(true);
    this.errorDcf.set(null);

    this.stockService.calculateDcfFromFundamentals(sym, this.dcfInput).subscribe({
      next: (data) => {
        this.dcf.set(data);
        this.loadingDcf.set(false);
      },
      error: (err) => {
        this.errorDcf.set(err?.error?.message || 'DCF calculation Failed');
        this.loadingDcf.set(false);
      }
    })
  }

  runScore(): void {
    const sym = this.symbol();
    if (!sym) return;

    this.loadingScore.set(true);
    this.errorScore.set(null);

    this.stockService.calculateScore(sym, this.scoreInput).subscribe({
      next: (data) => {
        this.score.set(data);
        this.loadingScore.set(false);
      },
      error: (err) => {
        this.errorScore.set(err?.error?.message || 'Score Calculaition Failed')
      }
    })
  }


  IsInWatchList(): boolean {
    return this.watchlistService.has(this.symbol());
  }

  toggleWatchList(): void{
    const sym = this.symbol();
    if(!sym) return;

    if(this.IsInWatchList()) {
      this.watchlistService.remove(sym);
      this.snackbar.open(`${sym} removed from watchlist`, 'OK', {duration: 2000});
    } else {
      this.watchlistService.add(sym);
      this.snackbar.open(`${sym} added from watchlist`, 'OK', {duration: 2000})
    }
  }

  goToResearch(): void {
    this.router.navigate(['/v1/stocks/research'], {queryParams : { symbol: this.symbol()}})
  }

  getFcfBarHeight(value: number, values: number[]): number {
    if (!values?.length) {
      return 0;
    }

    const max = Math.max(...values.map(v => Math.abs(v)));

    if (max === 0) {
      return 0;
    }

    return (Math.abs(value) / max) * 100;
  }

  getMaxCashFlow(values: number[] | null | undefined): number {
    if (!values?.length) {
      return 1;
    }

    return Math.max(...values.map((value) => Math.abs(value)), 1);
  }

  macdSignal() : 'bullish' | 'bearish' | 'neutral' {
    const macd = this.technicals()?.macd;
    if(!macd) return 'neutral';
    if(macd.histogram > 0) return 'bullish';
    if(macd.histogram < 0) return 'bearish';
    return 'neutral';

  }
}
