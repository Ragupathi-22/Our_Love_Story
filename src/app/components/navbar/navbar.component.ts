import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/userService/user.service';
import  {  LucideAngularModule ,Settings} from 'lucide-angular';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule,LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isOpen = false;
  scrolled = false;
  swappedText = '💞';
  isFading = false;
  settings : any = Settings;
  private intervalId: any;
  private toggle = true;
  private nameSwap1 = 'R';
  private nameSwap2 = 'G';
  private userSub?: Subscription;

  navItems = [
    { name: 'Home', path: '/' },
    { name: 'Our Journey', path: '/journey' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Love Letter', path: '/letter' },
    { name: 'Our Vibes', path: '/playlist' },
    { name: 'Find the Clue', path: '/puzzle' },
    { name: 'Memory Keeper', path: '/memory' }
  ];

  constructor(public router: Router, private userService: UserService) {}

  ngOnInit() {
    // Get initials from user profile
    this.userSub = this.userService.userProfile$.subscribe(profile => {
      if (profile?.yourName && profile?.partnerName) {
        this.nameSwap1 = profile.yourName.charAt(0).toUpperCase();
        this.nameSwap2 = profile.partnerName.charAt(0).toUpperCase();
        this.swappedText = this.nameSwap1 + this.nameSwap2;
      } else {
        this.nameSwap1 = 'King ';
        this.nameSwap2 = 'Queen';
        this.swappedText = this.nameSwap1 + this.nameSwap2;
      }
    });

    // Animate swap
    this.intervalId = setInterval(() => {
      this.isFading = true;

      setTimeout(() => {
        this.swappedText = this.toggle
          ? this.nameSwap1 + this.nameSwap2
          : this.nameSwap2 + this.nameSwap1;

        this.toggle = !this.toggle;
        this.isFading = false;
      }, 600);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.userSub?.unsubscribe();
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

@HostListener('document:click', ['$event'])
onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;

  const clickedInsideSettings = target.closest('.settings-dropdown');
  const clickedToggleBtn = target.closest('.mobile-toggle-btn');
  const clickedInsideMobileMenu = target.closest('.mobile-menu');

  // Close settings if clicked outside
  if (!clickedInsideSettings) {
    this.showSettings = false;
  }

  // Close mobile menu if clicked outside menu and toggle
  if (!clickedInsideMobileMenu && !clickedToggleBtn) {
    this.isOpen = false;
  }
}



  showSettings = false;

toggleSettings() {
  this.showSettings = !this.showSettings;
}

logout() {
  this.userService.logout().then(() => {
    this.router.navigate(['/login']); 
  });
  this.showSettings = false;
}

goToAdmin() {
  this.router.navigate(['/admin']);
  this.showSettings = false;
}



}
