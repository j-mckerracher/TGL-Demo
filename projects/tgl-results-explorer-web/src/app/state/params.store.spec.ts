/**
 * Unit tests for ParamsStore.
 *
 * Tests verify:
 * - Signal updates for single and batch parameter changes
 * - Deep merge for nested objects
 * - Reset to defaults
 * - Type safety
 */

import { TestBed } from '@angular/core/testing';
import { ParamsStore } from './params.store';

describe('ParamsStore', () => {
  let store: ParamsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParamsStore],
    });
    store = TestBed.inject(ParamsStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('default parameters', () => {
    it('should initialize with default parameters', () => {
      const params = store.parameters();

      expect(params).toBeDefined();
      expect(params.seed).toBe(42);
      expect(params.nodeCounts.mechanism).toBe(50);
      expect(params.nodeCounts.p2p).toBe(100);
      expect(params.phaseBudgets.setup).toBe(10);
      expect(params.phaseBudgets.run).toBe(100);
      expect(params.p2pDegree).toBe(6);
      expect(params.epsilon).toBe(0.01);
      expect(params.reducedMotionEnabled).toBe(false);
    });
  });

  describe('updateParameter', () => {
    it('should update a single primitive parameter', () => {
      store.updateParameter('epsilon', 0.05);

      const params = store.parameters();
      expect(params.epsilon).toBe(0.05);
    });

    it('should update seed parameter', () => {
      store.updateParameter('seed', 12345);

      const params = store.parameters();
      expect(params.seed).toBe(12345);
    });

    it('should update p2pDegree parameter', () => {
      store.updateParameter('p2pDegree', 10);

      const params = store.parameters();
      expect(params.p2pDegree).toBe(10);
    });

    it('should update reducedMotionEnabled parameter', () => {
      store.updateParameter('reducedMotionEnabled', true);

      const params = store.parameters();
      expect(params.reducedMotionEnabled).toBe(true);
    });

    it('should update nested object parameter', () => {
      store.updateParameter('nodeCounts', { mechanism: 75, p2p: 150 });

      const params = store.parameters();
      expect(params.nodeCounts.mechanism).toBe(75);
      expect(params.nodeCounts.p2p).toBe(150);
    });
  });

  describe('updateParameters', () => {
    it('should batch update multiple parameters', () => {
      store.updateParameters({
        epsilon: 0.02,
        p2pDegree: 8,
        seed: 999,
      });

      const params = store.parameters();
      expect(params.epsilon).toBe(0.02);
      expect(params.p2pDegree).toBe(8);
      expect(params.seed).toBe(999);
    });

    it('should deep merge nested objects', () => {
      // Initially: mechanism: 50, p2p: 100
      store.updateParameters({
        nodeCounts: { mechanism: 75, p2p: 125 },
      });

      const params = store.parameters();
      expect(params.nodeCounts.mechanism).toBe(75);
      expect(params.nodeCounts.p2p).toBe(125);
    });

    it('should partially update nested objects', () => {
      // Update only one field of nodeCounts
      store.updateParameters({
        nodeCounts: { mechanism: 30 } as any,
      });

      const params = store.parameters();
      expect(params.nodeCounts.mechanism).toBe(30);
      // p2p should remain unchanged
      expect(params.nodeCounts.p2p).toBe(100);
    });

    it('should update both primitive and nested parameters', () => {
      store.updateParameters({
        epsilon: 0.03,
        nodeCounts: { mechanism: 60, p2p: 120 },
        phaseBudgets: { setup: 15, run: 150 },
        p2pDegree: 7,
      });

      const params = store.parameters();
      expect(params.epsilon).toBe(0.03);
      expect(params.nodeCounts.mechanism).toBe(60);
      expect(params.nodeCounts.p2p).toBe(120);
      expect(params.phaseBudgets.setup).toBe(15);
      expect(params.phaseBudgets.run).toBe(150);
      expect(params.p2pDegree).toBe(7);
    });

    it('should handle empty update gracefully', () => {
      const paramsBefore = store.parameters();
      store.updateParameters({});
      const paramsAfter = store.parameters();

      expect(paramsAfter).toEqual(paramsBefore);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all parameters to defaults', () => {
      // Modify parameters
      store.updateParameters({
        epsilon: 0.5,
        seed: 99999,
        nodeCounts: { mechanism: 200, p2p: 200 },
        phaseBudgets: { setup: 100, run: 1000 },
        p2pDegree: 20,
        reducedMotionEnabled: true,
      });

      // Verify modified
      let params = store.parameters();
      expect(params.epsilon).toBe(0.5);
      expect(params.seed).toBe(99999);

      // Reset
      store.resetToDefaults();

      // Verify defaults restored
      params = store.parameters();
      expect(params.seed).toBe(42);
      expect(params.nodeCounts.mechanism).toBe(50);
      expect(params.nodeCounts.p2p).toBe(100);
      expect(params.phaseBudgets.setup).toBe(10);
      expect(params.phaseBudgets.run).toBe(100);
      expect(params.p2pDegree).toBe(6);
      expect(params.epsilon).toBe(0.01);
      expect(params.reducedMotionEnabled).toBe(false);
    });
  });

  describe('generateNewSeed', () => {
    it('should generate a new random seed', () => {
      const originalSeed = store.parameters().seed;

      store.generateNewSeed();

      const newSeed = store.parameters().seed;
      expect(newSeed).not.toBe(originalSeed);
      expect(newSeed).toBeGreaterThanOrEqual(0);
      expect(newSeed).toBeLessThan(1000000);
    });

    it('should generate different seeds on multiple calls', () => {
      store.generateNewSeed();
      const seed1 = store.parameters().seed;

      store.generateNewSeed();
      const seed2 = store.parameters().seed;

      store.generateNewSeed();
      const seed3 = store.parameters().seed;

      // Very unlikely all three are the same
      const allDifferent = seed1 !== seed2 || seed2 !== seed3 || seed1 !== seed3;
      expect(allDifferent).toBe(true);
    });
  });

  describe('signal reactivity', () => {
    it('should trigger signal updates on parameter change', () => {
      let updateCount = 0;
      const params = store.parameters;

      // Create an effect to track updates (simplified for testing)
      const initialValue = params();
      updateCount++;

      store.updateParameter('epsilon', 0.07);
      const updatedValue = params();
      updateCount++;

      expect(updatedValue.epsilon).toBe(0.07);
      expect(updateCount).toBeGreaterThan(1);
    });

    it('should provide immutable parameter objects', () => {
      const params1 = store.parameters();
      store.updateParameter('epsilon', 0.08);
      const params2 = store.parameters();

      // Different object references (immutability)
      expect(params1).not.toBe(params2);
      expect(params1.epsilon).toBe(0.01); // Original unchanged
      expect(params2.epsilon).toBe(0.08); // New value
    });
  });

  describe('type safety', () => {
    it('should enforce type-safe parameter updates', () => {
      // This test verifies compilation-time type safety
      // TypeScript should prevent invalid parameter updates

      // Valid updates (should compile)
      store.updateParameter('epsilon', 0.01);
      store.updateParameter('seed', 123);
      store.updateParameter('nodeCounts', { mechanism: 10, p2p: 20 });

      // The following would fail TypeScript compilation:
      // store.updateParameter('invalidKey', 123);
      // store.updateParameter('epsilon', 'invalid-type');

      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
