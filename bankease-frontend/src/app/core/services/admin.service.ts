import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/common.model';
import { UserProfile } from '../models/user.model';
import { Account } from '../models/account.model';
import { Biller } from '../models/bill.model';
import { Transaction } from '../models/transaction.model';
import {
  AdminAccountStatusUpdate,
  AdminUserRoleUpdate,
  AdminUserStatusUpdate,
  AuditLog
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<ApiResponse<UserProfile[]>>(`${this.apiUrl}/users`).pipe(
      map(res => res.data)
    );
  }

  updateUserStatus(userId: number, update: AdminUserStatusUpdate): Observable<UserProfile> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.apiUrl}/users/${userId}/status`, update).pipe(
      map(res => res.data)
    );
  }

  updateUserRole(userId: number, update: AdminUserRoleUpdate): Observable<UserProfile> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.apiUrl}/users/${userId}/role`, update).pipe(
      map(res => res.data)
    );
  }

  getAllAccounts(): Observable<Account[]> {
    return this.http.get<ApiResponse<Account[]>>(`${this.apiUrl}/accounts`).pipe(
      map(res => res.data)
    );
  }

  updateAccountStatus(accountId: number, update: AdminAccountStatusUpdate): Observable<Account> {
    return this.http.put<ApiResponse<Account>>(`${this.apiUrl}/accounts/${accountId}/status`, update).pipe(
      map(res => res.data)
    );
  }

  createBiller(biller: Partial<Biller>): Observable<Biller> {
    return this.http.post<ApiResponse<Biller>>(`${this.apiUrl}/billers`, biller).pipe(
      map(res => res.data)
    );
  }

  getAuditLogs(page: number = 0, size: number = 20): Observable<PaginatedResponse<AuditLog>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PaginatedResponse<AuditLog>>>(`${this.apiUrl}/audit-logs`, { params }).pipe(
      map(res => res.data)
    );
  }

  getAllTransactions(page: number = 0, size: number = 20): Observable<PaginatedResponse<Transaction>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Transaction>>>(`${this.apiUrl}/transactions`, { params }).pipe(
      map(res => res.data)
    );
  }
}
