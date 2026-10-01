import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/common.model';
import { AuthResponse, LoginRequest, RegisterRequest, UserSummary } from '../models/auth.model';

const TOKEN_KEY = 'bankease_auth_token';
const USER_KEY = 'bankease_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<UserSummary | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  public get currentUserValue(): UserSummary | null {
    return this.currentUserSubject.value;
  }

  register(request: RegisterRequest): Observable<UserSummary> {
    return this.http.post<ApiResponse<UserSummary>>(`${this.apiUrl}/register`, request).pipe(
      map(res => res.data)
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request).pipe(
      map(res => res.data),
      tap(authData => {
        if (authData && authData.accessToken) {
          this.setSession(authData);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  isCustomer(): boolean {
    return this.currentUserValue?.role === 'CUSTOMER';
  }

  isOfficer(): boolean {
    return this.currentUserValue?.role === 'BANK_OFFICER';
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'ADMIN';
  }

  getDefaultRoute(): string {
    switch (this.currentUserValue?.role) {
      case 'ADMIN':
        return '/admin';
      case 'BANK_OFFICER':
        return '/loans';
      default:
        return '/dashboard';
    }
  }

  updateStoredUser(user: Partial<UserSummary>): void {
    const current = this.currentUserValue;
    if (current) {
      const updated: UserSummary = { ...current, ...user };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      this.currentUserSubject.next(updated);
    }
  }

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
    this.currentUserSubject.next(authResponse.user);
  }

  private getStoredUser(): UserSummary | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as UserSummary;
    } catch {
      return null;
    }
  }
}
