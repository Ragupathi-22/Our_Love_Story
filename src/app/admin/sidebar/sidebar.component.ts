import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NavItemComponent } from './nav-item.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/userService/user.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports:[NavItemComponent,FormsModule,CommonModule,RouterLink]
})
export class SidebarComponent implements OnInit {
  user: any;
  currentPath: string = '/admin/layout/dashboard';
  menuItems = [
    { path: '/admin/layout/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/layout/timeline', label: 'Timeline', icon: '🗓️' },
    { path: '/admin/layout/gallery', label: 'Gallery', icon: '🔼' },
    { path: '/admin/layout/vibes', label: 'Our Vibes', icon: '🎵' },
  ];

  constructor(private userService: UserService, private router: Router) {}

  isSidebarOpen = false;
  isMobile = false;
ngOnInit(): void {
  // Get user profile
  this.userService.userProfile$.subscribe(profile => this.user = profile);

  // Initial path
  this.currentPath = this.router.url;

  // Listen for route changes
  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      this.currentPath = event.urlAfterRedirects;
    });

  // Mobile responsiveness
  this.isMobile = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.isSidebarOpen = false;
    }
  });
}

  toggleSidebar() {
  this.isSidebarOpen = !this.isSidebarOpen;
}

  handleNavClick() {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

logout() {
  this.userService.logout().then(() => {
    this.router.navigate(['/login']); // or your desired route
  });
}
}