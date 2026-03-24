import { Component, input } from '@angular/core';
import { ZardCardComponent } from '../../shared/components/card';

@Component({
  selector: 'app-mock-form-card',
  standalone: true,
  imports: [ZardCardComponent],
  templateUrl: './mock-form-card.html',
  styleUrl: './mock-form-card.css'
})
export class MockFormCard {
  readonly title = input<string>('');
}
