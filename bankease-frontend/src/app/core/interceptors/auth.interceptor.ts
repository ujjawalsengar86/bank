import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const token = authService.getToken();

  let clonedRequest = req;
  if (token && !req.headers.has('Authorization')) {
    clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Do not redirect if already on login/register
        if (!router.url.includes('/login') && !router.url.includes('/register')) {
          toastService.error('Session expired or unauthorized. Please log in again.');
          authService.logout();
        }
      } else if (error.status === 403) {
        toastService.error('Access denied. You do not have permission to perform this action.');
      } else if (error.status === 0) {
        toastService.error('Cannot connect to the BankEase backend server. Please verify network or backend status.');
      }
      return throwError(() => error);
    })
  );
};
