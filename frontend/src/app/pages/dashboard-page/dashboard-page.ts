import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardTableImports } from '../../shared/components/table';
import { DashboardAlert, DashboardRecentProduction, DashboardRecentSale, DashboardTopSellingRecipe } from '../../interfaces/dashboard';
import { DashboardService } from '../../services/dashboard.service';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ...ZardTableImports,
    MxnCurrencyPipe,
    DatePipe
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit {
  readonly dashboardService = inject(DashboardService);
  readonly periodDays = signal(30);

  readonly analytics = this.dashboardService.analytics;
  readonly summary = computed(() => this.analytics()?.summary ?? null);
  readonly alerts = computed(() => this.analytics()?.alerts ?? []);
  readonly topSelling = computed(() => this.analytics()?.topSellingRecipes ?? []);
  readonly recentSales = computed(() => this.analytics()?.recentSales ?? []);
  readonly recentProduction = computed(() => this.analytics()?.recentProduction ?? []);
  readonly salesTimeline = computed(() => this.analytics()?.salesTimeline ?? []);
  readonly productionStatusSummary = computed(() => this.analytics()?.productionStatusSummary ?? []);
  readonly alertSummary = computed(() => this.analytics()?.alertSummary ?? { high: 0, medium: 0 });
  readonly lowStockIngredients = computed(() => this.analytics()?.lowStockIngredients ?? []);
  readonly lowMarginRecipes = computed(() => this.analytics()?.lowMarginRecipes ?? []);

  readonly topRestockIngredients = computed(() => this.lowStockIngredients().slice(0, 5));
  readonly topAlerts = computed(() => this.alerts().slice(0, 5));

  readonly salesTrendPoints = computed(() => {
    const timeline = this.salesTimeline();
    if (!timeline.length) {
      return '';
    }

    const maxRevenue = Math.max(...timeline.map((point) => point.revenue), 1);
    return timeline
      .map((point, index) => {
        const x = timeline.length === 1 ? 0 : (index / (timeline.length - 1)) * 100;
        const y = 100 - ((point.revenue / maxRevenue) * 100);
        return `${x},${y}`;
      })
      .join(' ');
  });

  readonly strongestSalesDay = computed(() => {
    return this.salesTimeline().reduce((best, current) => {
      if (!best || current.revenue > best.revenue) {
        return current;
      }
      return best;
    }, this.salesTimeline()[0]);
  });

  readonly topSellingBars = computed(() => {
    const products = this.topSelling();
    const maxRevenue = Math.max(...products.map((item) => item.revenue), 1);

    return products.map((item) => ({
      ...item,
      width: `${Math.max(12, Math.round((item.revenue / maxRevenue) * 100))}%`
    }));
  });

  async ngOnInit(): Promise<void> {
    await this.dashboardService.fetchDashboard(this.periodDays());
  }

  async setPeriod(days: number): Promise<void> {
    this.periodDays.set(days);
    await this.dashboardService.fetchDashboard(days);
  }

  getAlertBadge(alert: DashboardAlert): 'destructive' | 'secondary' {
    return alert.priority === 'Alta' ? 'destructive' : 'secondary';
  }

  getProductionStatusLabel(item: DashboardRecentProduction): string {
    switch (item.status) {
      case 'PENDING':
        return 'Apartada';
      case 'IN_PROGRESS':
        return 'En progreso';
      case 'COMPLETED':
        return 'Terminada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return item.status;
    }
  }

  getProductionStatusBadge(item: DashboardRecentProduction): 'default' | 'secondary' | 'destructive' {
    switch (item.status) {
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  trackTopSelling(_: number, item: DashboardTopSellingRecipe): string {
    return item.recipeId;
  }

  trackRecentSale(_: number, item: DashboardRecentSale): string {
    return item._id;
  }

  trackRecentProduction(_: number, item: DashboardRecentProduction): string {
    return item._id;
  }

  getStatusSummaryLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Apartadas';
      case 'IN_PROGRESS':
        return 'En progreso';
      case 'COMPLETED':
        return 'Terminadas';
      case 'CANCELLED':
        return 'Canceladas';
      default:
        return status;
    }
  }
}
