import type { components } from '../api/schema';

export type Sale = components['schemas']['Sale'];
export type SaleItem = components['schemas']['SaleItem'];
export type CreateSalePayload = components['schemas']['CreateSaleInput'];

export interface SalesListFilters {
  recipeId?: string;
  limit?: number;
}
