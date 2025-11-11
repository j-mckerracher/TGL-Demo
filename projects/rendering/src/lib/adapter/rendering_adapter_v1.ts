/**
 * RenderingAdapterV1 implementation.
 *
 * A minimal abstraction layer for rendering that:
 * - Detects WebGL/WebGPU capabilities
 * - Provides safe no-op render paths
 * - Manages lifecycle with guards
 * - Supports both animated and discrete rendering modes
 * - Remains swappable for future library changes
 *
 * Version: v1.0
 */

import type { SimulationStateV1 } from 'simulation';
import type {
  RenderingAdapterV1,
  RenderingCapabilities,
  ThemeV1,
} from './types';

/**
 * Internal implementation of RenderingAdapterV1.
 */
class RenderingAdapterV1Impl implements RenderingAdapterV1 {
  private canvas?: HTMLCanvasElement;
  private theme?: ThemeV1;
  private currentState?: SimulationStateV1;
  private isInitialized: boolean = false;
  private rAFHandle?: number;

  init(canvas: HTMLCanvasElement, theme: ThemeV1): void {
    // Validate canvas is an HTMLCanvasElement
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(
        'Invalid canvas: must be an HTMLCanvasElement instance'
      );
    }

    this.canvas = canvas;
    this.theme = theme;
    this.isInitialized = true;
  }

  syncState(state: SimulationStateV1): void {
    // Safe no-op if not initialized
    if (!this.isInitialized) {
      return;
    }

    this.currentState = state;
  }

  renderFrame(): void {
    // Safe no-op if not initialized
    if (!this.isInitialized) {
      return;
    }

    // Stub: actual rendering logic will be added in future units
    // For now, just demonstrate rAF scheduling capability
    // Cancel any existing pending frame
    if (this.rAFHandle !== undefined) {
      cancelAnimationFrame(this.rAFHandle);
    }

    // In a real implementation, we'd schedule the next frame here
    // For now, this is just a stub to show lifecycle management
  }

  renderDiscrete(): void {
    // Explicitly safe no-op even if not initialized
    // This is for reduced-motion accessibility mode

    // Stub: actual discrete rendering logic will be added in future units
    // No animation loop - just render current state once
    if (this.isInitialized && this.canvas && this.currentState) {
      // Placeholder for discrete rendering logic
      // In a real implementation, this would render a single frame
    }
  }

  dispose(): void {
    // Idempotent - safe to call multiple times

    // Cancel any pending animation frames
    if (this.rAFHandle !== undefined) {
      cancelAnimationFrame(this.rAFHandle);
      this.rAFHandle = undefined;
    }

    // Clear references
    this.canvas = undefined;
    this.theme = undefined;
    this.currentState = undefined;
    this.isInitialized = false;
  }

  capabilities(): RenderingCapabilities {
    // Detect WebGL availability
    let webglAvailable = false;

    // Create a temporary canvas for capability detection if we don't have one
    const testCanvas = this.canvas || document.createElement('canvas');

    try {
      // Try WebGL2 first, then fall back to WebGL1
      const gl =
        testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      webglAvailable = gl !== null;

      // Clean up context if we got one
      if (gl) {
        // Lose context to free resources
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
    } catch (e) {
      // WebGL not available or error during detection
      webglAvailable = false;
    }

    return {
      webgl: webglAvailable,
      // WebGPU detection could be added here in the future
      // webgpu: 'gpu' in navigator
    };
  }
}

/**
 * Factory function to create a new RenderingAdapterV1 instance.
 *
 * @returns A new rendering adapter instance
 */
export function createRenderingAdapterV1(): RenderingAdapterV1 {
  return new RenderingAdapterV1Impl();
}
