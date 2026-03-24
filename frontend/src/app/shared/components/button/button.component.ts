import { booleanAttribute, Component, HostBinding, input } from '@angular/core';

@Component({
  selector: 'z-button, button[z-button], a[z-button]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardButtonComponent {
  readonly zType = input<'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'>('default');
  readonly zSize = input<'default' | 'sm' | 'lg'>('default');
  readonly zFull = input(false, { transform: booleanAttribute });

  @HostBinding('class')
  get classes(): string {
    const base = 'z-btn';
    const type = `z-btn-${this.zType()}`;
    const size = `z-btn-${this.zSize()}`;
    const full = this.zFull() ? 'z-btn-full' : '';
    return [base, type, size, full].filter(Boolean).join(' ');
  }
}
