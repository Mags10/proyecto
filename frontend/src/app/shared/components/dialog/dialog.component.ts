import { OverlayModule } from '@angular/cdk/overlay';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  type ComponentPortal,
  PortalModule,
  type TemplatePortal,
} from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  computed,
  ElementRef,
  type EmbeddedViewRef,
  type EventEmitter,
  inject,
  output,
  type TemplateRef,
  type Type,
  viewChild,
  type ViewContainerRef,
} from '@angular/core';

import { mergeClasses, noopFn } from 'src/app/shared/utils/merge-classes';
import { focusModalSurface } from 'src/app/shared/utils/modal-a11y';

import type { ZardDialogRef } from './dialog-ref';
import { dialogVariants } from './dialog.variants';
import { ZardButtonComponent } from 'src/app/shared/components/button/button.component';

export type OnClickCallback<T> = (instance: T) => false | void | object;
export class ZardDialogOptions<T, U> {
  zCancelIcon?: string;
  zCancelText?: string | null;
  zClosable?: boolean;
  zContent?: string | TemplateRef<T> | Type<T>;
  zCustomClasses?: string;
  zData?: U;
  zDescription?: string;
  zHideFooter?: boolean;
  zMaskClosable?: boolean;
  zOkDestructive?: boolean;
  zOkDisabled?: boolean;
  zOkIcon?: string;
  zOkText?: string | null;
  zOnCancel?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  zOnOk?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  zTitle?: string | TemplateRef<T>;
  zViewContainerRef?: ViewContainerRef;
  zWidth?: string;
}

@Component({
  selector: 'z-dialog',
  imports: [OverlayModule, PortalModule, ZardButtonComponent],
  template: `
    @if (config.zClosable || config.zClosable === undefined) {
      <button
        type="button"
        data-testid="z-close-header-button"
        z-button
        zType="ghost"
        zSize="sm"
        class="absolute top-1 right-1"
        aria-label="Cerrar dialogo"
        (click)="onCloseClick()"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    }

    @if (config.zTitle || config.zDescription) {
      <header class="flex flex-col space-y-1.5 text-center sm:text-left">
        @if (config.zTitle) {
          <h4 data-testid="z-title" class="text-lg leading-none font-semibold tracking-tight">
            {{ config.zTitle }}
          </h4>

          @if (config.zDescription) {
            <p data-testid="z-description" class="text-muted-foreground text-sm">{{ config.zDescription }}</p>
          }
        }
      </header>
    }

    <main class="flex flex-col space-y-4">
      <ng-template cdkPortalOutlet />

      @if (isStringContent) {
        <div data-testid="z-content" [innerHTML]="config.zContent"></div>
      }
    </main>

    @if (!config.zHideFooter) {
      <footer class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2">
        @if (config.zCancelText !== null) {
          <button
            type="button"
            data-testid="z-cancel-button"
            z-button
            zType="outline"
            (click)="onCloseClick()"
          >
            {{ config.zCancelText ?? 'Cancel' }}
          </button>
        }

        @if (config.zOkText !== null) {
          <button
            type="button"
            data-testid="z-ok-button"
            z-button
            [zType]="config.zOkDestructive ? 'destructive' : 'default'"
            [zDisabled]="config.zOkDisabled"
            (click)="onOkClick()"
          >
            {{ config.zOkText ?? 'OK' }}
          </button>
        }
      </footer>
    }
  `,
  styles: `
    :host {
      position: fixed;
      left: 50%;
      top: 50%;
      z-index: 50;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: min(100vw - 2rem, 48rem);
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: 0.875rem;
      background: var(--surface);
      box-shadow: 0 24px 70px rgba(37, 24, 15, 0.22);
      overflow: hidden;
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      transition:
        opacity 150ms ease-out,
        transform 150ms ease-out;
    }

    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }

    @starting-style {
      :host {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.92);
      }
    }

    :host.dialog-leave {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.92);
      transition:
        opacity 150ms ease-in,
        transform 150ms ease-in;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style.width]': 'config.zWidth ? config.zWidth : null',
    role: 'dialog',
    'aria-modal': 'true',
    tabindex: '-1',
    'animate.enter': 'dialog-enter',
    'animate.leave': 'dialog-leave',
  },
  exportAs: 'zDialog',
})
export class ZardDialogComponent<T, U> extends BasePortalOutlet implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly config = inject(ZardDialogOptions<T, U>);

  protected readonly classes = computed(() => mergeClasses(dialogVariants(), this.config.zCustomClasses));
  dialogRef?: ZardDialogRef<T>;

  protected readonly isStringContent = typeof this.config.zContent === 'string';

  readonly portalOutlet = viewChild.required(CdkPortalOutlet);

  okTriggered = output<void>();
  cancelTriggered = output<void>();

  constructor() {
    super();
  }

  ngAfterViewInit(): void {
    focusModalSurface(this.host);
  }

  getNativeElement(): HTMLElement {
    return this.host.nativeElement;
  }

  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    if (this.portalOutlet()?.hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }
    return this.portalOutlet()?.attachComponentPortal(portal);
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    if (this.portalOutlet()?.hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }

    return this.portalOutlet()?.attachTemplatePortal(portal);
  }

  onOkClick() {
    this.okTriggered.emit();
  }

  onCloseClick() {
    this.cancelTriggered.emit();
  }
}
