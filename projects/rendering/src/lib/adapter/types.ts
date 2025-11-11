/**
 * Type definitions for RenderingAdapterV1.
 *
 * This module defines interfaces for the rendering adapter abstraction layer,
 * which provides capability detection, lifecycle management, and swappable
 * rendering implementations for future library changes.
 *
 * Version: v1.0
 */

import type { SimulationStateV1 } from 'simulation';

/**
 * Theme configuration for visual rendering.
 *
 * Defines color palette and motion preferences that control
 * the appearance and animation behavior of the visualization.
 */
export interface ThemeV1 {
  /** Color palette for visualization elements */
  palette: {
    /** Primary color for nodes and key elements */
    primary: string;
    /** Secondary color for edges and supporting elements */
    secondary: string;
    /** Background color */
    background: string;
    /** Accent color for highlights */
    accent: string;
  };

  /** Motion and animation settings */
  motion: {
    /** Base animation duration in milliseconds */
    animationDuration: number;
    /** Whether to enable smooth transitions */
    enableTransitions: boolean;
  };
}

/**
 * Capability detection results.
 *
 * Reports what rendering features are available in the current environment.
 */
export interface RenderingCapabilities {
  /** Whether WebGL is available */
  webgl: boolean;
  /** Whether WebGPU is available (future support) */
  webgpu?: boolean;
}

/**
 * Interface for the rendering adapter abstraction layer.
 *
 * The adapter provides:
 * - Capability detection for WebGL/WebGPU support
 * - Lifecycle management (init/dispose with guards)
 * - Safe no-op render paths when not initialized
 * - Support for both animated (requestAnimationFrame) and discrete (reduced-motion) rendering
 * - Swappable implementation to support future library changes
 */
export interface RenderingAdapterV1 {
  /**
   * Initialize the adapter with a canvas and theme.
   *
   * Must be called before any rendering operations.
   *
   * @param canvas - The HTMLCanvasElement to render into
   * @param theme - Visual theme configuration
   * @throws Error if canvas is not a valid HTMLCanvasElement
   */
  init(canvas: HTMLCanvasElement, theme: ThemeV1): void;

  /**
   * Synchronize adapter state with simulation state.
   *
   * Updates internal state for the next render. Safe to call
   * even when not initialized (will be a no-op).
   *
   * @param state - Current simulation state to render
   */
  syncState(state: SimulationStateV1): void;

  /**
   * Render a single frame using requestAnimationFrame.
   *
   * For smooth animations. Schedules next frame automatically
   * when in continuous animation mode.
   */
  renderFrame(): void;

  /**
   * Render a single discrete frame (reduced-motion mode).
   *
   * For accessibility. Does not schedule further frames.
   * Safe to call even when not initialized (will be a no-op).
   */
  renderDiscrete(): void;

  /**
   * Clean up resources and cancel any pending render operations.
   *
   * Idempotent - safe to call multiple times.
   * After dispose, the adapter must be reinitialized before use.
   */
  dispose(): void;

  /**
   * Detect rendering capabilities in the current environment.
   *
   * @returns Object indicating available rendering features
   */
  capabilities(): RenderingCapabilities;
}
