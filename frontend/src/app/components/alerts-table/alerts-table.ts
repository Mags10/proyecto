import { Component } from '@angular/core';
import {
  ZardTableBodyComponent,
  ZardTableCellComponent,
  ZardTableComponent,
  ZardTableHeadComponent,
  ZardTableHeaderComponent,
  ZardTableRowComponent
} from '../../shared/components/table/table.component';
import { ZardBadgeComponent } from '../../shared/components/badge';

@Component({
  selector: 'app-alerts-table',
  standalone: true,
  imports: [
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardBadgeComponent
  ],
  templateUrl: './alerts-table.html',
  styleUrl: './alerts-table.css'
})
export class AlertsTable {}
