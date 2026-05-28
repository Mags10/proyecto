import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.initialize();

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url }
    });
  }

  const roles = (route.data?.['roles'] as UserRole[] | undefined) ?? [];
  if (roles.length && !authService.canAccess(roles)) {
    return router.createUrlTree([authService.getDefaultRoute()]);
  }

  return true;
};

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.initialize();

  if (authService.isAuthenticated()) {
    return router.createUrlTree([authService.getDefaultRoute()]);
  }

  return true;
};
