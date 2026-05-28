import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardTableImports } from '../../shared/components/table';
import { getUnitLabel } from '../../shared/catalogs/units';
import { Ingredient } from '../../interfaces/supply';
import { SupplyService } from '../../services/supply-service';
import { AbastecimientoInsumoModalComponent } from '../../components/abastecimiento/abastecimiento-insumo-modal.component';
import { AbastecimientoCompraModalComponent } from '../../components/abastecimiento/abastecimiento-compra-modal.component';
import { AbastecimientoHistorialModalComponent } from '../../components/abastecimiento/abastecimiento-historial-modal.component';
import { MxnCurrencyPipe } from '../../shared/pipes/mxn-currency.pipe';

@Component({
  selector: 'app-abastecimiento-page',
  imports: [
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ...ZardTableImports,
    MxnCurrencyPipe,
    AbastecimientoInsumoModalComponent,
    AbastecimientoCompraModalComponent,
    AbastecimientoHistorialModalComponent,
  ],
  templateUrl: './abastecimiento-page.html',
  styleUrl: './abastecimiento-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbastecimientoPage implements OnInit {
  public supplyService = inject(SupplyService);

  public ingredients = this.supplyService.ingredients;
  public error = this.supplyService.error;
  public lastPurchase = this.supplyService.lastPurchase;

  public readonly totalIngredients = computed(() => this.ingredients().length);
  public readonly lowStockCount = computed(
    () => this.ingredients().filter((i) => i.currentStock <= i.minimumStock).length
  );
  public ingredientModalOpen = signal(false);
  public purchaseModalOpen = signal(false);
  public historyModalOpen = signal(false);
  public selectedHistoryIngredient = signal<Ingredient | null>(null);
  public unitLabel = getUnitLabel;

  ngOnInit(): void {
    void this.supplyService.fetchIngredients();
  }

  openPurchaseHistory(ingredient: Ingredient): void {
    this.selectedHistoryIngredient.set(ingredient);
    this.historyModalOpen.set(true);
    void this.supplyService.fetchPurchaseRecords(ingredient._id, 10);
  }

  openPurchaseFromHistory(): void {
    const ingredient = this.selectedHistoryIngredient();
    if (!ingredient) {
      return;
    }

    this.historyModalOpen.set(false);
    this.supplyService.updateDraft({ ingredientId: ingredient._id });
    this.purchaseModalOpen.set(true);
  }
}
