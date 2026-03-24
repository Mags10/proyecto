import { Component } from '@angular/core';

@Component({
  selector: 'table[z-table]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardTableComponent {}

@Component({
  selector: 'thead[z-table-header]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardTableHeaderComponent {}

@Component({
  selector: 'tbody[z-table-body]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardTableBodyComponent {}

@Component({
  selector: 'tr[z-table-row]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardTableRowComponent {}

@Component({
  selector: 'th[z-table-head]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardTableHeadComponent {}

@Component({
  selector: 'td[z-table-cell]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ZardTableCellComponent {}
