/**
 * FallbackService.
 *
 * Detects WebGL/WebGPU availability and manages fallback mode state.
 * When graphics capabilities are unavailable, activates fallback mode
 * which replaces canvases with static placeholders and disables
 * animation-related controls.
 *
 * Features:
 * - WebGL capability detection via canvas context creation
 * - Signal-based reactive state management
 * - Static placeholder generation for degraded mode
 * - Animation control disabling flag
 *
 * Version: v1.0
 */

import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FallbackService {
  /**
   * Signal indicating whether fallback mode is active.
   * True when WebGL is unavailable; false when graphics capabilities exist.
   */
  public readonly isFallbackActive: WritableSignal<boolean> = signal(false);

  /**
   * Detect WebGL capabilities by attempting to create a rendering context.
   *
   * @returns true if fallback mode should be activated (no WebGL), false otherwise
   */
  detectCapabilities(): boolean {
    try {
      // Create temporary canvas for capability detection
      const canvas = document.createElement('canvas');

      // Try WebGL2 first, then fall back to WebGL1
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (gl) {
        // Clean up context to free resources
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
        return false; // WebGL available, no fallback needed
      }

      return true; // No WebGL context, activate fallback
    } catch (e) {
      // Error during detection - assume fallback needed
      return true;
    }
  }

  /**
   * Initialize the service by detecting capabilities and updating state.
   * Call this during application bootstrap or component initialization.
   */
  initialize(): void {
    const needsFallback = this.detectCapabilities();
    this.isFallbackActive.set(needsFallback);
  }

  /**
   * Get a static placeholder image or message for use when graphics are unavailable.
   *
   * @returns SVG data URI or informational message
   */
  getStaticPlaceholder(): string {
    // Return SVG data URI with a simple placeholder graphic
    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f5f5f5"/>
        <text x="200" y="140" font-family="sans-serif" font-size="16" fill="#666" text-anchor="middle">
          Graphics Not Available
        </text>
        <text x="200" y="165" font-family="sans-serif" font-size="14" fill="#999" text-anchor="middle">
          WebGL is not supported in your browser
        </text>
      </svg>
    `)}`;
  }

  /**
   * Determine whether animation controls should be disabled.
   *
   * @returns true if controls should be disabled, false otherwise
   */
  shouldDisableAnimationControls(): boolean {
    return this.isFallbackActive();
  }
}
