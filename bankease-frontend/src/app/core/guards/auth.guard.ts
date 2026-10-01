import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (state.url === '/' || state.url === '') {
      const defaultRoute = authService.getDefaultRoute();
      if (defaultRoute !== state.url) {
        router.navigate([defaultRoute], { replaceUrl: true });
        return false;
      }
    }
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
