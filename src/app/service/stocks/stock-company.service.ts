import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from '../../../model/company.model';
import { CreateCompanyRequest } from '../../../model/create-company-request.model';


@Injectable({
  providedIn: 'root'
})
export class StockCompanyService {

  private readonly apiUrl =
    'http://localhost:8080/api/stocks/companies';


  constructor(
    private readonly http: HttpClient
  ) {}


  /**
   * Get all companies
   */
  getCompanies(): Observable<Company[]> {

    return this.http.get<Company[]>(
      this.apiUrl
    );

  }


  /**
   * Get company by symbol
   */
  getCompany(
    symbol: string
  ): Observable<Company> {

    return this.http.get<Company>(
      `${this.apiUrl}/${symbol}`
    );

  }


  /**
   * Create new company
   */
  createCompany(
    request: CreateCompanyRequest
  ): Observable<Company> {

    return this.http.post<Company>(
      this.apiUrl,
      request
    );

  }

}
