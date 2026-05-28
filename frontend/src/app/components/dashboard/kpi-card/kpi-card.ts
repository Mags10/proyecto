import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZardCardComponent } from '../../../shared/components/card';

@Component({
  selector: 'app-kpi-card',
  imports: [ZardCardComponent],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  readonly title = input<string>('');
  readonly value = input<string>('');
  readonly subtitle = input<string>('');
  readonly trend = input<string>('');
}
