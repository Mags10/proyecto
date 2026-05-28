import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { Ingredient } from '../../interfaces/supply';
import { SupplyService } from '../../services/supply-service';

@Component({
  selector: 'app-abastecimiento-historial-modal',
  imports: [DatePipe, ZardBadgeComponent, ZardButtonComponent, ZardCardComponent, MxnCurrencyPipe],
  templateUrl: './abastecimiento-historial-modal.component.html',
  styleUrl: './abastecimiento-historial-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbastecimientoHistorialModalComponent {
  public supplyService = inject(SupplyService);

  @Input() ingredient: Ingredient | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() addPurchase = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  requestAddPurchase(): void {
    this.addPurchase.emit();
  }
}
