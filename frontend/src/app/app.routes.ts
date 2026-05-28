import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'recetas',
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'KITCHEN'] },
    loadComponent: () => import('./pages/recetas-page/recetas-page').then((m) => m.RecetasPage),
  },
  {
    path: 'produccion',
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'KITCHEN'] },
    loadComponent: () => import('./pages/produccion-page/produccion-page').then((m) => m.ProduccionPage),
  },
  {
    path: 'ventas',
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'FLOOR'] },
    loadComponent: () => import('./pages/ventas-page/ventas-page').then((m) => m.VentasPage),
  },
  {
    path: 'abastecimiento',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/abastecimiento-page/abastecimiento-page').then((m) => m.AbastecimientoPage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found-page/not-found-page').then((m) => m.NotFoundPage),
  },
];
