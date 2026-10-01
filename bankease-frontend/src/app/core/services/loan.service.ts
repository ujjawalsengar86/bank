import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/common.model';
import {
  Loan,
  LoanApplication,
  LoanApplicationRequest,
  LoanApprovalRequest,
  LoanPaymentRequest,
  LoanPaymentResponse,
  LoanProduct,
  RepaymentScheduleItem
} from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private apiUrl = `${environment.apiUrl}/loans`;

  constructor(private http: HttpClient) {}

  getLoanProducts(): Observable<LoanProduct[]> {
    return this.http.get<ApiResponse<LoanProduct[]>>(`${this.apiUrl}/products`).pipe(
      map(res => res.data)
    );
  }

  applyLoan(request: LoanApplicationRequest): Observable<LoanApplication> {
    return this.http.post<ApiResponse<LoanApplication>>(`${this.apiUrl}/apply`, request).pipe(
      map(res => res.data)
    );
  }

  getMyApplications(): Observable<LoanApplication[]> {
    return this.http.get<ApiResponse<LoanApplication[]>>(`${this.apiUrl}/applications`).pipe(
      map(res => res.data)
    );
  }

  getAllApplications(page: number = 0, size: number = 20): Observable<PaginatedResponse<LoanApplication>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PaginatedResponse<LoanApplication>>>(`${this.apiUrl}/applications`, { params }).pipe(
      map(res => res.data)
    );
  }

  getApplication(id: number): Observable<LoanApplication> {
    return this.http.get<ApiResponse<LoanApplication>>(`${this.apiUrl}/applications/${id}`).pipe(
      map(res => res.data)
    );
  }

  approveLoan(applicationId: number): Observable<Loan> {
    return this.http.put<ApiResponse<Loan>>(`${this.apiUrl}/applications/${applicationId}/approve`, {}).pipe(
      map(res => res.data)
    );
  }

  rejectLoan(applicationId: number, rejectionReason?: string): Observable<LoanApplication> {
    const body: LoanApprovalRequest = { rejectionReason };
    return this.http.put<ApiResponse<LoanApplication>>(`${this.apiUrl}/applications/${applicationId}/reject`, body).pipe(
      map(res => res.data)
    );
  }

  getMyLoans(): Observable<Loan[]> {
    return this.http.get<ApiResponse<Loan[]>>(`${this.apiUrl}/my-loans`).pipe(
      map(res => res.data)
    );
  }

  getLoan(id: number): Observable<Loan> {
    return this.http.get<ApiResponse<Loan>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  payLoan(id: number, request: LoanPaymentRequest): Observable<LoanPaymentResponse> {
    return this.http.post<ApiResponse<LoanPaymentResponse>>(`${this.apiUrl}/${id}/pay`, request).pipe(
      map(res => res.data)
    );
  }

  getLoanPayments(id: number): Observable<LoanPaymentResponse[]> {
    return this.http.get<ApiResponse<LoanPaymentResponse[]>>(`${this.apiUrl}/${id}/payments`).pipe(
      map(res => res.data)
    );
  }

  getRepaymentSchedule(id: number): Observable<RepaymentScheduleItem[]> {
    return this.http.get<ApiResponse<RepaymentScheduleItem[]>>(`${this.apiUrl}/${id}/schedule`).pipe(
      map(res => res.data)
    );
  }
}
