import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { ZardButtonComponent } from 'src/app/shared/components/button';
import { ZardDialogComponent } from 'src/app/shared/components/dialog/dialog.component';

export const ZardDialogImports = [
  ZardButtonComponent,
  ZardDialogComponent,
  OverlayModule,
  PortalModule,
] as const;
