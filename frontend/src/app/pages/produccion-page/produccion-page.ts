import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { ZardTableImports } from '../../shared/components/table';
import { ProductionBatch, ProductionStatus } from '../../interfaces/production';
import { Recipe } from '../../interfaces/recipe';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { ProductionService } from '../../services/production.service';
import { RecipesService } from '../../services/recipes.service';
import { SupplyService } from '../../services/supply-service';
import { ProduccionCompletarModalComponent } from '../../components/produccion/produccion-completar-modal.component';
import { ProduccionDetalleModalComponent } from '../../components/produccion/produccion-detalle-modal.component';
import { ProduccionLoteModalComponent } from '../../components/produccion/produccion-lote-modal.component';

@Component({
  selector: 'app-produccion-page',
  imports: [
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputDirective,
    ...ZardTableImports,
    MxnCurrencyPipe,
    DatePipe,
    ProduccionLoteModalComponent,
    ProduccionCompletarModalComponent,
    ProduccionDetalleModalComponent,
  ],
  templateUrl: './produccion-page.html',
  styleUrl: './produccion-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduccionPage implements OnInit {
  readonly recipesService = inject(RecipesService);
  readonly supplyService = inject(SupplyService);
  readonly productionService = inject(ProductionService);

  readonly query = signal('');
  readonly statusFilter = signal<ProductionStatus | 'ALL'>('ALL');

  readonly createModalOpen = signal(false);
  readonly completeModalOpen = signal(false);
  readonly detailModalOpen = signal(false);

  readonly selectedRecipeId = signal<string | null>(null);
  readonly selectedBatchId = signal<string | null>(null);

  readonly selectedRecipe = computed<Recipe | null>(() => {
    const recipeId = this.selectedRecipeId();
    return this.recipesService.recipes().find((recipe) => recipe._id === recipeId) ?? null;
  });

  readonly selectedBatch = computed<ProductionBatch | null>(() => {
    const batchId = this.selectedBatchId();
    return this.productionService.orders().find((batch) => batch._id === batchId) ?? null;
  });

  readonly filteredOrders = computed(() => {
    const term = this.query().trim().toLowerCase();
    const status = this.statusFilter();

    return this.productionService.orders().filter((batch) => {
      const displayStatus = this.getDisplayStatus(batch);
      const matchesStatus = status === 'ALL' || displayStatus === status;
      const matchesTerm =
        !term ||
        [
          batch.recipeName,
          batch.recipeCategory,
          displayStatus,
          batch.notes ?? '',
          batch.cancellationReason ?? '',
        ].some((value) => value.toLowerCase().includes(term));

      return matchesStatus && matchesTerm;
    });
  });

  readonly filteredRecipes = computed(() => {
    const term = this.query().trim().toLowerCase();

    return this.recipesService.recipes().filter((recipe) => {
      if (!term) {
        return true;
      }

      return [recipe.name, recipe.category, recipe._id].some((value) => value.toLowerCase().includes(term));
    });
  });

  readonly activeOrdersCount = computed(
    () =>
      this.productionService.orders().filter((batch) => ['PENDING', 'IN_PROGRESS'].includes(batch.status))
        .length
  );
  readonly inProgressCount = computed(
    () => this.productionService.orders().filter((batch) => batch.status === 'IN_PROGRESS').length
  );
  readonly completedCount = computed(
    () => this.productionService.orders().filter((batch) => batch.status === 'COMPLETED').length
  );
  readonly reservedEstimate = computed(() => {
    return this.productionService
      .orders()
      .filter((batch) => ['PENDING', 'IN_PROGRESS'].includes(batch.status))
      .reduce((acc, batch) => acc + Number(batch.plannedTotalCost || 0), 0);
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.recipesService.fetchRecipes(),
      this.supplyService.fetchIngredients(),
      this.productionService.fetchProductionBatches({ limit: 25 }),
    ]);
  }

  updateQuery(value: string): void {
    this.query.set(value);
  }

  setStatusFilter(status: ProductionStatus | 'ALL'): void {
    this.statusFilter.set(status);
  }

  private legacyField<T>(batch: ProductionBatch, key: string): T | undefined {
    return (batch as unknown as Record<string, T | undefined>)[key];
  }

  getDisplayStatus(batch: ProductionBatch): ProductionStatus {
    const legacyConsumed = this.legacyField<unknown[]>(batch, 'consumedIngredients');
    const legacyQuantity = this.legacyField<number>(batch, 'quantityProduced');

    if (
      batch.status === 'PENDING' &&
      ((legacyConsumed?.length || 0) > 0 || Number(legacyQuantity || 0) > 0)
    ) {
      return 'COMPLETED';
    }

    return batch.status;
  }

  getStatusLabel(status: ProductionStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Apartada';
      case 'IN_PROGRESS':
        return 'En progreso';
      case 'COMPLETED':
        return 'Terminada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  }

  getPlannedQuantity(batch: ProductionBatch): number {
    return Number(batch.plannedQuantity || this.legacyField<number>(batch, 'quantityProduced') || 0);
  }

  getPlannedIngredientCount(batch: ProductionBatch): number {
    return (
      batch.plannedIngredients?.length ||
      this.legacyField<unknown[]>(batch, 'consumedIngredients')?.length ||
      0 ||
      batch.actualIngredients?.length ||
      0
    );
  }

  getPlannedTotalCost(batch: ProductionBatch): number {
    return Number(batch.plannedTotalCost || this.legacyField<number>(batch, 'totalCost') || 0);
  }

  getActualQuantity(batch: ProductionBatch): number {
    return Number(batch.actualQuantity ?? this.legacyField<number>(batch, 'quantityProduced') ?? 0);
  }

  getWasteCost(batch: ProductionBatch): number {
    return Number(batch.wasteSummary?.totalWasteCost || 0);
  }

  getMaxProducible(recipe: Recipe): number {
    if (!recipe.ingredients.length) {
      return 0;
    }

    let minProducible = Infinity;

    for (const item of recipe.ingredients) {
      const ingredient = this.supplyService.ingredients().find((current) => current._id === item.ingredient);
      if (!ingredient || item.quantity <= 0) {
        return 0;
      }

      const available = Math.max(0, Number(ingredient.currentStock) - Number(ingredient.reservedStock || 0));
      minProducible = Math.min(minProducible, available / item.quantity);
    }

    return minProducible === Infinity ? 0 : Math.max(0, Math.floor(minProducible));
  }

  getBlockingIngredients(recipe: Recipe): string[] {
    return recipe.ingredients.flatMap((item) => {
      const ingredient = this.supplyService.ingredients().find((current) => current._id === item.ingredient);
      if (!ingredient || item.quantity <= 0) {
        return [item.name];
      }

      const available = Math.max(0, Number(ingredient.currentStock) - Number(ingredient.reservedStock || 0));
      return available < item.quantity ? [item.name] : [];
    });
  }

  getRecipeHint(recipe: Recipe): string {
    const max = this.getMaxProducible(recipe);
    if (max > 0) {
      return `Puedes apartar hasta ${max} uds con el disponible actual.`;
    }

    const blockers = this.getBlockingIngredients(recipe);
    if (!blockers.length) {
      return 'No hay disponible suficiente para apartar esta receta.';
    }

    return `Bloquean: ${blockers.slice(0, 2).join(', ')}${blockers.length > 2 ? '...' : ''}`;
  }

  openCreateModal(recipe: Recipe): void {
    this.selectedRecipeId.set(recipe._id);
    this.createModalOpen.set(true);
  }

  openCompleteModal(batch: ProductionBatch): void {
    this.selectedBatchId.set(batch._id);
    this.completeModalOpen.set(true);
  }

  openDetailModal(batch: ProductionBatch): void {
    this.selectedBatchId.set(batch._id);
    this.detailModalOpen.set(true);
  }

  async startOrder(batch: ProductionBatch): Promise<void> {
    await this.productionService.startProductionBatch(batch._id);
  }
}
