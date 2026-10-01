import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models/auth.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;
  const currentRole = authService.currentUserValue?.role;

  if (allowedRoles && currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  toastService.error('You do not have permission to access that section.');
  router.navigate(['/dashboard']);
  return false;
};
