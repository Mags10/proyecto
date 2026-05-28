import { ElementRef } from '@angular/core';

export const captureActiveElement = (): HTMLElement | null => {
  if (typeof document === 'undefined' || !(document.activeElement instanceof HTMLElement)) {
    return null;
  }

  return document.activeElement;
};

export const focusModalSurface = (elementRef?: ElementRef<HTMLElement>): void => {
  queueMicrotask(() => {
    elementRef?.nativeElement.focus();
  });
};

export const restoreActiveElement = (element: HTMLElement | null): void => {
  queueMicrotask(() => {
    element?.focus();
  });
};
