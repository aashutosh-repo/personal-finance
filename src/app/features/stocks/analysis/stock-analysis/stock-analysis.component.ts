import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Company } from '../../../../../model/company.model';
import { MarketPrice } from '../../../../../model/market-price.model';
import { StockStatistics } from '../../../../../model/stock-statistics.model';
import { StockCompanyService } from '../../../../service/stocks/stock-company.service';
import { StockMarketService } from '../../../../service/stocks/stock-market.service';


@Component({
  selector: 'app-stock-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
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

  loadingCompanies = false;

  loadingAnalysis = false;

  errorMessage = '';

  constructor(
    private readonly companyService: StockCompanyService,
    private readonly marketService: StockMarketService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {

    this.loadingCompanies = true;

    this.companyService
      .getCompanies()
      .subscribe({
        next: (companies) => {
          this.companies = companies;
          this.loadingCompanies = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load companies.';
          this.loadingCompanies = false;
        }
      });
  }

  analyzeStock(): void {

    this.errorMessage = '';
    this.statistics = null;
    this.prices = [];

    if (!this.selectedSymbol) {
      this.errorMessage = 'Please select a company.';
      return;
    }

    if (!this.fromDate || !this.toDate) {
      this.errorMessage = 'Please select a date range.';
      return;
    }

    if (this.fromDate > this.toDate) {
      this.errorMessage =
        'From date cannot be after To date.';
      return;
    }

    this.loadingAnalysis = true;

    forkJoin({
      statistics: this.marketService.getStatistics(
        this.selectedSymbol,
        this.fromDate,
        this.toDate
      ),

      prices: this.marketService.getPrices(
        this.selectedSymbol,
        this.fromDate,
        this.toDate
      )
    }).subscribe({

      next: (result) => {

        this.statistics = result.statistics;
        this.prices = result.prices;
        console.log(this.prices);

        this.loadingAnalysis = false;
      },

      error: (error) => {

        console.error(
          'Failed to analyze stock',
          error
        );

        this.errorMessage =
          error?.error?.message ||
          'Failed to retrieve stock analysis.';

        this.loadingAnalysis = false;
      }

    });
  }

  getPerformanceClass(): string {

    if (!this.statistics) {
      return '';
    }

    if (this.statistics.percentageChange > 0) {
      return 'positive';
    }

    if (this.statistics.percentageChange < 0) {
      return 'negative';
    }

    return 'neutral';
  }

  getSelectedCompany(): Company | undefined {

    return this.companies.find(
      company =>
        company.symbol === this.selectedSymbol
    );
  }
}