import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ownerAdminEmail } from '../services/admin.config';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser;

  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: state.url },
    });
  }

  const isOwner = user.email.toLowerCase() === ownerAdminEmail.toLowerCase();
  if (isOwner || authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
