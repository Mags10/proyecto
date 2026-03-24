import { Component, HostBinding, input } from '@angular/core';

@Component({
  selector: 'z-badge',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardBadgeComponent {
  readonly zType = input<'default' | 'secondary' | 'destructive'>('default');

  @HostBinding('class')
  get classes(): string {
    return `z-badge z-badge-${this.zType()}`;
  }
}
