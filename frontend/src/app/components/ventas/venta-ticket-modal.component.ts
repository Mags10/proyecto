import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { Recipe } from '../../interfaces/recipe';
import { SalesService } from '../../services/sales.service';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

@Component({
  selector: 'app-venta-ticket-modal',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCardComponent, ZardInputDirective, MxnCurrencyPipe],
  templateUrl: './venta-ticket-modal.component.html',
  styleUrl: './venta-ticket-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentaTicketModalComponent implements AfterViewInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly previouslyFocusedElement = captureActiveElement();

  readonly salesService = inject(SalesService);
  readonly recipes = input.required<Recipe[]>();
  readonly initialRecipeId = input<string | null>(null);
  readonly closed = output<void>();
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');

  readonly ticketForm = this.fb.group({
    soldAt: [this.toDateTimeLocal(new Date())],
    notes: [''],
    items: this.fb.array([this.createItemGroup()]),
  });

  readonly itemsArray = this.ticketForm.controls.items;
  readonly formValue = toSignal(this.ticketForm.valueChanges.pipe(startWith(this.ticketForm.getRawValue())), {
    initialValue: this.ticketForm.getRawValue(),
  });

  constructor() {
    effect(() => {
      const initialRecipeId = this.initialRecipeId();
      const firstLine = this.itemsArray.at(0);
      if (initialRecipeId && firstLine && !firstLine.controls.recipeId.value) {
        this.itemsArray.at(0).patchValue({ recipeId: initialRecipeId });
      }
    });
  }

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  private toDateTimeLocal(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private createItemGroup() {
    return this.fb.group({
      recipeId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
    });
  }

  addLine(): void {
    this.itemsArray.push(this.createItemGroup());
  }

  removeLine(index: number): void {
    if (this.itemsArray.length === 1) {
      this.itemsArray.at(0).reset({ recipeId: '', quantity: 1 });
      return;
    }

    this.itemsArray.removeAt(index);
  }

  readonly previewLines = computed(() => {
    const items = this.formValue().items || [];

    return items.map((item, index) => {
      const recipeId = item.recipeId || '';
      const quantity = Number(item.quantity || 0);
      const recipe = this.recipes().find((item) => item._id === recipeId) ?? null;
      const stock = Number(recipe?.currentStock || 0);
      const remaining = stock - quantity;
      const unitPrice = Number(recipe?.salePrice || 0);
      const unitCost = Number(recipe?.totalCost || 0);
      const subtotal = Math.round(quantity * unitPrice * 100) / 100;
      const lineCost = Math.round(quantity * unitCost * 100) / 100;

      return {
        index,
        recipe,
        quantity,
        stock,
        remaining,
        unitPrice,
        unitCost,
        subtotal,
        lineCost,
        lineMargin: Math.round((subtotal - lineCost) * 100) / 100,
        canSell: !!recipe && quantity > 0 && remaining >= 0,
      };
    });
  });

  readonly blockingLines = computed(() => {
    return this.previewLines().filter((line) => !line.canSell);
  });

  readonly totalRevenue = computed(() => this.previewLines().reduce((acc, line) => acc + line.subtotal, 0));
  readonly totalCost = computed(() => this.previewLines().reduce((acc, line) => acc + line.lineCost, 0));
  readonly totalMargin = computed(() => Math.round((this.totalRevenue() - this.totalCost()) * 100) / 100);
  readonly totalUnits = computed(() =>
    this.previewLines().reduce((acc, line) => acc + Number(line.quantity || 0), 0)
  );
  readonly canSubmit = computed(
    () =>
      this.ticketForm.valid &&
      this.previewLines().length > 0 &&
      this.previewLines().every((line) => line.canSell)
  );

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.salesService.error.set('');
    this.closed.emit();
  }

  submitSale(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      this.salesService.error.set('Completa las líneas del ticket antes de cobrar.');
      return;
    }

    if (!this.canSubmit()) {
      this.salesService.error.set('Hay líneas sin stock suficiente o sin producto seleccionado.');
      return;
    }

    const value = this.ticketForm.getRawValue();
    void this.salesService
      .createSale({
        soldAt: value.soldAt ? new Date(value.soldAt).toISOString() : undefined,
        notes: value.notes?.trim() || undefined,
        items: value.items.map((item) => ({
          recipeId: item.recipeId,
          quantity: Number(item.quantity),
        })),
      })
      .then((result) => {
        if (result) {
          this.closed.emit();
        }
      });
  }
}
