/**
 * EngineController - Lifecycle controller for the simulation engine.
 *
 * Manages engine initialization, execution, and cleanup.
 * Provides reactive state via signals and observables.
 * Guards all methods to prevent invalid state transitions.
 *
 * Version: v1.0
 */

import { Injectable, signal } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import {
  createSimulationEngineV1,
  type SimulationEngineV1,
  type SimulationStateV1,
} from 'simulation';
import { ParamsStore } from './params.store';

/**
 * Injectable engine controller service.
 *
 * Coordinates simulation engine lifecycle and exposes state reactively.
 */
@Injectable({
  providedIn: 'root',
})
export class EngineController {
  private engine?: SimulationEngineV1;
  private animationFrameHandle?: number;

  /**
   * Signal tracking whether the engine is currently running.
   */
  readonly isRunning = signal<boolean>(false);

  /**
   * Signal tracking whether the engine is initialized.
   */
  readonly isInitialized = signal<boolean>(false);

  /**
   * Observable stream of simulation state.
   * Emits EMPTY until engine is initialized.
   */
  get engineState$(): Observable<SimulationStateV1> {
    return this.engine?.state$ ?? EMPTY;
  }

  constructor(private paramsStore: ParamsStore) {}

  /**
   * Initialize the simulation engine with current parameters.
   *
   * Creates a new engine instance and initializes it with parameters
   * from the ParamsStore. Safe to call multiple times (will reinitialize).
   */
  initialize(): void {
    // Clean up existing engine if any
    if (this.engine) {
      this.stop();
      this.engine = undefined;
    }

    // Create new engine instance
    this.engine = createSimulationEngineV1();

    // Get current parameters from store
    const params = this.paramsStore.parameters();

    // Initialize engine with parameters
    this.engine.initialize(params);

    this.isInitialized.set(true);
    this.isRunning.set(false);
  }

  /**
   * Start the simulation execution loop.
   *
   * Begins stepping through simulation rounds. Guards against
   * starting when not initialized or already running.
   */
  start(): void {
    // Guard: must be initialized
    if (!this.engine || !this.isInitialized()) {
      return;
    }

    // Guard: already running
    if (this.isRunning()) {
      return;
    }

    this.isRunning.set(true);

    // Start stepping loop
    this.scheduleNextStep();
  }

  /**
   * Stop the simulation execution loop.
   *
   * Pauses stepping. Can be resumed with start().
   * Safe to call when not running (no-op).
   */
  stop(): void {
    // Cancel any pending animation frame
    if (this.animationFrameHandle !== undefined) {
      cancelAnimationFrame(this.animationFrameHandle);
      this.animationFrameHandle = undefined;
    }

    this.isRunning.set(false);
  }

  /**
   * Reset the engine to its initial seed state.
   *
   * Preserves parameters but resets execution state.
   * Guards against calling when not initialized.
   */
  reset(): void {
    // Guard: must be initialized
    if (!this.engine || !this.isInitialized()) {
      return;
    }

    // Stop if running
    if (this.isRunning()) {
      this.stop();
    }

    // Reset engine to seed
    this.engine.resetToSeed();
  }

  /**
   * Execute a single simulation step.
   *
   * Internal method called by the stepping loop.
   * Guards against calling when not initialized.
   */
  step(): void {
    // Guard: must be initialized and running
    if (!this.engine || !this.isInitialized() || !this.isRunning()) {
      return;
    }

    // Execute one round
    this.engine.stepRound();

    // Check if we should continue
    if (this.engine.isConverged()) {
      // Simulation converged, stop automatically
      this.stop();
      return;
    }

    // Schedule next step if still running
    if (this.isRunning()) {
      this.scheduleNextStep();
    }
  }

  /**
   * Schedule the next simulation step using requestAnimationFrame.
   *
   * Internal method for animation loop.
   */
  private scheduleNextStep(): void {
    this.animationFrameHandle = requestAnimationFrame(() => {
      this.step();
    });
  }

  /**
   * Get current round statistics.
   *
   * @returns Current round stats, or undefined if not initialized
   */
  getStats() {
    return this.engine?.getStats();
  }

  /**
   * Get run summary statistics.
   *
   * @returns Run summary, or undefined if not initialized
   */
  getSummary() {
    return this.engine?.getSummary();
  }

  /**
   * Check if simulation has converged.
   *
   * @returns True if converged, false otherwise
   */
  isConverged(): boolean {
    return this.engine?.isConverged() ?? false;
  }
}
