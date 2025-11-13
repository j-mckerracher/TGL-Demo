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
    console.log('[EngineController] initialize() called');
    // Clean up existing engine if any
    if (this.engine) {
      console.log('[EngineController] Cleaning up existing engine');
      this.stop();
      this.engine = undefined;
    }

    // Create new engine instance
    this.engine = createSimulationEngineV1();
    console.log('[EngineController] Created new engine instance');

    // Get current parameters from store
    const params = this.paramsStore.parameters();
    console.log('[EngineController] Current params:', params);

    // Initialize engine with parameters
    this.engine.initialize(params);
    console.log('[EngineController] Engine initialized with parameters');

    this.isInitialized.set(true);
    this.isRunning.set(false);
    console.log('[EngineController] isInitialized:', true, 'isRunning:', false);
  }

  /**
   * Start the simulation execution loop.
   *
   * Begins stepping through simulation rounds. Guards against
   * starting when not initialized or already running.
   */
  start(): void {
    console.log('[EngineController] start() called');
    console.log('[EngineController] Guard check - engine exists:', !!this.engine, 'isInitialized:', this.isInitialized());
    // Guard: must be initialized
    if (!this.engine || !this.isInitialized()) {
      console.log('[EngineController] start() - BLOCKED: Engine not initialized');
      return;
    }

    console.log('[EngineController] Guard check - isRunning:', this.isRunning());
    // Guard: already running
    if (this.isRunning()) {
      console.log('[EngineController] start() - BLOCKED: Already running');
      return;
    }

    console.log('[EngineController] Starting simulation loop');
    this.isRunning.set(true);

    // Start stepping loop
    this.scheduleNextStep();
    console.log('[EngineController] scheduleNextStep() called, isRunning:', this.isRunning());
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
      console.log('[EngineController] step() - BLOCKED: engine:', !!this.engine, 'isInitialized:', this.isInitialized(), 'isRunning:', this.isRunning());
      return;
    }

    // Execute one round
    console.log('[EngineController] step() - calling stepRound()');
    this.engine.stepRound();
    console.log('[EngineController] step() - stepRound() completed');

    // Check if we should continue
    if (this.engine.isConverged()) {
      console.log('[EngineController] Simulation converged, stopping');
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
