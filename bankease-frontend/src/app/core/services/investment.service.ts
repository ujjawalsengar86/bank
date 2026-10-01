import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/common.model';
import {
  Investment,
  InvestmentCreateRequest,
  InvestmentProduct,
  PortfolioSummary,
  WithdrawRequest
} from '../models/investment.model';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private apiUrl = `${environment.apiUrl}/investments`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<InvestmentProduct[]> {
    return this.http.get<ApiResponse<InvestmentProduct[]>>(`${this.apiUrl}/products`).pipe(
      map(res => res.data)
    );
  }

  createInvestment(request: InvestmentCreateRequest): Observable<Investment> {
    return this.http.post<ApiResponse<Investment>>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  getMyInvestments(): Observable<Investment[]> {
    return this.http.get<ApiResponse<Investment[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getPortfolio(): Observable<PortfolioSummary> {
    return this.http.get<ApiResponse<PortfolioSummary>>(`${this.apiUrl}/portfolio`).pipe(
      map(res => res.data)
    );
  }

  getInvestment(id: number): Observable<Investment> {
    return this.http.get<ApiResponse<Investment>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  withdraw(id: number, request: WithdrawRequest): Observable<Investment> {
    return this.http.post<ApiResponse<Investment>>(`${this.apiUrl}/${id}/withdraw`, request).pipe(
      map(res => res.data)
    );
  }
}
