/**
 * Type definitions for SimulationEngineV1.
 *
 * This module defines the data model for the deterministic simulation engine,
 * including parameters, state, statistics, and the engine interface.
 *
 * Version: v1.0
 */

import { Observable } from 'rxjs';

/**
 * Configuration parameters for a simulation run.
 */
export interface SimulationParametersV1 {
  /** Seed for deterministic PRNG initialization */
  seed: number;

  /** Node counts for each layer */
  nodeCounts: {
    /** Number of mechanism nodes */
    mechanism: number;
    /** Number of peer-to-peer nodes */
    p2p: number;
  };

  /** Round budget limits for each phase */
  phaseBudgets: {
    /** Maximum rounds for setup phase */
    setup: number;
    /** Maximum rounds for run phase */
    run: number;
  };

  /** Degree (number of connections) for P2P nodes */
  p2pDegree: number;

  /** Convergence threshold for consensus distance */
  epsilon: number;

  /** Whether reduced motion mode is enabled for UI animations */
  reducedMotionEnabled: boolean;
}

/**
 * Current state of the simulation at a given round.
 */
export interface SimulationStateV1 {
  /** Current round index (0-based) */
  roundIndex: number;

  /** Current simulation phase */
  phase: 'setup' | 'run' | 'done';

  /** Opaque snapshot of PRNG state (for determinism verification) */
  randomState: unknown;
}

/**
 * Statistics for a single round.
 */
export interface RoundStatsV1 {
  /** Total edges used in this round */
  totalEdgesUsed: number;

  /** Consensus distance metric (lower is better) */
  consensusDistance: number;

  /** Time taken for this round in milliseconds */
  timeMs: number;
}

/**
 * Summary statistics for an entire simulation run.
 */
export interface RunSummaryV1 {
  /** Total number of rounds executed */
  totalRounds: number;

  /** Total edges used across all rounds */
  totalEdges: number;

  /** Whether convergence was achieved */
  convergenceAchieved: boolean;

  /** Round at which convergence was achieved (if applicable) */
  convergenceRound?: number;
}

/**
 * Interface for the deterministic simulation engine.
 *
 * The engine provides:
 * - Deterministic execution: same seed produces identical state sequences
 * - Observable state stream for reactive UI updates
 * - Round-by-round stepping with convergence detection
 * - State reset for reproducibility
 */
export interface SimulationEngineV1 {
  /**
   * Observable stream of simulation state changes.
   * Emits new state after each round or phase transition.
   */
  readonly state$: Observable<SimulationStateV1>;

  /**
   * Initialize the engine with simulation parameters.
   *
   * @param params - Configuration parameters for the simulation
   */
  initialize(params: SimulationParametersV1): void;

  /**
   * Step the simulation forward by one round.
   * Advances phase logic and emits new state.
   */
  stepRound(): void;

  /**
   * Check if the simulation has converged.
   *
   * @returns true if convergence criteria are met
   */
  isConverged(): boolean;

  /**
   * Get statistics for the most recent round.
   *
   * @returns Stats for the last executed round
   */
  getStats(): RoundStatsV1;

  /**
   * Get summary statistics for the entire run.
   *
   * @returns Aggregate statistics for all rounds
   */
  getSummary(): RunSummaryV1;

  /**
   * Reset the engine to its initial seed state.
   * Calling this followed by stepRound() produces identical state sequence.
   */
  resetToSeed(): void;
}
