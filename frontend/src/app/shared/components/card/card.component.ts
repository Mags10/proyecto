import { Component, input } from '@angular/core';

@Component({
  selector: 'z-card',
  standalone: true,
  template: `
    <section class="z-card">
      @if (zTitle()) {
        <header class="z-card-header">{{ zTitle() }}</header>
      }
      <div class="z-card-body">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class ZardCardComponent {
  readonly zTitle = input<string>('');
}
