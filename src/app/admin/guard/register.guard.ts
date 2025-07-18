import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { map, take } from 'rxjs/operators';

export const registerGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => {
      if (user) {
        router.navigate(['/admin/layout/dashboard']); // Already logged in
        return false;
      }
      return true; // Not logged in, allow register
    })
  );
};
