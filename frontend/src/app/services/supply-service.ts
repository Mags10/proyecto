import { computed, Injectable, signal } from '@angular/core';
import { apiClient } from '../api/client';
import {
  CreateIngredientPayload,
  CreatePurchaseRecordPayload,
  Ingredient,
  PurchaseDraft,
  PurchaseRecord
} from '../interfaces/supply';

@Injectable({
  providedIn: 'root'
})
export class SupplyService {
  public ingredients = signal<Ingredient[]>([]);
  public purchaseRecords = signal<PurchaseRecord[]>([]);
  public loading = signal(false);
  public purchaseRecordsLoading = signal(false);
  public error = signal('');
  public lastPurchase = signal<PurchaseRecord | null>(null);
  public purchaseDraft = signal<PurchaseDraft>({
    provider: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    ingredientId: '',
    quantityReceived: 0,
    totalPrice: 0
  });

  async fetchIngredients(): Promise<void> {
    this.loading.set(true);

    const { data, error } = await apiClient.GET('/api/ingredients');

    if (error) {
      console.error('Error fetching ingredients:', error);
      this.error.set('No se pudieron cargar los insumos.');
      this.loading.set(false);
      return;
    }

    this.ingredients.set(data);
    this.error.set('');
    this.loading.set(false);
  }

  async fetchPurchaseRecords(ingredientId?: string, limit = 10): Promise<void> {
    this.purchaseRecordsLoading.set(true);
    this.purchaseRecords.set([]);

    const { data, error } = await apiClient.GET('/api/purchase-records', {
      params: {
        query: {
          ingredientId,
          limit
        }
      }
    });

    if (error) {
      console.error('Error fetching purchase records:', error);
      this.error.set('No se pudo cargar el historial de compras.');
      this.purchaseRecordsLoading.set(false);
      return;
    }

    this.purchaseRecords.set(data);
    this.error.set('');
    this.purchaseRecordsLoading.set(false);
  }

  async createIngredient(payload: CreateIngredientPayload): Promise<void> {
    const { data, error } = await apiClient.POST('/api/ingredients', {
      body: payload
    });

    if (error) {
      console.error('Error creating ingredient:', error);
      this.error.set('No se pudo crear el insumo.');
      return;
    }

    this.ingredients.update((current) =>
      [...current, data.ingredient].sort((a, b) => a.name.localeCompare(b.name))
    );
    this.error.set('');
  }

  updateDraft(partial: Partial<PurchaseDraft>): void {
    this.purchaseDraft.update((current) => ({ ...current, ...partial }));
  }

  async createPurchaseRecord(payload: CreatePurchaseRecordPayload): Promise<void> {
    this.loading.set(true);

    const { data, error } = await apiClient.POST('/api/purchase-records', {
      body: payload
    });

    if (error) {
      console.error('Error creating purchase record:', error);
      this.error.set('No se pudo registrar la compra.');
      this.loading.set(false);
      return;
    }

    this.lastPurchase.set(data.purchaseRecord);
    this.purchaseRecords.update((current) => [data.purchaseRecord, ...current]);
    this.ingredients.update((current) =>
      current.map((ingredient) =>
        ingredient._id === data.ingredient._id ? data.ingredient : ingredient
      )
    );
    this.loading.set(false);
    this.error.set('');
  }

  public selectedIngredient = computed<Ingredient | undefined>(() => {
    return this.ingredients().find((ingredient) => ingredient._id === this.purchaseDraft().ingredientId);
  });

  public unitPrice = computed<number>(() => {
    const draft = this.purchaseDraft();
    if (!draft.quantityReceived || !draft.totalPrice) {
      return 0;
    }

    return Math.round((draft.totalPrice / draft.quantityReceived) * 100) / 100;
  });

  public projectedAverageCost = computed<number>(() => {
    const ingredient = this.selectedIngredient();
    const draft = this.purchaseDraft();

    if (!ingredient || !draft.quantityReceived || !draft.totalPrice) {
      return 0;
    }

    const unitPrice = this.unitPrice();
    const newStock = ingredient.currentStock + draft.quantityReceived;
    return Math.round((((ingredient.currentStock * ingredient.averageCost) + (draft.quantityReceived * unitPrice)) / newStock) * 100) / 100;
  });
}
