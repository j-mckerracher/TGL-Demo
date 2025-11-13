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
    if (!this.isInitialized || !this.canvas || !this.theme) {
      return;
    }

    // Draw the current frame
    this.drawFrame();

    // Schedule next frame
    if (this.rAFHandle !== undefined) {
      cancelAnimationFrame(this.rAFHandle);
    }

    this.rAFHandle = requestAnimationFrame(() => this.renderFrame());
  }

  private drawFrame(): void {
    if (!this.canvas || !this.theme || !this.currentState) {
      console.log('[RenderingAdapter] drawFrame() - missing canvas, theme, or state');
      return;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      console.log('[RenderingAdapter] drawFrame() - could not get 2D context');
      return;
    }

    // Set canvas size to match display size
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    console.log('[RenderingAdapter] drawFrame() - canvas size:', this.canvas.width, 'x', this.canvas.height);

    // Clear canvas with background color
    ctx.fillStyle = this.theme.palette.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw a simple visualization based on simulation state
    this.renderSimulationState(ctx);
  }

  private renderSimulationState(ctx: CanvasRenderingContext2D): void {
    if (!this.canvas || !this.theme || !this.currentState) {
      return;
    }

    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    // Get simulation state info (using correct property names)
    const state = this.currentState as any;
    const roundIndex = state.roundIndex ?? 0;
    const phase = state.phase ?? 'unknown';
    const isDone = phase === 'done';

    console.log('[RenderingAdapter] renderSimulationState() - roundIndex:', roundIndex, 'phase:', phase, 'isDone:', isDone);

    // Draw basic info text
    ctx.fillStyle = this.theme.palette.primary;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Round: ${roundIndex}`, centerX, centerY - 40);

    // Draw phase status
    ctx.fillStyle = isDone ? this.theme.palette.accent : this.theme.palette.secondary;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(phase.toUpperCase(), centerX, centerY);

    // Draw status message
    ctx.fillStyle = this.theme.palette.primary;
    ctx.font = '14px sans-serif';
    ctx.fillText(isDone ? 'Simulation Complete' : 'Simulation Running', centerX, centerY + 40);

    // Draw a simple progress indicator circle
    const radius = 60;
    ctx.strokeStyle = this.theme.palette.secondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 80, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw a rotating progress indicator (animated by round index)
    const angle = ((roundIndex % 360) * Math.PI) / 180;
    ctx.strokeStyle = isDone ? this.theme.palette.accent : this.theme.palette.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 80, radius, angle, angle + Math.PI / 2);
    ctx.stroke();

    // Draw progress arc for phase completion
    const phaseProgress = phase === 'done' ? 1 : phase === 'run' ? 0.66 : 0.33;
    ctx.strokeStyle = this.theme.palette.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 80, radius + 15, 0, Math.PI * 2 * phaseProgress);
    ctx.stroke();
  }

  renderDiscrete(): void {
    // Safe no-op if not initialized
    // This is for reduced-motion accessibility mode - render single frame without animation loop
    if (!this.isInitialized || !this.canvas || !this.theme || !this.currentState) {
      return;
    }

    // Cancel any pending animation frames
    if (this.rAFHandle !== undefined) {
      cancelAnimationFrame(this.rAFHandle);
      this.rAFHandle = undefined;
    }

    // Render single frame without animation loop
    this.drawFrame();
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
