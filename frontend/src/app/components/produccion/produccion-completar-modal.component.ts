import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { ProductionBatch } from '../../interfaces/production';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { ProductionService } from '../../services/production.service';
import { RecipesService } from '../../services/recipes.service';
import { SupplyService } from '../../services/supply-service';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

@Component({
  selector: 'app-produccion-completar-modal',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCardComponent, ZardInputDirective, MxnCurrencyPipe],
  templateUrl: './produccion-completar-modal.component.html',
  styleUrl: './produccion-completar-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduccionCompletarModalComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previouslyFocusedElement = captureActiveElement();

  readonly productionService = inject(ProductionService);
  readonly recipesService = inject(RecipesService);
  readonly supplyService = inject(SupplyService);
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');

  readonly batch = input.required<ProductionBatch>();
  readonly closed = output<void>();
  readonly formTick = signal(0);

  readonly completionForm = this.fb.group({
    actualProduced: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
    actualIngredients: this.fb.array([]),
  });

  ngOnInit(): void {
    const batch = this.batch();
    this.completionForm.patchValue({
      actualProduced: Number(batch.plannedQuantity || 0),
      notes: batch.notes || '',
    });

    this.actualIngredientsArray.clear();
    for (const item of batch.plannedIngredients) {
      this.actualIngredientsArray.push(
        this.fb.group({
          ingredientId: [String(item.ingredient), [Validators.required]],
          actualQuantity: [Number(item.plannedQuantity || 0), [Validators.required, Validators.min(0)]],
        })
      );
    }

    this.completionForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formTick.update((value) => value + 1);
    });
  }

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  get actualIngredientsArray(): FormArray {
    return this.completionForm.controls.actualIngredients as FormArray;
  }

  readonly ingredientRows = computed(() => {
    this.formTick();
    const batch = this.batch();
    const rows = this.actualIngredientsArray.controls;

    return batch.plannedIngredients.map((item, index) => {
      const actualQuantity = Number(rows[index]?.get('actualQuantity')?.value ?? item.plannedQuantity);
      const ingredient = this.supplyService.ingredients().find((current) => current._id === item.ingredient);
      const currentStock = Number(ingredient?.currentStock || item.stockBefore);
      const stockAfter = Math.round((currentStock - actualQuantity) * 1000) / 1000;
      const actualSubtotal = Math.round(actualQuantity * Number(item.unitCost) * 100) / 100;
      const plannedSubtotal = Math.round(Number(item.plannedSubtotal || 0) * 100) / 100;
      const wasteCost = Math.max(0, Math.round((actualSubtotal - plannedSubtotal) * 100) / 100);

      return {
        ...item,
        currentStock,
        actualQuantity,
        stockAfter,
        actualSubtotal,
        wasteCost,
        varianceQuantity: Math.round((actualQuantity - Number(item.plannedQuantity)) * 1000) / 1000,
        valid: stockAfter >= 0,
      };
    });
  });

  readonly actualTotalCost = computed(() =>
    this.ingredientRows().reduce((acc, item) => acc + item.actualSubtotal, 0)
  );
  readonly ingredientWasteCost = computed(() =>
    this.ingredientRows().reduce((acc, item) => acc + item.wasteCost, 0)
  );
  readonly elapsedMinutes = computed(() => {
    const startedAt = this.batch().startedAt;
    if (!startedAt) {
      return 0;
    }

    const started = new Date(startedAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.round((now - started) / 60000));
  });
  readonly yieldVariance = computed(() => {
    this.formTick();
    return (
      Math.round(
        (Number(this.completionForm.controls.actualProduced.value || 0) -
          Number(this.batch().plannedQuantity || 0)) *
          1000
      ) / 1000
    );
  });
  readonly yieldShortfallCost = computed(() => {
    const shortfall = Math.max(
      0,
      Number(this.batch().plannedQuantity || 0) -
        Number(this.completionForm.controls.actualProduced.value || 0)
    );
    return Math.round(shortfall * Number(this.batch().unitCost || 0) * 100) / 100;
  });
  readonly totalWasteCost = computed(() => {
    return Math.round((this.ingredientWasteCost() + this.yieldShortfallCost()) * 100) / 100;
  });
  readonly projectedRecipeStock = computed(() => {
    this.formTick();
    const recipe = this.recipesService.recipes().find((current) => current._id === this.batch().recipe);
    const currentStock = Number(recipe?.currentStock || this.batch().previousRecipeStock || 0);
    return (
      Math.round((currentStock + Number(this.completionForm.controls.actualProduced.value || 0)) * 1000) /
      1000
    );
  });
  readonly canComplete = computed(() => {
    return this.completionForm.valid && this.ingredientRows().every((item) => item.valid);
  });
  readonly blockingReasons = computed(() => {
    this.formTick();

    const reasons: string[] = [];
    const actualProduced = Number(this.completionForm.controls.actualProduced.value);

    if (!Number.isFinite(actualProduced) || actualProduced < 0) {
      reasons.push('La producción real debe ser cero o mayor.');
    }

    for (const item of this.ingredientRows()) {
      if (!item.valid) {
        reasons.push(`${item.name} quedaría en ${item.stockAfter} ${item.unit}. Ajusta el consumo real.`);
      }
    }

    return reasons;
  });

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.productionService.error.set('');
    this.closed.emit();
  }

  completeOrder(): void {
    if (this.completionForm.invalid) {
      this.completionForm.markAllAsTouched();
      const reasons = this.blockingReasons();
      if (reasons.length) {
        this.productionService.error.set(reasons[0]);
      } else {
        this.productionService.error.set('Revisa los campos de producción real y consumo por insumo.');
      }
      return;
    }

    if (!this.canComplete()) {
      const reasons = this.blockingReasons();
      this.productionService.error.set(reasons[0] || 'El consumo real no puede dejar insumos en negativo.');
      return;
    }

    void this.productionService
      .completeProductionBatch(this.batch()._id, {
        actualProduced: Number(this.completionForm.controls.actualProduced.value),
        notes: this.completionForm.controls.notes.value.trim() || undefined,
        actualIngredients: this.ingredientRows().map((item) => ({
          ingredientId: String(item.ingredient),
          actualQuantity: item.actualQuantity,
        })),
      })
      .then((result) => {
        if (result) {
          this.closed.emit();
        }
      });
  }
}
