import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const expectedRoles = route.data?.['roles'] as UserRole[] | undefined;

  // If no specific roles required, allow access
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // Check if current user has the required role
  if (expectedRoles.includes(currentUser.role)) {
    return true;
  }

  // User lacks permission for this route, redirect to dashboard
  return router.createUrlTree(['/dashboard']);
};
