import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState, sendPasswordResetEmail } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth, private router: Router) {}

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
   forgotPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
  logout() {
    return signOut(this.auth).then(() => this.router.navigate(['/login']));
  }

  isLoggedIn(): Observable<boolean> {
    return authState(this.auth).pipe(map(user => !!user));
  }
}
