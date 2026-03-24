import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'input[z-input], textarea[z-input]',
  standalone: true
})
export class ZardInputDirective {
  @HostBinding('class') classes = 'z-input';
}
