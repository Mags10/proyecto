import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[zStringTemplateOutlet]',
  standalone: true
})
export class ZardStringTemplateOutletDirective {
  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainerRef: ViewContainerRef
  ) {}

  @Input() set zStringTemplateOutlet(value: string | TemplateRef<void> | null | undefined) {
    this.viewContainerRef.clear();

    if (value instanceof TemplateRef) {
      this.viewContainerRef.createEmbeddedView(value);
      return;
    }

    const template = this.templateRef;
    this.viewContainerRef.createEmbeddedView(template, {
      $implicit: value ?? ''
    });
  }
}
