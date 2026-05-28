import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { SupplyService } from '../../services/supply-service';

@Component({
  selector: 'app-abastecimiento-compra-modal',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCardComponent, ZardInputDirective, MxnCurrencyPipe],
  templateUrl: './abastecimiento-compra-modal.component.html',
  styleUrl: './abastecimiento-compra-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbastecimientoCompraModalComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  public supplyService = inject(SupplyService);

  @Output() closed = new EventEmitter<void>();

  public purchaseForm = this.fb.group({
    provider: ['', Validators.required],
    invoiceDate: [new Date().toISOString().slice(0, 10), Validators.required],
    ingredientId: ['', Validators.required],
    quantityReceived: [0, [Validators.required, Validators.min(0.01)]],
    totalPrice: [0, [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit(): void {
    const draft = this.supplyService.purchaseDraft();
    this.purchaseForm.patchValue({
      provider: draft.provider,
      invoiceDate: draft.invoiceDate,
      ingredientId: draft.ingredientId,
      quantityReceived: draft.quantityReceived,
      totalPrice: draft.totalPrice
    });

    this.purchaseForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.supplyService.updateDraft({
          provider: value.provider || '',
          invoiceDate: value.invoiceDate || '',
          ingredientId: value.ingredientId || '',
          quantityReceived: Number(value.quantityReceived) || 0,
          totalPrice: Number(value.totalPrice) || 0
        });
      });
  }

  close(): void {
    this.closed.emit();
  }

  registerPurchase(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      this.supplyService.error.set('Completa los datos de compra antes de registrar.');
      return;
    }

    const payload = this.purchaseForm.getRawValue();
    void this.supplyService.createPurchaseRecord(payload).then(() => {
      if (!this.supplyService.error()) {
        this.closed.emit();
      }
    });
  }
}
