import { Component } from '@angular/core';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { ChartCard } from '../../components/chart-card/chart-card';
import { AlertsTable } from '../../components/alerts-table/alerts-table';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [KpiCard, ChartCard, AlertsTable],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPage {}
