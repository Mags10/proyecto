import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ProductionBatch } from '../../interfaces/production';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { ProductionService } from '../../services/production.service';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

@Component({
  selector: 'app-produccion-detalle-modal',
  imports: [DatePipe, ZardBadgeComponent, ZardButtonComponent, ZardCardComponent, MxnCurrencyPipe],
  templateUrl: './produccion-detalle-modal.component.html',
  styleUrl: './produccion-detalle-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduccionDetalleModalComponent implements AfterViewInit {
  private readonly previouslyFocusedElement = captureActiveElement();
  readonly productionService = inject(ProductionService);
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');

  readonly batch = input.required<ProductionBatch>();
  readonly closed = output<void>();

  readonly showCancelForm = signal(false);
  readonly cancelReason = signal('');

  readonly statusLabel = computed(() => {
    switch (this.batch().status) {
      case 'PENDING':
        return 'Apartada';
      case 'IN_PROGRESS':
        return 'En progreso';
      case 'COMPLETED':
        return 'Terminada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return this.batch().status;
    }
  });
  readonly ingredientWasteCost = computed(() => {
    return (
      Math.round(
        (this.batch().actualIngredients?.reduce((acc, item) => acc + Number(item.wasteCost || 0), 0) || 0) *
          100
      ) / 100
    );
  });
  readonly yieldShortfallCost = computed(() => {
    const expected = Number(this.batch().plannedQuantity || 0);
    const actual = Number(this.batch().actualQuantity ?? 0);
    const shortfall = Math.max(0, expected - actual);
    return Math.round(shortfall * Number(this.batch().unitCost || 0) * 100) / 100;
  });
  readonly totalOperationalLoss = computed(() => {
    return Math.round((this.ingredientWasteCost() + this.yieldShortfallCost()) * 100) / 100;
  });
  readonly effectiveDurationMinutes = computed(() => {
    if (this.batch().durationMinutes !== null && this.batch().durationMinutes !== undefined) {
      return this.batch().durationMinutes;
    }

    const startedAt = this.batch().startedAt;
    const completedAt = this.batch().completedAt;

    if (startedAt && completedAt) {
      const started = new Date(startedAt).getTime();
      const completed = new Date(completedAt).getTime();
      return Math.max(0, Math.round((completed - started) / 60000));
    }

    return null;
  });

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.productionService.error.set('');
    this.closed.emit();
  }

  async startOrder(): Promise<void> {
    await this.productionService.startProductionBatch(this.batch()._id);
  }

  async confirmCancel(): Promise<void> {
    await this.productionService.cancelProductionBatch(this.batch()._id, {
      reason: this.cancelReason().trim() || undefined,
    });
    this.showCancelForm.set(false);
  }

  getActualQuantity(ingredientId: string): number | null {
    return (
      this.batch().actualIngredients?.find((item) => item.ingredient === ingredientId)?.actualQuantity ?? null
    );
  }

  getWasteCost(ingredientId: string): number | null {
    return (
      this.batch().actualIngredients?.find((item) => item.ingredient === ingredientId)?.wasteCost ?? null
    );
  }
}
