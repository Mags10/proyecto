import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardInputDirective } from '../../shared/components/input';
import { ZardTableImports } from '../../shared/components/table';
import { Recipe } from '../../interfaces/recipe';
import { Sale } from '../../interfaces/sale';
import { RecipesService } from '../../services/recipes.service';
import { SalesService } from '../../services/sales.service';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';
import { VentaDetalleModalComponent } from '../../components/ventas/venta-detalle-modal.component';
import { VentaTicketModalComponent } from '../../components/ventas/venta-ticket-modal.component';

@Component({
  selector: 'app-ventas-page',
  imports: [
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputDirective,
    ...ZardTableImports,
    MxnCurrencyPipe,
    DatePipe,
    VentaTicketModalComponent,
    VentaDetalleModalComponent,
  ],
  templateUrl: './ventas-page.html',
  styleUrl: './ventas-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentasPage implements OnInit {
  readonly recipesService = inject(RecipesService);
  readonly salesService = inject(SalesService);

  readonly query = signal('');
  readonly ticketModalOpen = signal(false);
  readonly detailModalOpen = signal(false);
  readonly selectedRecipeId = signal<string | null>(null);
  readonly selectedSaleId = signal<string | null>(null);

  readonly allProducts = computed(() =>
    this.recipesService
      .recipes()
      .slice()
      .sort((a, b) => b.currentStock - a.currentStock)
  );
  readonly products = computed(() => this.allProducts().filter((recipe) => recipe.currentStock > 0));
  readonly sales = this.salesService.sales;
  readonly salesError = this.salesService.error;

  readonly filteredProducts = computed(() => {
    const term = this.query().trim().toLowerCase();

    return this.products().filter((recipe) => {
      if (!term) {
        return true;
      }

      return [recipe.name, recipe.category, recipe.status].some((value) =>
        value.toLowerCase().includes(term)
      );
    });
  });

  readonly selectedSale = computed<Sale | null>(() => {
    const saleId = this.selectedSaleId();
    return this.sales().find((sale) => sale._id === saleId) ?? null;
  });

  readonly totalSellableProducts = computed(() => this.products().length);
  readonly lowStockProducts = computed(
    () => this.products().filter((recipe) => recipe.currentStock <= 5).length
  );
  readonly recentRevenue = computed(() =>
    this.sales().reduce((acc, sale) => acc + Number(sale.totalRevenue || 0), 0)
  );
  readonly recentUnits = computed(() =>
    this.sales().reduce((acc, sale) => acc + Number(sale.totalItems || 0), 0)
  );

  async ngOnInit(): Promise<void> {
    await Promise.all([this.recipesService.fetchRecipes(), this.salesService.fetchSales({ limit: 20 })]);
  }

  updateQuery(value: string): void {
    this.query.set(value);
  }

  openTicket(recipe?: Recipe): void {
    this.selectedRecipeId.set(recipe?._id ?? null);
    this.ticketModalOpen.set(true);
  }

  openSaleDetail(sale: Sale): void {
    this.selectedSaleId.set(sale._id);
    this.detailModalOpen.set(true);
  }

  getStockState(recipe: Recipe): 'Bajo stock' | 'Disponible' {
    if (recipe.currentStock <= 5) {
      return 'Bajo stock';
    }

    return 'Disponible';
  }

  getStockBadge(recipe: Recipe): 'secondary' | 'default' {
    const state = this.getStockState(recipe);
    if (state === 'Bajo stock') {
      return 'secondary';
    }

    return 'default';
  }
}
