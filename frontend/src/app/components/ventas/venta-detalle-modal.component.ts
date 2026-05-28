import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { Sale } from '../../interfaces/sale';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';

@Component({
  selector: 'app-venta-detalle-modal',
  imports: [ZardButtonComponent, ZardCardComponent, DatePipe, MxnCurrencyPipe],
  templateUrl: './venta-detalle-modal.component.html',
  styleUrl: './venta-detalle-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VentaDetalleModalComponent {
  readonly sale = input.required<Sale>();
  readonly closed = output<void>();
}
