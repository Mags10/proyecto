import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { Recipe } from '../../interfaces/recipe';
import { ProductionService } from '../../services/production.service';
import { SupplyService } from '../../services/supply-service';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

@Component({
  selector: 'app-produccion-lote-modal',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCardComponent, ZardInputDirective, MxnCurrencyPipe],
  templateUrl: './produccion-lote-modal.component.html',
  styleUrl: './produccion-lote-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduccionLoteModalComponent implements AfterViewInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previouslyFocusedElement = captureActiveElement();

  readonly supplyService = inject(SupplyService);
  readonly productionService = inject(ProductionService);
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');

  readonly recipe = input.required<Recipe>();
  readonly closed = output<void>();

  readonly orderForm = this.fb.group({
    plannedQuantity: [1, [Validators.required, Validators.min(0.01)]],
    notes: [''],
  });

  readonly quantityValue = signal(1);

  constructor() {
    this.orderForm.controls.plannedQuantity.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const numeric = Number(value);
        this.quantityValue.set(Number.isFinite(numeric) && numeric > 0 ? numeric : 0);
      });
  }

  readonly previewIngredients = computed(() => {
    const recipe = this.recipe();
    const quantity = this.quantityValue();

    if (!recipe.ingredients.length || quantity <= 0) {
      return [];
    }

    return recipe.ingredients.map((item) => {
      const ingredient = this.supplyService.ingredients().find((current) => current._id === item.ingredient);
      const currentStock = Number(ingredient?.currentStock || 0);
      const reservedStock = Number(ingredient?.reservedStock || 0);
      const availableStock = Math.max(0, currentStock - reservedStock);
      const requiredQuantity = Math.round(item.quantity * quantity * 1000) / 1000;
      const unitCost = Number(item.unitCost || ingredient?.averageCost || 0);
      const availableAfterReserve = Math.round((availableStock - requiredQuantity) * 1000) / 1000;

      return {
        _id: item.ingredient,
        name: item.name,
        unit: item.unit,
        requiredQuantity,
        currentStock,
        reservedStock,
        availableStock,
        availableAfterReserve,
        minimumStock: Number(ingredient?.minimumStock || 0),
        unitCost,
        subtotal: Math.round(requiredQuantity * unitCost * 100) / 100,
        canReserve: availableStock >= requiredQuantity,
      };
    });
  });

  readonly canCreate = computed(() => {
    const preview = this.previewIngredients();
    return preview.length > 0 && preview.every((item) => item.canReserve);
  });

  readonly totalReservedCost = computed(() =>
    this.previewIngredients().reduce((acc, item) => acc + item.subtotal, 0)
  );
  readonly reservedUnitCost = computed(() => {
    const quantity = this.quantityValue();
    return quantity > 0 ? Math.round((this.totalReservedCost() / quantity) * 100) / 100 : 0;
  });
  readonly maxProducible = computed(() => {
    const preview = this.previewIngredients();
    if (!preview.length) {
      return 0;
    }

    return Math.max(
      0,
      Math.floor(
        Math.min(
          ...preview.map((item) =>
            item.requiredQuantity > 0
              ? (item.availableStock / item.requiredQuantity) * this.quantityValue()
              : 0
          )
        )
      )
    );
  });
  readonly blockingItems = computed(() => this.previewIngredients().filter((item) => !item.canReserve));
  readonly lowStockWarnings = computed(() =>
    this.previewIngredients().filter((item) => item.availableAfterReserve <= item.minimumStock)
  );

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.productionService.error.set('');
    this.closed.emit();
  }

  useMaxProducible(): void {
    const recipe = this.recipe();
    if (!recipe.ingredients.length) {
      return;
    }

    let minProducible = Infinity;

    for (const item of recipe.ingredients) {
      const ingredient = this.supplyService.ingredients().find((current) => current._id === item.ingredient);
      const availableStock = Math.max(
        0,
        Number(ingredient?.currentStock || 0) - Number(ingredient?.reservedStock || 0)
      );
      if (!ingredient || item.quantity <= 0) {
        minProducible = 0;
        break;
      }

      minProducible = Math.min(minProducible, availableStock / item.quantity);
    }

    const rounded = minProducible === Infinity ? 0 : Math.max(0, Math.floor(minProducible));
    if (rounded > 0) {
      this.orderForm.controls.plannedQuantity.setValue(rounded);
    }
  }

  createOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (!this.canCreate()) {
      this.productionService.error.set('No hay disponible suficiente para apartar esta orden.');
      return;
    }

    void this.productionService
      .createProductionBatch({
        recipeId: this.recipe()._id,
        plannedQuantity: Number(this.orderForm.controls.plannedQuantity.value),
        notes: this.orderForm.controls.notes.value.trim() || undefined,
      })
      .then((result) => {
        if (result) {
          this.closed.emit();
        }
      });
  }
}
