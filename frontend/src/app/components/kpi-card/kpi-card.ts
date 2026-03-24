import { Component, input } from '@angular/core';
import { ZardCardComponent } from '../../shared/components/card';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [ZardCardComponent],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.css'
})
export class KpiCard {
  readonly title = input<string>('');
  readonly value = input<string>('');
  readonly subtitle = input<string>('');
  readonly trend = input<string>('');
}
