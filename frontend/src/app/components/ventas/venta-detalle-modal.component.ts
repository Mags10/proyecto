import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { Sale } from '../../interfaces/sale';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

@Component({
  selector: 'app-venta-detalle-modal',
  imports: [ZardButtonComponent, ZardCardComponent, DatePipe, MxnCurrencyPipe],
  templateUrl: './venta-detalle-modal.component.html',
  styleUrl: './venta-detalle-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentaDetalleModalComponent implements AfterViewInit {
  private readonly previouslyFocusedElement = captureActiveElement();
  readonly sale = input.required<Sale>();
  readonly closed = output<void>();
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.closed.emit();
  }
}
