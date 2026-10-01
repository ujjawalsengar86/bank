import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/common.model';
import { ChangePasswordRequest, UserProfile, UserUpdateRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}/me`).pipe(
      map(res => res.data)
    );
  }

  updateProfile(request: UserUpdateRequest): Observable<UserProfile> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.apiUrl}/me`, request).pipe(
      map(res => res.data)
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/me/password`, request).pipe(
      map(() => void 0)
    );
  }
}
