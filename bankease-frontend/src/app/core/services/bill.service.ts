import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/common.model';
import { Bill, Biller, BillFetchRequest, BillPayRequest, BillPaymentResponse } from '../models/bill.model';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getBillers(): Observable<Biller[]> {
    return this.http.get<ApiResponse<Biller[]>>(`${this.apiUrl}/billers`).pipe(
      map(res => res.data)
    );
  }

  fetchBill(request: BillFetchRequest): Observable<Bill> {
    return this.http.post<ApiResponse<Bill>>(`${this.apiUrl}/bills/fetch`, request).pipe(
      map(res => res.data)
    );
  }

  payBill(request: BillPayRequest): Observable<BillPaymentResponse> {
    return this.http.post<ApiResponse<BillPaymentResponse>>(`${this.apiUrl}/bills/pay`, request).pipe(
      map(res => res.data)
    );
  }

  getBillHistory(): Observable<BillPaymentResponse[]> {
    return this.http.get<ApiResponse<BillPaymentResponse[]>>(`${this.apiUrl}/bills/history`).pipe(
      map(res => res.data)
    );
  }

  getBill(id: number): Observable<Bill> {
    return this.http.get<ApiResponse<Bill>>(`${this.apiUrl}/bills/${id}`).pipe(
      map(res => res.data)
    );
  }
}
