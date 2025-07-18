import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const webRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('../layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/home.component').then(m => m.HomeComponent)
      },
       {
        path: 'journey',
        loadComponent: () =>
          import('./journey/journey.component').then(m => m.JourneyComponent)
      },
      {
        path: 'gallery',
        loadComponent: () =>
          import('./gallary/gallary.component').then(m => m.GallaryComponent)
      },
       {
        path: 'playlist',
        loadComponent: () =>
          import('./our-vibes/our-vibes.component').then(m => m.OurVibesComponent)
      },
      {
        path: 'memory',
        loadComponent: () => import('./memory-page/memory-page.component').then(m => m.MemoryPageComponent)
      }
    ]
  }
];
