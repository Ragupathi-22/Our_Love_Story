import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take, tap } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn().pipe(
    take(1),
    tap(loggedIn => {
      if (!loggedIn) {
        router.navigate(['/login']);
      }
    }),
    map(loggedIn => loggedIn)
  );
};
