import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  // Fix: Explicitly type the injected Router instance.
  const router: Router = inject(Router);

  await authService.waitForAuthInitialization();

  if (authService.currentUser()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};