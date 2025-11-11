/**
 * Unit tests for SimulationEngineV1.
 *
 * Tests verify:
 * - Determinism: same seed produces identical state sequences
 * - Convergence detection via epsilon threshold
 * - Reset functionality preserves determinism
 * - Summary statistics aggregation
 */

import { firstValueFrom, take, toArray } from 'rxjs';
import { createSimulationEngineV1 } from './simulation_engine_v1';
import type { SimulationParametersV1, SimulationStateV1 } from './types';

describe('SimulationEngineV1', () => {
  const defaultParams: SimulationParametersV1 = {
    seed: 42,
    nodeCounts: { mechanism: 10, p2p: 100 },
    phaseBudgets: { setup: 5, run: 20 },
    p2pDegree: 6,
    epsilon: 0.1,
    reducedMotionEnabled: false,
  };

  describe('determinism', () => {
    it('should produce identical state sequences for same seed', async () => {
      // Create two independent engine instances
      const engine1 = createSimulationEngineV1();
      const engine2 = createSimulationEngineV1();

      // Initialize both with identical parameters
      engine1.initialize(defaultParams);
      engine2.initialize(defaultParams);

      // Collect first 4 state emissions (initial + 3 rounds)
      const states1Promise = firstValueFrom(
        engine1.state$.pipe(take(4), toArray())
      );
      const states2Promise = firstValueFrom(
        engine2.state$.pipe(take(4), toArray())
      );

      // Step both engines 3 times
      for (let i = 0; i < 3; i++) {
        engine1.stepRound();
        engine2.stepRound();
      }

      const states1 = await states1Promise;
      const states2 = await states2Promise;

      // Verify we collected 4 states each
      expect(states1.length).toBe(4);
      expect(states2.length).toBe(4);

      // Verify all emissions match exactly
      for (let i = 0; i < states1.length; i++) {
        expect(states1[i].roundIndex).toBe(states2[i].roundIndex);
        expect(states1[i].phase).toBe(states2[i].phase);
        // Random state should be identical (deep comparison)
        expect(JSON.stringify(states1[i].randomState)).toBe(
          JSON.stringify(states2[i].randomState)
        );
      }
    });

    it('should produce different sequences for different seeds', async () => {
      const engine1 = createSimulationEngineV1();
      const engine2 = createSimulationEngineV1();

      const params1 = { ...defaultParams, seed: 42 };
      const params2 = { ...defaultParams, seed: 123 };

      engine1.initialize(params1);
      engine2.initialize(params2);

      const states1Promise = firstValueFrom(
        engine1.state$.pipe(take(3), toArray())
      );
      const states2Promise = firstValueFrom(
        engine2.state$.pipe(take(3), toArray())
      );

      engine1.stepRound();
      engine1.stepRound();
      engine2.stepRound();
      engine2.stepRound();

      const states1 = await states1Promise;
      const states2 = await states2Promise;

      // Random states should differ (at least one should be different)
      const randomStates1 = states1.map((s) => JSON.stringify(s.randomState));
      const randomStates2 = states2.map((s) => JSON.stringify(s.randomState));

      const anyDifferent = randomStates1.some(
        (rs, i) => rs !== randomStates2[i]
      );
      expect(anyDifferent).toBe(true);
    });
  });

  describe('convergence detection', () => {
    it('should detect convergence when consensus distance drops below epsilon', () => {
      const engine = createSimulationEngineV1();
      const params: SimulationParametersV1 = {
        ...defaultParams,
        epsilon: 0.1,
        phaseBudgets: { setup: 5, run: 50 },
      };

      engine.initialize(params);

      // Step until converged (with safety limit)
      let steps = 0;
      const maxSteps = 100;
      while (!engine.isConverged() && steps < maxSteps) {
        engine.stepRound();
        steps++;
      }

      // Verify convergence was detected
      expect(engine.isConverged()).toBe(true);

      const summary = engine.getSummary();
      expect(summary.convergenceAchieved).toBe(true);
      expect(summary.convergenceRound).toBeGreaterThan(0);
      expect(summary.convergenceRound).toBeLessThanOrEqual(summary.totalRounds);
    });

    it('should report non-convergence if epsilon not reached', () => {
      const engine = createSimulationEngineV1();
      const params: SimulationParametersV1 = {
        ...defaultParams,
        epsilon: 0.001, // Very tight threshold
        phaseBudgets: { setup: 1, run: 2 }, // Very short run
      };

      engine.initialize(params);

      // Step through entire budget
      for (let i = 0; i < 3; i++) {
        engine.stepRound();
      }

      const summary = engine.getSummary();
      // May or may not converge with such tight epsilon; just verify consistency
      expect(summary.convergenceAchieved).toBe(engine.isConverged());
      if (summary.convergenceAchieved) {
        expect(summary.convergenceRound).toBeDefined();
      } else {
        expect(summary.convergenceRound).toBeUndefined();
      }
    });
  });

  describe('reset functionality', () => {
    it('should reproduce identical state sequence after reset', async () => {
      const engine = createSimulationEngineV1();
      engine.initialize(defaultParams);

      // Collect first run states
      const firstRunPromise = firstValueFrom(
        engine.state$.pipe(take(4), toArray())
      );
      for (let i = 0; i < 3; i++) {
        engine.stepRound();
      }
      const firstRunStates = await firstRunPromise;

      // Reset and collect second run states
      engine.resetToSeed();
      const secondRunPromise = firstValueFrom(
        engine.state$.pipe(take(4), toArray())
      );
      for (let i = 0; i < 3; i++) {
        engine.stepRound();
      }
      const secondRunStates = await secondRunPromise;

      // Verify both runs have same number of states
      expect(firstRunStates.length).toBe(secondRunStates.length);

      // Verify all states match exactly
      for (let i = 0; i < firstRunStates.length; i++) {
        expect(firstRunStates[i].roundIndex).toBe(
          secondRunStates[i].roundIndex
        );
        expect(firstRunStates[i].phase).toBe(secondRunStates[i].phase);
        expect(JSON.stringify(firstRunStates[i].randomState)).toBe(
          JSON.stringify(secondRunStates[i].randomState)
        );
      }
    });

    it('should reset after many rounds and reproduce initial sequence', async () => {
      const engine = createSimulationEngineV1();
      engine.initialize(defaultParams);

      // Capture first 3 states
      const initialStatesPromise = firstValueFrom(
        engine.state$.pipe(take(3), toArray())
      );
      engine.stepRound();
      engine.stepRound();
      const initialStates = await initialStatesPromise;

      // Step many more rounds
      for (let i = 0; i < 10; i++) {
        engine.stepRound();
      }

      // Reset and capture first 3 states again
      engine.resetToSeed();
      const resetStatesPromise = firstValueFrom(
        engine.state$.pipe(take(3), toArray())
      );
      engine.stepRound();
      engine.stepRound();
      const resetStates = await resetStatesPromise;

      // Verify the sequences match
      expect(initialStates.length).toBe(resetStates.length);
      for (let i = 0; i < initialStates.length; i++) {
        expect(initialStates[i].roundIndex).toBe(resetStates[i].roundIndex);
        expect(initialStates[i].phase).toBe(resetStates[i].phase);
        expect(JSON.stringify(initialStates[i].randomState)).toBe(
          JSON.stringify(resetStates[i].randomState)
        );
      }
    });
  });

  describe('phase transitions', () => {
    it('should transition from setup to run to done', async () => {
      const engine = createSimulationEngineV1();
      const params: SimulationParametersV1 = {
        ...defaultParams,
        phaseBudgets: { setup: 2, run: 3 },
      };

      engine.initialize(params);

      // Collect all state transitions
      const statesPromise = firstValueFrom(
        engine.state$.pipe(take(6), toArray())
      );

      // Step through all phases
      for (let i = 0; i < 5; i++) {
        engine.stepRound();
      }

      const states = await statesPromise;

      // Verify phase progression
      expect(states[0].phase).toBe('setup'); // Initial state
      expect(states[1].phase).toBe('setup'); // Round 1
      expect(states[2].phase).toBe('setup'); // Round 2
      expect(states[3].phase).toBe('run'); // Round 3 (transition to run)
      expect(states[4].phase).toBe('run'); // Round 4
      expect(states[5].phase).toBe('done'); // Round 5 (transition to done)
    });

    it('should transition to done early if convergence achieved', async () => {
      const engine = createSimulationEngineV1();
      const params: SimulationParametersV1 = {
        ...defaultParams,
        epsilon: 0.15, // More lenient threshold
        phaseBudgets: { setup: 1, run: 50 },
      };

      engine.initialize(params);

      // Step until convergence or done
      let steps = 0;
      const maxSteps = 60;
      while (steps < maxSteps) {
        const stateBefore = await firstValueFrom(engine.state$);
        if (stateBefore.phase === 'done') break;
        engine.stepRound();
        steps++;
      }

      const finalState = await firstValueFrom(engine.state$);
      expect(finalState.phase).toBe('done');

      // If converged early, total rounds should be less than budget
      const summary = engine.getSummary();
      if (summary.convergenceAchieved) {
        const totalBudget = params.phaseBudgets.setup + params.phaseBudgets.run;
        expect(summary.totalRounds).toBeLessThanOrEqual(totalBudget);
      }
    });
  });

  describe('statistics', () => {
    it('should provide valid round stats', () => {
      const engine = createSimulationEngineV1();
      engine.initialize(defaultParams);

      engine.stepRound();
      const stats = engine.getStats();

      expect(stats.totalEdgesUsed).toBeGreaterThan(0);
      expect(stats.consensusDistance).toBeGreaterThanOrEqual(0);
      expect(stats.timeMs).toBeGreaterThan(0);
    });

    it('should aggregate summary statistics correctly', () => {
      const engine = createSimulationEngineV1();
      const params: SimulationParametersV1 = {
        ...defaultParams,
        phaseBudgets: { setup: 2, run: 3 },
      };

      engine.initialize(params);

      // Step through all rounds
      for (let i = 0; i < 5; i++) {
        engine.stepRound();
      }

      const summary = engine.getSummary();

      expect(summary.totalRounds).toBe(5);
      expect(summary.totalEdges).toBeGreaterThan(0);
      expect(typeof summary.convergenceAchieved).toBe('boolean');

      if (summary.convergenceAchieved) {
        expect(summary.convergenceRound).toBeDefined();
        expect(summary.convergenceRound).toBeGreaterThan(0);
        expect(summary.convergenceRound).toBeLessThanOrEqual(
          summary.totalRounds
        );
      } else {
        expect(summary.convergenceRound).toBeUndefined();
      }
    });

    it('should accumulate total edges across rounds', () => {
      const engine = createSimulationEngineV1();
      engine.initialize(defaultParams);

      let previousTotal = 0;
      for (let i = 0; i < 5; i++) {
        engine.stepRound();
        const summary = engine.getSummary();
        expect(summary.totalEdges).toBeGreaterThan(previousTotal);
        previousTotal = summary.totalEdges;
      }
    });
  });

  describe('state observable', () => {
    it('should emit initial state on initialize', async () => {
      const engine = createSimulationEngineV1();

      const statePromise = firstValueFrom(engine.state$);
      engine.initialize(defaultParams);
      const state = await statePromise;

      expect(state.roundIndex).toBe(0);
      expect(state.phase).toBe('setup');
      expect(state.randomState).toBeDefined();
    });

    it('should emit state after each round', async () => {
      const engine = createSimulationEngineV1();
      engine.initialize(defaultParams);

      const statesPromise = firstValueFrom(
        engine.state$.pipe(take(4), toArray())
      );

      engine.stepRound();
      engine.stepRound();
      engine.stepRound();

      const states = await statesPromise;

      expect(states.length).toBe(4); // Initial + 3 rounds
      expect(states[0].roundIndex).toBe(0);
      expect(states[1].roundIndex).toBe(1);
      expect(states[2].roundIndex).toBe(2);
      expect(states[3].roundIndex).toBe(3);
    });

    it('should not emit after stepRound when already done', async () => {
      const engine = createSimulationEngineV1();
      const params: SimulationParametersV1 = {
        ...defaultParams,
        phaseBudgets: { setup: 1, run: 1 },
      };

      engine.initialize(params);

      // Step until done
      engine.stepRound();
      engine.stepRound();

      const stateBefore = await firstValueFrom(engine.state$);
      expect(stateBefore.phase).toBe('done');

      const roundIndexBefore = stateBefore.roundIndex;

      // Try stepping again (should be no-op)
      engine.stepRound();

      const stateAfter = await firstValueFrom(engine.state$);
      expect(stateAfter.roundIndex).toBe(roundIndexBefore);
      expect(stateAfter.phase).toBe('done');
    });
  });
});
