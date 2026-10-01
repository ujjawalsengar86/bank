import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/common.model';
import { NotificationItem } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<ApiResponse<NotificationItem[]>>(this.apiUrl).pipe(
      map(res => res.data),
      tap(items => this.notificationsSubject.next(items))
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}/read`, {}).pipe(
      map(() => {
        const current = this.notificationsSubject.value.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(current);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/read-all`, {}).pipe(
      map(() => {
        const current = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(current);
      })
    );
  }
}
