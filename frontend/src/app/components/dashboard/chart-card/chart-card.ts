import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZardCardComponent } from '../../../shared/components/card';

@Component({
  selector: 'app-chart-card',
  imports: [ZardCardComponent],
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCard {
  readonly title = input<string>('');
}
