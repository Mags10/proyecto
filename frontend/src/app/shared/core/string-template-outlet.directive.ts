import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

@Directive({
  selector: '[zStringTemplateOutlet]',
})
export class ZardStringTemplateOutletDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  readonly zStringTemplateOutlet = input<string | TemplateRef<void> | null | undefined>(undefined);

  constructor() {
    effect(() => {
      const value = this.zStringTemplateOutlet();
      this.viewContainerRef.clear();

      if (value instanceof TemplateRef) {
        this.viewContainerRef.createEmbeddedView(value);
        return;
      }

      this.viewContainerRef.createEmbeddedView(this.templateRef, {
        $implicit: value ?? '',
      });
    });
  }
}
