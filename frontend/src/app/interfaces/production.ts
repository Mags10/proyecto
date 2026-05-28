import type { components } from '../api/schema';

export type ProductionBatch = components['schemas']['ProductionBatch'];
export type ProductionStatus = ProductionBatch['status'];
export type ProductionBatchPlannedIngredient = components['schemas']['ProductionBatchPlannedIngredient'];
export type ProductionBatchActualIngredient = components['schemas']['ProductionBatchActualIngredient'];
export type ProductionWasteSummary = components['schemas']['ProductionWasteSummary'];
export type CreateProductionBatchPayload = components['schemas']['CreateProductionBatchInput'];
export type CompleteProductionBatchPayload = components['schemas']['CompleteProductionBatchInput'];
export type CancelProductionBatchPayload = components['schemas']['CancelProductionBatchInput'];
export type ProductionBatchMutationResponse = components['schemas']['ProductionBatchMutationResponse'];

export interface ProductionListFilters {
  recipeId?: string;
  status?: ProductionStatus;
  limit?: number;
}
