import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/common.model';
import { Transaction, TransactionFilter } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getTransactions(filter?: TransactionFilter): Observable<PaginatedResponse<Transaction>> {
    let params = new HttpParams();
    if (filter) {
      if (filter.accountId) params = params.set('accountId', filter.accountId.toString());
      if (filter.type) params = params.set('type', filter.type);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
      if (filter.page !== undefined) params = params.set('page', filter.page.toString());
      if (filter.size !== undefined) params = params.set('size', filter.size.toString());
    }

    return this.http.get<ApiResponse<PaginatedResponse<Transaction>>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<ApiResponse<Transaction>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }
}
