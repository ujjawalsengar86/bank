import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/common.model';
import { Account, BalanceResponse } from '../models/account.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/accounts`;

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<ApiResponse<Account[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getAccount(id: number): Observable<Account> {
    return this.http.get<ApiResponse<Account>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  getBalance(id: number): Observable<BalanceResponse> {
    return this.http.get<ApiResponse<BalanceResponse>>(`${this.apiUrl}/${id}/balance`).pipe(
      map(res => res.data)
    );
  }

  getAccountTransactions(id: number, page: number = 0, size: number = 10): Observable<PaginatedResponse<Transaction>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Transaction>>>(`${this.apiUrl}/${id}/transactions`, { params }).pipe(
      map(res => res.data)
    );
  }
}
