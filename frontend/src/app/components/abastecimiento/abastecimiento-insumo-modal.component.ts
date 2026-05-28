import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { UNIT_OPTIONS } from '../../shared/catalogs/units';
import { SupplyService } from '../../services/supply-service';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

@Component({
  selector: 'app-abastecimiento-insumo-modal',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCardComponent, ZardInputDirective],
  templateUrl: './abastecimiento-insumo-modal.component.html',
  styleUrl: './abastecimiento-insumo-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbastecimientoInsumoModalComponent implements AfterViewInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly previouslyFocusedElement = captureActiveElement();
  readonly supplyService = inject(SupplyService);
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');

  readonly closed = output<void>();

  readonly unitOptions = UNIT_OPTIONS;

  readonly ingredientForm = this.fb.group({
    name: ['', Validators.required],
    unit: [UNIT_OPTIONS[3].value, Validators.required],
    currentStock: [0, Validators.min(0)],
    averageCost: [0, Validators.min(0)],
    minimumStock: [0, Validators.min(0)],
  });

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.closed.emit();
  }

  createIngredient(): void {
    if (this.ingredientForm.invalid) {
      this.ingredientForm.markAllAsTouched();
      return;
    }

    void this.supplyService.createIngredient(this.ingredientForm.getRawValue()).then(() => {
      if (!this.supplyService.error()) {
        this.closed.emit();
        this.ingredientForm.reset({
          name: '',
          unit: UNIT_OPTIONS[3].value,
          currentStock: 0,
          averageCost: 0,
          minimumStock: 0,
        });
      }
    });
  }
}
