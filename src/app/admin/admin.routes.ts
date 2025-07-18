import { Routes } from '@angular/router';
import { registerGuard } from './guard/register.guard';
import { authGuard } from './guard/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'layout/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'layout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./sidebar/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
       loadComponent: () =>
          import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
       {
        path: 'timeline',
        loadComponent: () =>
          import('./timeline/timeline.component').then(m => m.TimelineComponent)
      },
       {
        path: 'gallery',
        loadComponent: () =>
          import('./gallery/gallery.component').then(m => m.GalleryComponent)
      },
       {
        path: 'vibes',  
        loadComponent: () =>
          import('./our-vibes/our-vibes.component').then(m => m.OurVibesComponent)
      },
    ]
  },
  {
    path: 'register',
    canActivate: [registerGuard],
    loadComponent: () =>
      import('./registration/registration.component').then(m => m.RegistrationComponent)
  }
];

