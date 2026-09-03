import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { Company } from '../../../../../model/company.model';
import { MarketPrice } from '../../../../../model/market-price.model';
import { StockStatistics } from '../../../../../model/stock-statistics.model';
import { TechnicalAnalysis } from '../../../../../model/technical-analysis.model';
import { StockCompanyService } from '../../../../service/stocks/stock-company.service';
import { StockMarketService } from '../../../../service/stocks/stock-market.service';
import { ChatbotService } from '../../../../service/tansaction/chatbot.service';
import { AuthService } from '../../../../service/auth/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-stock-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './stock-analysis.component.html',
  styleUrls: ['./stock-analysis.component.scss']
})
export class StockAnalysisComponent implements OnInit {
  companies: Company[] = [];
  selectedSymbol = '';
  fromDate = '';
  toDate = '';
  prices: MarketPrice[] = [];
  statistics: StockStatistics | null = null;
  technical: TechnicalAnalysis | null = null;
  loadingCompanies = false;
  loadingAnalysis = false;
  loadingAi = false;
  aiError = false;
  aiResponse = '';
  errorMessage = '';
  chartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => ` ₹${Number(context.parsed.y || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
      y: { ticks: { callback: (value) => `₹${Number(value).toLocaleString('en-IN')}` } }
    }
  };
  constructor(
    private readonly companyService: StockCompanyService,
    private readonly marketService: StockMarketService,
    private readonly chatbotService: ChatbotService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
    const today = new Date();
    this.toDate = today.toISOString().split('T')[0];
    this.fromDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  }

  loadCompanies(): void {
    this.loadingCompanies = true;
    this.errorMessage = '';
    this.companyService.getCompanies().subscribe({
      next: (companies) => { this.companies = companies; this.loadingCompanies = false; },
      error: () => { this.errorMessage = 'Unable to load stock information. Please try again.'; this.loadingCompanies = false; }
    });
  }

  analyzeStock(): void {
    this.errorMessage = '';
    this.statistics = null;
    this.technical = null;
    this.prices = [];
    this.aiResponse = '';
    this.aiError = false;

    if (!this.selectedSymbol) { this.errorMessage = 'Select a stock to continue.'; return; }
    if (!this.fromDate || !this.toDate) { this.errorMessage = 'Select a date range to continue.'; return; }
    if (this.fromDate > this.toDate) { this.errorMessage = 'From date cannot be after To date.'; return; }

    this.loadingAnalysis = true;
    forkJoin({
      statistics: this.marketService.getStatistics(this.selectedSymbol, this.fromDate, this.toDate),
      prices: this.marketService.getPrices(this.selectedSymbol, this.fromDate, this.toDate),
      technical: this.marketService.getTechnicalAnalysis(this.selectedSymbol, this.fromDate, this.toDate)
    }).subscribe({
      next: (result) => {
        this.statistics = result.statistics;
        this.prices = result.prices;
        this.technical = result.technical;
        this.setChartData();
        this.loadingAnalysis = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load stock information. Please try again.';
        this.loadingAnalysis = false;
      }
    });
  }

  analyzeAi(): void {
    const userId = this.authService.getCurrentUserID();
    if (!userId || !this.selectedSymbol) return;
    this.loadingAi = true;
    this.aiError = false;
    this.chatbotService.sendMessage({
      userId,
      message: `Provide a grounded stock analysis for ${this.selectedSymbol} using the historical period ${this.fromDate} to ${this.toDate}. Clearly separate observations, risks, and uncertainty. Do not present this as financial advice.`
    }).subscribe({
      next: (response) => {
        this.aiResponse = response.success && response.data?.response ? response.data.response : '';
        this.aiError = !this.aiResponse;
        this.loadingAi = false;
      },
      error: () => { this.aiError = true; this.loadingAi = false; }
    });
  }

  getPerformanceClass(): string {
    if (!this.statistics) return '';
    return this.statistics.percentageChange > 0 ? 'positive' : this.statistics.percentageChange < 0 ? 'negative' : 'neutral';
  }

  getSelectedCompany(): Company | undefined {
    return this.companies.find((company) => company.symbol === this.selectedSymbol);
  }

  private setChartData(): void {
    this.chartData = {
      labels: this.prices.map((price) => price.priceDate),
      datasets: [{ data: this.prices.map((price) => Number(price.close)), label: 'Closing price', borderColor: '#0f766e', backgroundColor: 'rgba(15, 118, 110, 0.12)', fill: true, tension: 0.25, pointRadius: 0, pointHoverRadius: 4 }]
    };
  }

  formatAiResponse(response: string): string { return response.replace(/\n/g, '<br>'); }
}