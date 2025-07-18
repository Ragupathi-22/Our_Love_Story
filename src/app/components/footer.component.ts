import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../services/userService/user.service';
import { UserProfile } from '../models/user-profile.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  template: `
    <footer class="bg-gradient-to-r from-pink-100 to-pink-200 py-4 px-4 text-center">
      <div class="container mx-auto flex flex-col items-center justify-center">
        <div class="flex items-center justify-center space-x-1">
          <span>Made with</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="lucide lucide-heart h-5 w-5 text-pink-600 animate-pulse">
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
            </path>
          </svg>
          <span *ngIf="footerText$ | async as text">{{ text }}</span>
        </div>
        <p class="text-sm text-gray-600 mt-2">Forever & Always, 2025</p>
      </div>
    </footer>
  `
})
export class FooterComponent {
  footerText$: Observable<string>;

  constructor(private userService: UserService) {
    this.footerText$ = this.userService.userProfile$.pipe(
      map((profile: UserProfile | null) => {
        if (profile?.yourName && profile?.partnerName) {
          return `by ${profile.yourName} for 👑${profile.partnerName}`;
        }
        return '👑 King & Queen 👑';
      })
    );
  }
}
