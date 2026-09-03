import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Company } from '../../../../../model/company.model';
import { CreateCompanyRequest } from '../../../../../model/create-company-request.model';
import { StockCompanyService } from '../../../../service/stocks/stock-company.service';




@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss'
})
export class CompanyListComponent implements OnInit {
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  showAddModal = false;
  creating = false;
  createErrorMessage = '';
  selectedCompany: Company | null = null;
  selectedExchange = '';
  selectedSector = '';
  selectedIndustry = '';
  createdSymbol = '';

  newCompany: CreateCompanyRequest = {
    symbol: '',
    name: '',
    sector: '',
    industry: '',
    exchange: ''
  };


  constructor(
    private readonly companyService: StockCompanyService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}


  ngOnInit(): void {
    this.loadCompanies();
  }


  // ==========================================
  // LOAD COMPANIES
  // ==========================================

  loadCompanies(): void {

    this.loading = true;

    this.errorMessage = '';

    this.companyService
      .getCompanies()
      .subscribe({

        next: (companies: Company[]) => {

          this.companies = companies;

          this.companies = companies || [];
          this.filterCompanies();

          this.loading = false;

        },

        error: () => {
          this.errorMessage = 'Unable to load companies. Please try again.';

          this.loading = false;

        }

      });

  }


  // ==========================================
  // SEARCH
  // ==========================================

  filterCompanies(): void {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    this.filteredCompanies = this.companies.filter((company) => {
      const searchable = [company.symbol, company.name, company.exchange, company.sector, company.industry]
        .filter(Boolean).join(' ').toLowerCase();
      return (!search || searchable.includes(search))
        && (!this.selectedExchange || company.exchange === this.selectedExchange)
        && (!this.selectedSector || company.sector === this.selectedSector)
        && (!this.selectedIndustry || company.industry === this.selectedIndustry);
    });
  }


  get exchanges(): string[] {
    return this.uniqueValues((company) => company.exchange);
  }

  get sectors(): string[] {
    return this.uniqueValues((company) => company.sector);
  }

  get industries(): string[] {
    return this.uniqueValues((company) => company.industry);
  }

  get hasCompanies(): boolean {
    return this.companies.length > 0;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedExchange = '';
    this.selectedSector = '';
    this.selectedIndustry = '';
    this.filterCompanies();
  }

  selectCompany(company: Company): void {
    this.selectedCompany = company;
  }

  analyzeCompany(company: Company): void {
    this.selectedCompany = company;
    this.router.navigate(['/v1/stocks/analysis'], { queryParams: { symbol: company.symbol } });
  }


  // ==========================================
  // MODAL
  // ==========================================

  openAddCompanyModal(): void {

    this.createErrorMessage = '';

    this.newCompany = {
      symbol: '',
      name: '',
      sector: '',
      industry: '',
      exchange: ''
    };

    this.showAddModal = true;

  }


  closeAddCompanyModal(): void {

    if (this.creating) {
      return;
    }

    this.showAddModal = false;

  }


  // ==========================================
  // CREATE COMPANY
  // ==========================================

  createCompany(): void {

    this.createErrorMessage = '';

    const request: CreateCompanyRequest = {
      symbol: this.newCompany.symbol.trim().toUpperCase(),
      name: this.newCompany.name.trim(),
      sector: this.newCompany.sector?.trim(),
      industry: this.newCompany.industry?.trim(),
      exchange: this.newCompany.exchange?.trim().toUpperCase()
    };


    if (!request.symbol || !request.name) {
      this.createErrorMessage = 'Company symbol and name are required.';
      return;


    if (!/^[A-Z0-9.-]{1,12}$/.test(request.symbol)) {
      this.createErrorMessage = 'Use 1-12 letters, numbers, dots, or hyphens for the symbol.';
      return;
    }

    if (request.name.length > 120) {
      this.createErrorMessage = 'Company name must be 120 characters or fewer.';
      return;
    }
    }


    this.creating = true;


    this.companyService
      .createCompany(request)
      .subscribe({

        next: (company) => {
          this.creating = false;
          this.showAddModal = false;
          this.companies = [company, ...this.companies];
          this.createdSymbol = company.symbol;
          this.filterCompanies();
          this.selectedCompany = company;
          this.showAddModal = false;
          this.snackBar.open(`${company.symbol} created successfully.`, 'Close', { duration: 3500 });

        },

        error: (error) => {
          this.creating = false;
          const message = String(error?.error?.message || '').toLowerCase();
          this.createErrorMessage = message.includes('already exists')
            ? `${request.symbol} already exists. Please choose another stock symbol.`
            : 'Unable to create company. Please check the details and try again.';

        }

      });

  }

  private uniqueValues(selector: (company: Company) => string | undefined): string[] {
    return Array.from(new Set(this.companies.map(selector).filter((value): value is string => !!value)))
      .sort((first, second) => first.localeCompare(second));
  }

}

