import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/common.model';
import { TransferRequest, TransferResponse } from '../models/transfer.model';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private apiUrl = `${environment.apiUrl}/transfers`;

  constructor(private http: HttpClient) {}

  transferFunds(request: TransferRequest): Observable<TransferResponse> {
    return this.http.post<ApiResponse<TransferResponse>>(this.apiUrl, request).pipe(
      map(res => res.data)
    );
  }

  getTransfers(): Observable<TransferResponse[]> {
    return this.http.get<ApiResponse<TransferResponse[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  getTransfer(id: number): Observable<TransferResponse> {
    return this.http.get<ApiResponse<TransferResponse>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }
}
