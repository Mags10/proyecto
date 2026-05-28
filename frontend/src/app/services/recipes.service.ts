import { Injectable, computed, signal } from '@angular/core';
import { apiClient } from '../api/client';
import { Recipe, RecipePayload } from '../interfaces/recipe';

@Injectable({
  providedIn: 'root',
})
export class RecipesService {
  public recipes = signal<Recipe[]>([]);
  public loading = signal(false);
  public error = signal('');
  private latestFetchRequest = 0;

  async fetchRecipes(query = ''): Promise<void> {
    const requestId = ++this.latestFetchRequest;
    this.loading.set(true);

    const { data, error } = await apiClient.GET('/api/recipes', {
      params: {
        query: {
          q: query || undefined,
          limit: 100,
        },
      },
    });

    if (error) {
      if (requestId !== this.latestFetchRequest) {
        return;
      }

      console.error('Error fetching recipes:', error);
      this.error.set('No se pudieron cargar las recetas.');
      this.loading.set(false);
      return;
    }

    if (requestId !== this.latestFetchRequest) {
      return;
    }

    this.recipes.set(data || []);
    this.error.set('');
    this.loading.set(false);
  }

  async saveRecipe(payload: RecipePayload, recipeId?: string): Promise<Recipe | null> {
    this.loading.set(true);

    const response = recipeId
      ? await apiClient.PUT('/api/recipes/{id}', {
          params: { path: { id: recipeId } },
          body: payload,
        })
      : await apiClient.POST('/api/recipes', {
          body: payload,
        });

    if (response.error) {
      console.error('Error saving recipe:', response.error);
      this.error.set(recipeId ? 'No se pudo actualizar la receta.' : 'No se pudo crear la receta.');
      this.loading.set(false);
      return null;
    }

    const saved = response.data.recipe;
    this.recipes.update((current) => {
      const remaining = current.filter((recipe) => recipe._id !== saved._id);
      return [saved, ...remaining].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    });
    this.error.set('');
    this.loading.set(false);
    return saved;
  }

  async deleteRecipe(recipeId: string): Promise<boolean> {
    this.loading.set(true);

    const { error } = await apiClient.DELETE('/api/recipes/{id}', {
      params: { path: { id: recipeId } },
    });

    if (error) {
      console.error('Error deleting recipe:', error);
      this.error.set('No se pudo eliminar la receta.');
      this.loading.set(false);
      return false;
    }

    this.recipes.update((current) => current.filter((recipe) => recipe._id !== recipeId));
    this.error.set('');
    this.loading.set(false);
    return true;
  }

  readonly summary = computed(() => {
    const recipes = this.recipes();
    if (recipes.length === 0) {
      return { averageMargin: 0, criticalCount: 0, count: 0 };
    }

    const averageMargin =
      Math.round((recipes.reduce((acc, recipe) => acc + recipe.margin, 0) / recipes.length) * 10) / 10;
    const criticalCount = recipes.filter((recipe) => recipe.margin < 20).length;

    return { averageMargin, criticalCount, count: recipes.length };
  });
}
