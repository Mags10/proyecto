import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';
import { RecetasPage } from './pages/recetas-page/recetas-page';
import { ProduccionPage } from './pages/produccion-page/produccion-page';
import { VentasPage } from './pages/ventas-page/ventas-page';
import { AbastecimientoPage } from './pages/abastecimiento-page/abastecimiento-page';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { LoginPage } from './pages/login-page/login-page';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
  { path: 'recetas', component: RecetasPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'KITCHEN'] } },
  { path: 'produccion', component: ProduccionPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'KITCHEN'] } },
  { path: 'ventas', component: VentasPage, canActivate: [authGuard], data: { roles: ['ADMIN', 'FLOOR'] } },
  { path: 'abastecimiento', component: AbastecimientoPage, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
  { path: '**', component: NotFoundPage }
];
