import { Directive, input, signal } from '@angular/core';

const createId = () => Math.random().toString(36).slice(2, 10);

@Directive({
  selector: '[zardId]',
  standalone: true,
  exportAs: 'zardId'
})
export class ZardIdDirective {
  readonly zardId = input<string>('zard');
  private readonly generated = signal(`${this.zardId()}-${createId()}`);

  id(): string {
    return this.generated();
  }
}
