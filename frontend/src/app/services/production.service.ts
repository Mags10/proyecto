import { inject, Injectable, signal } from '@angular/core';
import { apiClient } from '../api/client';
import {
  CancelProductionBatchPayload,
  CompleteProductionBatchPayload,
  CreateProductionBatchPayload,
  ProductionBatch,
  ProductionListFilters
} from '../interfaces/production';
import { RecipesService } from './recipes.service';
import { SupplyService } from './supply-service';

type ApiErrorLike = {
  message?: string;
};

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  private readonly recipesService = inject(RecipesService);
  private readonly supplyService = inject(SupplyService);

  private lastFilters: ProductionListFilters = { limit: 25 };

  public orders = signal<ProductionBatch[]>([]);
  public loading = signal(false);
  public submitting = signal(false);
  public error = signal('');

  private extractMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error && 'message' in error) {
      const candidate = (error as ApiErrorLike).message;
      if (candidate) {
        return candidate;
      }
    }

    return fallback;
  }

  async fetchProductionBatches(filters: ProductionListFilters = this.lastFilters): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    const normalizedFilters = {
      limit: filters.limit ?? this.lastFilters.limit ?? 25,
      recipeId: filters.recipeId,
      status: filters.status
    };

    this.lastFilters = normalizedFilters;

    const { data, error } = await apiClient.GET('/api/production-batches', {
      params: {
        query: normalizedFilters
      }
    });

    if (error) {
      console.error('Error fetching production batches:', error);
      this.error.set('No se pudo cargar la actividad de producción.');
      this.loading.set(false);
      return;
    }

    this.orders.set(data || []);
    this.loading.set(false);
  }

  async reloadCurrentView(): Promise<void> {
    await this.fetchProductionBatches(this.lastFilters);
  }

  private async refreshDomainData(): Promise<void> {
    await Promise.all([
      this.recipesService.fetchRecipes(),
      this.supplyService.fetchIngredients(),
      this.fetchProductionBatches(this.lastFilters)
    ]);
  }

  async createProductionBatch(payload: CreateProductionBatchPayload): Promise<ProductionBatch | null> {
    this.submitting.set(true);
    this.error.set('');

    const { data, error } = await apiClient.POST('/api/production-batches', {
      body: payload
    });

    if (error) {
      console.error('Error creating production batch:', error);
      this.error.set(this.extractMessage(error, 'No se pudo crear la orden de producción.'));
      this.submitting.set(false);
      return null;
    }

    await this.refreshDomainData();
    this.submitting.set(false);
    return data.productionBatch;
  }

  async startProductionBatch(batchId: string): Promise<ProductionBatch | null> {
    this.submitting.set(true);
    this.error.set('');

    const { data, error } = await apiClient.POST('/api/production-batches/{id}/start', {
      params: {
        path: {
          id: batchId
        }
      }
    });

    if (error) {
      console.error('Error starting production batch:', error);
      this.error.set(this.extractMessage(error, 'No se pudo iniciar la orden de producción.'));
      this.submitting.set(false);
      return null;
    }

    await this.refreshDomainData();
    this.submitting.set(false);
    return data.productionBatch;
  }

  async completeProductionBatch(batchId: string, payload: CompleteProductionBatchPayload): Promise<ProductionBatch | null> {
    this.submitting.set(true);
    this.error.set('');

    const { data, error } = await apiClient.POST('/api/production-batches/{id}/complete', {
      params: {
        path: {
          id: batchId
        }
      },
      body: payload
    });

    if (error) {
      console.error('Error completing production batch:', error);
      this.error.set(this.extractMessage(error, 'No se pudo completar la orden de producción.'));
      this.submitting.set(false);
      return null;
    }

    await this.refreshDomainData();
    this.submitting.set(false);
    return data.productionBatch;
  }

  async cancelProductionBatch(batchId: string, payload: CancelProductionBatchPayload = {}): Promise<ProductionBatch | null> {
    this.submitting.set(true);
    this.error.set('');

    const { data, error } = await apiClient.POST('/api/production-batches/{id}/cancel', {
      params: {
        path: {
          id: batchId
        }
      },
      body: payload
    });

    if (error) {
      console.error('Error cancelling production batch:', error);
      this.error.set(this.extractMessage(error, 'No se pudo cancelar la orden de producción.'));
      this.submitting.set(false);
      return null;
    }

    await this.refreshDomainData();
    this.submitting.set(false);
    return data.productionBatch;
  }
}
