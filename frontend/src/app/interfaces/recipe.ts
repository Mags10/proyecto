export interface RecipeIngredient {
  ingredient: string;
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface RecipeIngredientInput {
  ingredientId: string;
  quantity: number;
  unitCost?: number;
}

export interface Recipe {
  _id: string;
  name: string;
  category: string;
  salePrice: number;
  notes: string;
  yieldText: string;
  ingredients: RecipeIngredient[];
  currentStock: number;
  totalCost: number;
  margin: number;
  status: 'Rentable' | 'Ajustar costo' | 'Crítica';
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipePayload {
  name: string;
  category: string;
  salePrice: number;
  notes?: string;
  yieldText?: string;
  ingredients: RecipeIngredientInput[];
}

export interface RecipeDialogData {
  recipe?: Recipe | null;
}
