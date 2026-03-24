import { Component, input } from '@angular/core';
import { ZardCardComponent } from '../../shared/components/card';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [ZardCardComponent],
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.css'
})
export class ChartCard {
  readonly title = input<string>('');
}
