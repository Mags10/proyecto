import { Injectable, signal } from '@angular/core';
import { apiClient } from '../api/client';
import { DashboardAnalytics } from '../interfaces/dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  public analytics = signal<DashboardAnalytics | null>(null);
  public loading = signal(false);
  public error = signal('');

  async fetchDashboard(days = 30): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    const { data, error } = await apiClient.GET('/api/analytics/dashboard', {
      params: {
        query: { days }
      }
    });

    if (error) {
      console.error('Error fetching dashboard analytics:', error);
      this.error.set('No se pudieron cargar los indicadores del dashboard.');
      this.loading.set(false);
      return;
    }

    this.analytics.set(data);
    this.loading.set(false);
  }
}
