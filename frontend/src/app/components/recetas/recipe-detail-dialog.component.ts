import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardTableImports } from '../../shared/components/table';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { Recipe, RecipePayload } from '../../interfaces/recipe';
import { SupplyService } from '../../services/supply-service';
import { RecipesService } from '../../services/recipes.service';
import { captureActiveElement, focusModalSurface, restoreActiveElement } from '../../shared/utils/modal-a11y';

type IngredientRowForm = FormGroup<{
  ingredientId: FormControl<string>;
  quantity: FormControl<number>;
  unitCost: FormControl<number | null>;
}>;

@Component({
  selector: 'app-recipe-detail-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ...ZardTableImports,
    MxnCurrencyPipe,
  ],
  templateUrl: './recipe-detail-dialog.component.html',
  styleUrl: './recipe-detail-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailDialogComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly previouslyFocusedElement = captureActiveElement();
  public readonly recipesService = inject(RecipesService);
  public readonly supplyService = inject(SupplyService);
  readonly dialogSurface = viewChild<ElementRef<HTMLElement>>('dialogSurface');
  readonly recipeData = input<Recipe | null>(null);
  readonly closed = output<void>();
  readonly recipe = signal<Recipe | null>(null);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    salePrice: [0, [Validators.required, Validators.min(0.01)]],
    yieldText: ['1 porción', Validators.required],
    notes: [''],
    ingredients: this.fb.array([this.createIngredientRow()]),
  });

  readonly summary = computed(() => {
    const salePrice = Number(this.form.controls.salePrice.value) || 0;
    const ingredients = this.form.controls.ingredients.controls;
    const totalCost = this.calculateTotalCost(ingredients);
    const margin = salePrice > 0 ? Math.round(((salePrice - totalCost) / salePrice) * 100 * 10) / 10 : 0;
    const profit = salePrice - totalCost;

    return {
      totalCost,
      margin,
      profit,
      status: this.deriveStatus(margin),
    };
  });

  readonly calculatedStatus = computed(() => this.summary().status);

  async ngOnInit(): Promise<void> {
    if (!this.supplyService.ingredients().length) {
      await this.supplyService.fetchIngredients();
    }

    this.recipe.set(this.recipeData());
    this.applyRecipe(this.recipe());
  }

  ngAfterViewInit(): void {
    focusModalSurface(this.dialogSurface());
  }

  close(): void {
    restoreActiveElement(this.previouslyFocusedElement);
    this.closed.emit();
  }

  addIngredientRow(): void {
    this.form.controls.ingredients.insert(0, this.createIngredientRow());
  }

  removeIngredientRow(index: number): void {
    if (this.form.controls.ingredients.length === 1) {
      return;
    }

    this.form.controls.ingredients.removeAt(index);
  }

  getIngredientName(ingredientId: string): string {
    return (
      this.supplyService.ingredients().find((ingredient) => ingredient._id === ingredientId)?.name ??
      'Sin selección'
    );
  }

  getIngredientUnit(ingredientId: string): string {
    return (
      this.supplyService.ingredients().find((ingredient) => ingredient._id === ingredientId)?.unit ?? '-'
    );
  }

  getIngredientUnitCost(ingredientId: string): number {
    return (
      this.supplyService.ingredients().find((ingredient) => ingredient._id === ingredientId)?.averageCost ?? 0
    );
  }

  getIngredientRowUnitCost(index: number): number {
    const row = this.form.controls.ingredients.at(index);
    const ingredient = this.supplyService
      .ingredients()
      .find((item) => item._id === row.controls.ingredientId.value);
    const unitCostControl = Number(row.controls.unitCost?.value);
    return Number.isFinite(unitCostControl) && unitCostControl > 0
      ? unitCostControl
      : (ingredient?.averageCost ?? 0);
  }

  getRowSubtotal(index: number): number {
    const row = this.form.controls.ingredients.at(index);
    const ingredient = this.supplyService
      .ingredients()
      .find((item) => item._id === row.controls.ingredientId.value);
    const unitCostControl = Number(row.controls.unitCost?.value);
    const unitCost =
      Number.isFinite(unitCostControl) && unitCostControl > 0
        ? unitCostControl
        : (ingredient?.averageCost ?? 0);
    return Math.round(unitCost * Number(row.controls.quantity.value || 0) * 100) / 100;
  }

  getRowStatus(index: number): { label: string; kind: 'secondary' | 'destructive' } {
    const row = this.form.controls.ingredients.at(index);
    const ingredientId = row.controls.ingredientId.value;
    const quantity = Number(row.controls.quantity.value);
    const unitCostVal = row.controls.unitCost?.value;

    if (!ingredientId) {
      return { label: 'Sin insumo', kind: 'destructive' };
    }

    const ingredient = this.supplyService.ingredients().find((item) => item._id === ingredientId);

    if (!ingredient) {
      return { label: 'No encontrado', kind: 'destructive' };
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { label: 'Cantidad inválida', kind: 'destructive' };
    }

    if (unitCostVal !== undefined && unitCostVal !== null) {
      const u = Number(unitCostVal);
      if (!Number.isFinite(u) || u <= 0) {
        return { label: 'Costo inválido', kind: 'destructive' };
      }
    }

    return { label: 'Correcto', kind: 'secondary' };
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: RecipePayload = {
      name: this.form.controls.name.value,
      category: this.form.controls.category.value,
      salePrice: Number(this.form.controls.salePrice.value),
      yieldText: this.form.controls.yieldText.value,
      notes: this.form.controls.notes.value,
      ingredients: this.form.controls.ingredients.controls.map((row) => ({
        ingredientId: row.controls.ingredientId.value,
        quantity: Number(row.controls.quantity.value),
        unitCost: this.resolveUnitCostOverride(row.controls.unitCost.value),
      })),
    };

    const saved = await this.recipesService.saveRecipe(payload, this.recipe()?._id);

    if (saved) {
      this.closed.emit();
    }
  }

  async delete(): Promise<void> {
    const recipe = this.recipe();
    if (!recipe) {
      return;
    }

    const ok = await this.recipesService.deleteRecipe(recipe._id);
    if (ok) {
      this.closed.emit();
    }
  }

  private createIngredientRow(recipeIngredientId = '', quantity = 0): IngredientRowForm {
    return new FormGroup({
      ingredientId: new FormControl(recipeIngredientId, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      quantity: new FormControl(quantity, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
      unitCost: new FormControl<number | null>(null),
    });
  }

  private applyRecipe(recipe: Recipe | null): void {
    if (!recipe) {
      this.form.patchValue({
        name: '',
        category: '',
        salePrice: 0,
        yieldText: '1 porción',
        notes: '',
      });
      this.form.controls.ingredients.clear();
      this.form.controls.ingredients.push(this.createIngredientRow());
      return;
    }

    this.form.patchValue({
      name: recipe.name,
      category: recipe.category,
      salePrice: recipe.salePrice,
      yieldText: recipe.yieldText,
      notes: recipe.notes,
    });

    this.form.controls.ingredients.clear();
    recipe.ingredients.forEach((ingredient) => {
      this.form.controls.ingredients.push(
        this.createIngredientRow(ingredient.ingredient, ingredient.quantity)
      );
      // set unitCost if available on recipe ingredient
      const idx = this.form.controls.ingredients.length - 1;
      const control = this.form.controls.ingredients.at(idx) as IngredientRowForm;
      if (ingredient.unitCost !== undefined && ingredient.unitCost !== null) {
        control.controls.unitCost.setValue(ingredient.unitCost);
      }
    });
  }

  private calculateTotalCost(rows: IngredientRowForm[]): number {
    return (
      Math.round(
        rows.reduce((acc, row) => {
          const ingredient = this.supplyService
            .ingredients()
            .find((item) => item._id === row.controls.ingredientId.value);
          const unitCostControl = Number(row.controls.unitCost?.value);
          const unitCost =
            Number.isFinite(unitCostControl) && unitCostControl > 0
              ? unitCostControl
              : (ingredient?.averageCost ?? 0);
          return acc + Number(row.controls.quantity.value || 0) * unitCost;
        }, 0) * 100
      ) / 100
    );
  }

  private resolveUnitCostOverride(value: number | null): number | undefined {
    if (value === null || value === undefined || value === 0) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private deriveStatus(margin: number): Recipe['status'] {
    if (margin >= 30) {
      return 'Rentable';
    }

    if (margin >= 15) {
      return 'Ajustar costo';
    }

    return 'Crítica';
  }
}
