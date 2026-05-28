import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mxnCurrency',
  standalone: true
})
export class MxnCurrencyPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  transform(value: number | string | null | undefined): string {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? this.formatter.format(numeric) : this.formatter.format(0);
  }
}
