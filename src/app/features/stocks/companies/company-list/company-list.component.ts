import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';
import { Company } from '../../../../../model/company.model';
import { CreateCompanyRequest } from '../../../../../model/create-company-request.model';
import { StockCompanyService } from '../../../../service/stocks/stock-company.service';




@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
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

  newCompany: CreateCompanyRequest = {
    symbol: '',
    name: '',
    sector: '',
    industry: '',
    exchange: ''
  };


  constructor(
    private readonly companyService: StockCompanyService
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

          this.filteredCompanies = companies;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'Failed to load companies',
            error
          );

          this.errorMessage =
            'Failed to load companies. Please try again.';

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

    if (!search) {

      this.filteredCompanies = this.companies;

      return;

    }

    this.filteredCompanies =
      this.companies.filter(company =>
        company.symbol.toLowerCase().includes(search) ||
        company.name.toLowerCase().includes(search) ||
        company.sector?.toLowerCase().includes(search) ||
        company.industry?.toLowerCase().includes(search)
      );

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

      this.createErrorMessage =
        'Company symbol and name are required.';

      return;

    }


    this.creating = true;


    this.companyService
      .createCompany(request)
      .subscribe({

        next: () => {

          this.creating = false;

          this.showAddModal = false;

          this.loadCompanies();

        },

        error: (error) => {

          console.error(
            'Failed to create company',
            error
          );

          this.creating = false;

          this.createErrorMessage =
            error?.error?.message ||
            'Unable to create company. Please try again.';

        }

      });

  }

}

