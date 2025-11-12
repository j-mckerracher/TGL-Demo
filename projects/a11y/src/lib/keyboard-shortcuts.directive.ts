/**
 * KeyboardShortcutsDirective
 *
 * Provides keyboard shortcut handling for interactive elements.
 * Features:
 * - Declarative shortcut configuration via input
 * - Support for common keys (Enter, Escape, Arrow keys, etc.)
 * - Automatic cleanup on destroy
 * - Prevents default behavior when shortcuts match
 *
 * Usage:
 * <button [appKeyboardShortcuts]="[{ key: 'Enter', action: () => run() }]">
 *   Run
 * </button>
 *
 * Version: v1.0
 */

import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
} from '@angular/core';

export interface KeyboardShortcut {
  key: string;
  action: () => void;
  preventDefault?: boolean;
}

@Directive({
  selector: '[appKeyboardShortcuts]',
  standalone: true,
})
export class KeyboardShortcutsDirective implements OnInit, OnDestroy {
  @Input() appKeyboardShortcuts: KeyboardShortcut[] = [];

  private keydownListener?: (event: KeyboardEvent) => void;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.attachKeydownListener();
  }

  ngOnDestroy(): void {
    this.detachKeydownListener();
  }

  /**
   * Attach keydown event listener to the host element.
   */
  private attachKeydownListener(): void {
    this.keydownListener = (event: KeyboardEvent): void => {
      this.handleKeydown(event);
    };

    this.elementRef.nativeElement.addEventListener(
      'keydown',
      this.keydownListener
    );
  }

  /**
   * Detach keydown event listener from the host element.
   */
  private detachKeydownListener(): void {
    if (this.keydownListener) {
      this.elementRef.nativeElement.removeEventListener(
        'keydown',
        this.keydownListener
      );
      this.keydownListener = undefined;
    }
  }

  /**
   * Handle keydown events and execute matching shortcuts.
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (!this.appKeyboardShortcuts || this.appKeyboardShortcuts.length === 0) {
      return;
    }

    // Find matching shortcut
    const matchingShortcut = this.appKeyboardShortcuts.find(
      (shortcut) => shortcut.key === event.key
    );

    if (matchingShortcut) {
      // Prevent default if configured (defaults to true)
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }

      // Execute action
      matchingShortcut.action();
    }
  }
}
