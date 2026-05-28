import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { Ingredient } from '../../interfaces/supply';
import { SupplyService } from '../../services/supply-service';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

@Component({
  selector: 'app-abastecimiento-historial-modal',
  imports: [DatePipe, ZardBadgeComponent, ZardButtonComponent, ZardCardComponent, MxnCurrencyPipe],
  templateUrl: './abastecimiento-historial-modal.component.html',
  styleUrl: './abastecimiento-historial-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbastecimientoHistorialModalComponent implements AfterViewInit {
  private readonly previouslyFocusedElement = captureActiveElement();
  readonly supplyService = inject(SupplyService);
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');

  readonly ingredient = input<Ingredient | null>(null);
  readonly closed = output<void>();
  readonly addPurchase = output<void>();

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.closed.emit();
  }

  requestAddPurchase(): void {
    this.addPurchase.emit();
  }
}
