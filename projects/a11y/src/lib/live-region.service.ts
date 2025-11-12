/**
 * LiveRegionService
 *
 * Manages ARIA live regions for screen reader announcements.
 * Features:
 * - Create and manage live regions dynamically
 * - Announce messages with configurable politeness levels
 * - Support multiple named regions
 * - Auto-clear announcements to prevent stale content
 *
 * Version: v1.0
 */

import { Injectable } from '@angular/core';

interface LiveRegion {
  id: string;
  element: HTMLElement;
  clearTimeout?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LiveRegionService {
  private regions = new Map<string, LiveRegion>();
  private readonly clearDelay = 1000; // 1 second

  /**
   * Create or retrieve an ARIA live region.
   * The region is appended to the document body and styled to be visually hidden
   * but still accessible to screen readers.
   *
   * @param id - Unique identifier for the live region
   * @param ariaLive - Politeness level ('polite' or 'assertive')
   * @returns The live region HTMLElement
   */
  createLiveRegion(
    id: string,
    ariaLive: 'polite' | 'assertive' = 'polite'
  ): HTMLElement {
    // Return existing region if already created
    const existing = this.regions.get(id);
    if (existing) {
      return existing.element;
    }

    // Create new live region
    const element = document.createElement('div');
    element.id = `live-region-${id}`;
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', ariaLive);
    element.setAttribute('aria-atomic', 'true');

    // Visually hide but keep accessible to screen readers
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';

    document.body.appendChild(element);

    // Store region
    this.regions.set(id, { id, element });

    return element;
  }

  /**
   * Announce a message to screen readers via a live region.
   * The message will be cleared after a short delay to prevent stale announcements.
   *
   * @param message - The message to announce
   * @param regionId - The ID of the live region to use (defaults to 'default')
   */
  announce(message: string, regionId: string = 'default'): void {
    const region = this.regions.get(regionId);
    const element = region
      ? region.element
      : this.createLiveRegion(regionId);

    // Clear any pending auto-clear timeout
    if (region?.clearTimeout) {
      window.clearTimeout(region.clearTimeout);
    }

    // Set the message
    element.textContent = message;

    // Schedule auto-clear after delay
    const clearTimeout = window.setTimeout(() => {
      element.textContent = '';
    }, this.clearDelay);

    // Update region with new timeout
    this.regions.set(regionId, {
      id: regionId,
      element,
      clearTimeout,
    });
  }

  /**
   * Manually clear announcements from a live region.
   * Useful when you want to clear immediately rather than waiting for auto-clear.
   *
   * @param regionId - The ID of the live region to clear (defaults to 'default')
   */
  clearAnnouncements(regionId: string = 'default'): void {
    const region = this.regions.get(regionId);
    if (!region) {
      return;
    }

    // Clear any pending timeout
    if (region.clearTimeout) {
      window.clearTimeout(region.clearTimeout);
    }

    // Clear the content
    region.element.textContent = '';

    // Update region
    this.regions.set(regionId, {
      id: regionId,
      element: region.element,
    });
  }

  /**
   * Remove a live region from the DOM.
   * Useful for cleanup when a region is no longer needed.
   *
   * @param regionId - The ID of the live region to remove
   */
  removeLiveRegion(regionId: string): void {
    const region = this.regions.get(regionId);
    if (!region) {
      return;
    }

    // Clear any pending timeout
    if (region.clearTimeout) {
      window.clearTimeout(region.clearTimeout);
    }

    // Remove from DOM
    if (region.element.parentNode) {
      region.element.parentNode.removeChild(region.element);
    }

    // Remove from map
    this.regions.delete(regionId);
  }

  /**
   * Remove all live regions.
   * Useful for cleanup on application shutdown.
   */
  removeAllLiveRegions(): void {
    this.regions.forEach((region) => {
      if (region.clearTimeout) {
        window.clearTimeout(region.clearTimeout);
      }
      if (region.element.parentNode) {
        region.element.parentNode.removeChild(region.element);
      }
    });
    this.regions.clear();
  }
}
