import { inject, Injectable, signal } from '@angular/core';
import { apiClient } from '../api/client';
import { CreateSalePayload, Sale, SalesListFilters } from '../interfaces/sale';
import { RecipesService } from './recipes.service';

type ApiErrorLike = {
  message?: string;
};

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly recipesService = inject(RecipesService);

  private lastFilters: SalesListFilters = { limit: 20 };

  public sales = signal<Sale[]>([]);
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

  async fetchSales(filters: SalesListFilters = this.lastFilters): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    const normalizedFilters = {
      recipeId: filters.recipeId,
      limit: filters.limit ?? this.lastFilters.limit ?? 20
    };

    this.lastFilters = normalizedFilters;

    const { data, error } = await apiClient.GET('/api/sales', {
      params: {
        query: normalizedFilters
      }
    });

    if (error) {
      console.error('Error fetching sales:', error);
      this.error.set('No se pudieron cargar las ventas recientes.');
      this.loading.set(false);
      return;
    }

    this.sales.set(data || []);
    this.loading.set(false);
  }

  async createSale(payload: CreateSalePayload): Promise<Sale | null> {
    this.submitting.set(true);
    this.error.set('');

    const { data, error } = await apiClient.POST('/api/sales', {
      body: payload
    });

    if (error) {
      console.error('Error creating sale:', error);
      this.error.set(this.extractMessage(error, 'No se pudo registrar la venta.'));
      this.submitting.set(false);
      return null;
    }

    this.recipesService.recipes.update((current) => {
      const updatedMap = new Map((data.recipes || []).map((recipe) => [recipe._id, recipe]));
      return current.map((recipe) => updatedMap.get(recipe._id) ?? recipe);
    });

    await this.fetchSales(this.lastFilters);
    this.submitting.set(false);
    return data.sale;
  }
}
