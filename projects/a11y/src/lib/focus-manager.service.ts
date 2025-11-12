/**
 * FocusManagerService
 *
 * Manages focus order, focus trapping, and focus restoration for accessibility.
 * Features:
 * - Set initial focus on interactive elements
 * - Trap focus within a container (for modals)
 * - Restore focus after dialog/modal closes
 * - Mark regions as ARIA live regions
 * - Helper methods to find focusable elements
 *
 * Version: v1.0
 */

import { Injectable } from '@angular/core';

/**
 * Selector for all focusable elements.
 */
const FOCUSABLE_ELEMENTS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

@Injectable({
  providedIn: 'root',
})
export class FocusManagerService {
  /**
   * Set focus to the first interactive element within a container.
   * Useful for setting initial focus on page load or after navigation.
   *
   * @param element - The container element to search within
   */
  setInitialFocus(element: HTMLElement): void {
    const firstFocusable = this.getFirstFocusableElement(element);
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Trap focus within a container element.
   * Prevents Tab/Shift+Tab from escaping the container.
   * Useful for modal dialogs and overlays.
   *
   * @param containerElement - The container to trap focus within
   * @returns A function to remove the focus trap
   */
  trapFocus(containerElement: HTMLElement): () => void {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements =
        this.getFocusableElements(containerElement);
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift+Tab: if on first element, move to last
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, move to first
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerElement.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return (): void => {
      containerElement.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Return focus to a previously focused element.
   * Useful after closing a modal or dialog.
   *
   * @param previousElement - The element to return focus to
   */
  returnFocus(previousElement: HTMLElement): void {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }

  /**
   * Mark a region as an ARIA live region.
   * Screen readers will announce updates to this region.
   *
   * @param regionElement - The element to mark as live
   * @param ariaLive - The politeness level ('polite' or 'assertive')
   */
  announceRegion(
    regionElement: HTMLElement,
    ariaLive: 'polite' | 'assertive' = 'polite'
  ): void {
    regionElement.setAttribute('aria-live', ariaLive);
    regionElement.setAttribute('aria-atomic', 'true');
  }

  /**
   * Get the first focusable element within a container.
   *
   * @param container - The container to search within
   * @returns The first focusable element, or null if none found
   */
  getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container);
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * Get the last focusable element within a container.
   *
   * @param container - The container to search within
   * @returns The last focusable element, or null if none found
   */
  getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container);
    return elements.length > 0 ? elements[elements.length - 1] : null;
  }

  /**
   * Get all focusable elements within a container.
   *
   * @param container - The container to search within
   * @returns Array of focusable HTMLElements
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
    );

    // Filter out elements that are not visible
    return elements.filter((element) => {
      return (
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        getComputedStyle(element).visibility !== 'hidden'
      );
    });
  }
}
