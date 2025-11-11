/**
 * SimulationEngineV1 implementation.
 *
 * A deterministic simulation engine that:
 * - Uses PRNGV1 for reproducible randomness
 * - Emits state changes via RxJS observables
 * - Steps through phases: setup → run → done
 * - Detects convergence via epsilon threshold
 *
 * Version: v1.0
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { createPRNGV1 } from '../prng/prng_v1';
import type { PRNGV1 } from '../prng/prng.types';
import type {
  SimulationEngineV1,
  SimulationParametersV1,
  SimulationStateV1,
  RoundStatsV1,
  RunSummaryV1,
} from './types';

/**
 * Internal implementation of SimulationEngineV1.
 */
class SimulationEngineV1Impl implements SimulationEngineV1 {
  private prng: PRNGV1;
  private params!: SimulationParametersV1;
  private stateSubject: BehaviorSubject<SimulationStateV1>;
  private roundIndex: number = 0;
  private currentPhase: 'setup' | 'run' | 'done' = 'setup';
  private totalEdges: number = 0;
  private lastStats: RoundStatsV1 = {
    totalEdgesUsed: 0,
    consensusDistance: 1.0,
    timeMs: 0,
  };
  private convergenceRound: number | undefined = undefined;
  private originalSeed: number = 0;

  constructor() {
    this.prng = createPRNGV1();

    // Initialize with a default state
    const initialState: SimulationStateV1 = {
      roundIndex: 0,
      phase: 'setup',
      randomState: this.prng.snapshot(),
    };
    this.stateSubject = new BehaviorSubject<SimulationStateV1>(initialState);
  }

  get state$(): Observable<SimulationStateV1> {
    return this.stateSubject.asObservable();
  }

  initialize(params: SimulationParametersV1): void {
    this.params = params;
    this.originalSeed = params.seed;
    this.prng.seed(params.seed);
    this.resetState();
    this.emitState();
  }

  stepRound(): void {
    if (this.currentPhase === 'done') {
      return; // No-op if already done
    }

    // Advance round
    this.roundIndex++;

    // Generate stats using PRNG for determinism
    const edgesUsed = Math.floor(this.prng.nextFloat() * 50) + 10; // 10-60 edges
    this.totalEdges += edgesUsed;

    // Calculate dummy consensus distance that decreases over time
    // Use PRNG to add some variance but generally trend downward
    const baseDistance = Math.max(
      0,
      this.params.epsilon * 2 - this.roundIndex * 0.01
    );
    const variance = (this.prng.nextFloat() - 0.5) * this.params.epsilon * 0.2;
    const consensusDistance = Math.max(0, baseDistance + variance);

    // Simulate round execution time
    const timeMs = Math.floor(this.prng.nextFloat() * 20) + 5; // 5-25ms

    this.lastStats = {
      totalEdgesUsed: edgesUsed,
      consensusDistance,
      timeMs,
    };

    // Check for convergence
    if (!this.convergenceRound && consensusDistance < this.params.epsilon) {
      this.convergenceRound = this.roundIndex;
    }

    // Advance phase logic
    if (this.currentPhase === 'setup') {
      if (this.roundIndex >= this.params.phaseBudgets.setup) {
        this.currentPhase = 'run';
      }
    } else if (this.currentPhase === 'run') {
      const runRounds = this.roundIndex - this.params.phaseBudgets.setup;
      if (
        runRounds >= this.params.phaseBudgets.run ||
        this.convergenceRound !== undefined
      ) {
        this.currentPhase = 'done';
      }
    }

    this.emitState();
  }

  isConverged(): boolean {
    return this.convergenceRound !== undefined;
  }

  getStats(): RoundStatsV1 {
    return { ...this.lastStats };
  }

  getSummary(): RunSummaryV1 {
    return {
      totalRounds: this.roundIndex,
      totalEdges: this.totalEdges,
      convergenceAchieved: this.convergenceRound !== undefined,
      convergenceRound: this.convergenceRound,
    };
  }

  resetToSeed(): void {
    this.prng.seed(this.originalSeed);
    this.resetState();
    this.emitState();
  }

  /**
   * Reset all internal state counters and stats.
   */
  private resetState(): void {
    this.roundIndex = 0;
    this.currentPhase = 'setup';
    this.totalEdges = 0;
    this.lastStats = {
      totalEdgesUsed: 0,
      consensusDistance: 1.0,
      timeMs: 0,
    };
    this.convergenceRound = undefined;
  }

  /**
   * Emit current state to observers.
   */
  private emitState(): void {
    const state: SimulationStateV1 = {
      roundIndex: this.roundIndex,
      phase: this.currentPhase,
      randomState: this.prng.snapshot(),
    };
    this.stateSubject.next(state);
  }
}

/**
 * Factory function to create a new SimulationEngineV1 instance.
 *
 * @returns A new simulation engine instance
 */
export function createSimulationEngineV1(): SimulationEngineV1 {
  return new SimulationEngineV1Impl();
}
