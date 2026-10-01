import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/common.model';
import { Beneficiary, BeneficiaryRequest } from '../models/beneficiary.model';

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryService {
  private apiUrl = `${environment.apiUrl}/beneficiaries`;

  constructor(private http: HttpClient) {}

  getBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<ApiResponse<Beneficiary[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getBeneficiary(id: number): Observable<Beneficiary> {
    return this.http.get<ApiResponse<Beneficiary>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  addBeneficiary(request: BeneficiaryRequest): Observable<Beneficiary> {
    return this.http.post<ApiResponse<Beneficiary>>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  updateBeneficiary(id: number, request: BeneficiaryRequest): Observable<Beneficiary> {
    return this.http.put<ApiResponse<Beneficiary>>(`${this.apiUrl}/${id}`, request).pipe(
      map(res => res.data)
    );
  }

  deleteBeneficiary(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }
}
