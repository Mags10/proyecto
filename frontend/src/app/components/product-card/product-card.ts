import { Component, input } from '@angular/core';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardBadgeComponent } from '../../shared/components/badge';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [ZardButtonComponent, ZardBadgeComponent],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  readonly name = input<string>('Producto');
  readonly price = input<string>('$0');
  readonly stock = input<string>('0');
  readonly lowStock = input<boolean>(false);
}
