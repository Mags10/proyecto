import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';
import { RecetasPage } from './pages/recetas-page/recetas-page';
import { ProduccionPage } from './pages/produccion-page/produccion-page';
import { VentasPage } from './pages/ventas-page/ventas-page';
import { AbastecimientoStep1Page } from './pages/abastecimiento-step1-page/abastecimiento-step1-page';
import { AbastecimientoStep2Page } from './pages/abastecimiento-step2-page/abastecimiento-step2-page';
import { AbastecimientoStep3Page } from './pages/abastecimiento-step3-page/abastecimiento-step3-page';
import { AbastecimientoStep4Page } from './pages/abastecimiento-step4-page/abastecimiento-step4-page';
import { NotFoundPage } from './pages/not-found-page/not-found-page';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPage },
  { path: 'recetas', component: RecetasPage },
  { path: 'produccion', component: ProduccionPage },
  { path: 'ventas', component: VentasPage },
  { path: 'abastecimiento', redirectTo: 'abastecimiento/1', pathMatch: 'full' },
  { path: 'abastecimiento/1', component: AbastecimientoStep1Page },
  { path: 'abastecimiento/2', component: AbastecimientoStep2Page },
  { path: 'abastecimiento/3', component: AbastecimientoStep3Page },
  { path: 'abastecimiento/4', component: AbastecimientoStep4Page },
  { path: '**', component: NotFoundPage }
];
