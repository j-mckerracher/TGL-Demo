/**
 * ParamsStore - Signal-based parameter store for simulation configuration.
 *
 * Provides reactive state management for simulation parameters using Angular signals.
 * Supports debounced updates for smooth slider interactions and batch updates.
 *
 * Version: v1.0
 */

import { Injectable, signal, computed } from '@angular/core';
import type { SimulationParametersV1 } from 'simulation';

/**
 * Default simulation parameters with sensible MVP values.
 */
const DEFAULT_PARAMETERS: SimulationParametersV1 = {
  seed: 42,
  nodeCounts: {
    mechanism: 50,
    p2p: 100,
  },
  phaseBudgets: {
    setup: 10,
    run: 100,
  },
  p2pDegree: 6,
  epsilon: 0.01,
  reducedMotionEnabled: false,
};

/**
 * Injectable parameter store service.
 *
 * Manages simulation parameters reactively using Angular signals.
 * All parameter updates are immediate; consumers can add their own
 * debouncing if needed (e.g., in UI components).
 */
@Injectable({
  providedIn: 'root',
})
export class ParamsStore {
  /**
   * Internal writable signal for parameters.
   */
  private readonly parametersSignal = signal<SimulationParametersV1>(
    structuredClone(DEFAULT_PARAMETERS)
  );

  /**
   * Computed read-only signal exposing current parameters.
   */
  readonly parameters = computed(() => this.parametersSignal());

  /**
   * Update a single parameter by key.
   *
   * @param key - The parameter key to update
   * @param value - The new value
   */
  updateParameter<K extends keyof SimulationParametersV1>(
    key: K,
    value: SimulationParametersV1[K]
  ): void {
    this.parametersSignal.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /**
   * Update multiple parameters at once (batch update).
   *
   * @param patch - Partial parameters to merge with current values
   */
  updateParameters(patch: Partial<SimulationParametersV1>): void {
    this.parametersSignal.update((current) => ({
      ...current,
      ...patch,
      // Deep merge nested objects
      ...(patch.nodeCounts && {
        nodeCounts: { ...current.nodeCounts, ...patch.nodeCounts },
      }),
      ...(patch.phaseBudgets && {
        phaseBudgets: { ...current.phaseBudgets, ...patch.phaseBudgets },
      }),
    }));
  }

  /**
   * Reset all parameters to default values.
   */
  resetToDefaults(): void {
    this.parametersSignal.set(structuredClone(DEFAULT_PARAMETERS));
  }

  /**
   * Generate a new random seed.
   */
  generateNewSeed(): void {
    const newSeed = Math.floor(Math.random() * 1000000);
    this.updateParameter('seed', newSeed);
  }
}
