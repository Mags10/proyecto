import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { ZardTableImports } from '../../shared/components/table';
import { RecipeDetailDialogComponent } from '../../components/recetas/recipe-detail-dialog.component';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { SupplyService } from '../../services/supply-service';
import { RecipesService } from '../../services/recipes.service';
import { Recipe } from '../../interfaces/recipe';

@Component({
  selector: 'app-recetas-page',
  imports: [
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputDirective,
    ...ZardTableImports,
    RecipeDetailDialogComponent,
    MxnCurrencyPipe,
  ],
  templateUrl: './recetas-page.html',
  styleUrl: './recetas-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecetasPage implements OnInit {
  private readonly recipesService = inject(RecipesService);
  private readonly supplyService = inject(SupplyService);

  readonly query = signal('');
  readonly recipeModalOpen = signal(false);
  readonly selectedRecipe = signal<Recipe | null>(null);
  readonly recipes = this.recipesService.recipes;
  readonly loading = this.recipesService.loading;
  readonly error = this.recipesService.error;

  readonly filteredRecipes = computed(() => {
    const term = this.query().trim().toLowerCase();

    if (!term) {
      return this.recipes();
    }

    return this.recipes().filter((recipe) => {
      return [
        recipe.name,
        recipe.category,
        recipe._id,
        recipe.status,
        this.getRecipeStatus(recipe.margin),
      ].some((value) => value.toLowerCase().includes(term));
    });
  });

  readonly summary = this.recipesService.summary;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.supplyService.fetchIngredients(), this.recipesService.fetchRecipes()]);
  }

  updateQuery(value: string): void {
    this.query.set(value);
    void this.recipesService.fetchRecipes(value);
  }

  getRecipeStatus(margin: number): Recipe['status'] {
    if (margin >= 30) {
      return 'Rentable';
    }

    if (margin >= 15) {
      return 'Ajustar costo';
    }

    return 'Crítica';
  }

  openRecipe(recipeId?: string): void {
    const recipe = recipeId ? (this.recipes().find((item) => item._id === recipeId) ?? null) : null;
    this.selectedRecipe.set(recipe);
    this.recipeModalOpen.set(true);
  }
}
