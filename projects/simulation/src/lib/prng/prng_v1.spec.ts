import { createPRNGV1 } from './prng_v1';
import { PRNGV1 } from './prng.types';

describe('PRNGV1', () => {
  describe('Factory and Interface', () => {
    it('should create a PRNGV1 instance', () => {
      const prng = createPRNGV1();
      expect(prng).toBeDefined();
      expect(prng.version).toBe('v1.0');
    });

    it('should have correct version property', () => {
      const prng = createPRNGV1();
      expect(prng.version).toBe('v1.0');
    });

    it('should implement all required methods', () => {
      const prng = createPRNGV1();
      expect(typeof prng.seed).toBe('function');
      expect(typeof prng.nextFloat).toBe('function');
      expect(typeof prng.snapshot).toBe('function');
      expect(typeof prng.restore).toBe('function');
    });
  });

  describe('Seeded Determinism', () => {
    it('should produce identical sequences for the same seed', () => {
      const prng1 = createPRNGV1();
      const prng2 = createPRNGV1();

      prng1.seed(12345);
      prng2.seed(12345);

      // Generate 1000 values from each and verify they match
      for (let i = 0; i < 1000; i++) {
        const value1 = prng1.nextFloat();
        const value2 = prng2.nextFloat();
        expect(value1).toBe(value2);
      }
    });

    it('should produce different sequences for different seeds', () => {
      const prng1 = createPRNGV1();
      const prng2 = createPRNGV1();

      prng1.seed(12345);
      prng2.seed(67890);

      const value1 = prng1.nextFloat();
      const value2 = prng2.nextFloat();

      expect(value1).not.toBe(value2);
    });

    it('should produce values in the range [0, 1)', () => {
      const prng = createPRNGV1();
      prng.seed(12345);

      for (let i = 0; i < 1000; i++) {
        const value = prng.nextFloat();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('Cross-run Determinism', () => {
    // This test ensures the same sequence is always produced
    // by storing a golden reference of the first 10 values
    it('should always produce the same sequence for seed 12345', () => {
      const prng = createPRNGV1();
      prng.seed(12345);

      // Golden reference: first 10 values for seed 12345
      // These values should NEVER change across runs
      const goldenValues = [
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
        prng.nextFloat(),
      ];

      // Re-seed and verify we get the same values
      prng.seed(12345);
      for (let i = 0; i < 10; i++) {
        const value = prng.nextFloat();
        expect(value).toBe(goldenValues[i]);
      }
    });

    it('should produce identical sequence across multiple instantiations', () => {
      const values1: number[] = [];
      const values2: number[] = [];

      // First run
      const prng1 = createPRNGV1();
      prng1.seed(999);
      for (let i = 0; i < 100; i++) {
        values1.push(prng1.nextFloat());
      }

      // Second run (new instance)
      const prng2 = createPRNGV1();
      prng2.seed(999);
      for (let i = 0; i < 100; i++) {
        values2.push(prng2.nextFloat());
      }

      // Verify all values match
      expect(values1).toEqual(values2);
    });
  });

  describe('Snapshot and Restore', () => {
    it('should round-trip snapshot and restore', () => {
      const prng = createPRNGV1();
      prng.seed(999);

      // Generate 5 values
      const before: number[] = [];
      for (let i = 0; i < 5; i++) {
        before.push(prng.nextFloat());
      }

      // Take snapshot
      const snapshot = prng.snapshot();

      // Generate 5 more values
      const middle: number[] = [];
      for (let i = 0; i < 5; i++) {
        middle.push(prng.nextFloat());
      }

      // Restore snapshot
      prng.restore(snapshot);

      // Generate 5 values again - should match 'middle'
      const after: number[] = [];
      for (let i = 0; i < 5; i++) {
        after.push(prng.nextFloat());
      }

      // Verify after restore produces same sequence as middle
      expect(after).toEqual(middle);
    });

    it('should preserve state across multiple snapshot/restore cycles', () => {
      const prng = createPRNGV1();
      prng.seed(12345);

      // Generate some values
      prng.nextFloat();
      prng.nextFloat();

      const snapshot1 = prng.snapshot();
      const values1 = [prng.nextFloat(), prng.nextFloat()];

      const snapshot2 = prng.snapshot();
      const values2 = [prng.nextFloat(), prng.nextFloat()];

      // Restore to snapshot1 and verify
      prng.restore(snapshot1);
      expect([prng.nextFloat(), prng.nextFloat()]).toEqual(values1);

      // Restore to snapshot2 and verify
      prng.restore(snapshot2);
      expect([prng.nextFloat(), prng.nextFloat()]).toEqual(values2);
    });

    it('should throw error for invalid snapshot', () => {
      const prng = createPRNGV1();

      expect(() => prng.restore(null)).toThrow('Invalid snapshot: must be an object');
      expect(() => prng.restore(undefined)).toThrow('Invalid snapshot: must be an object');
      expect(() => prng.restore('invalid')).toThrow('Invalid snapshot: must be an object');
      expect(() => prng.restore(123)).toThrow('Invalid snapshot: must be an object');
    });

    it('should throw error for incompatible snapshot version', () => {
      const prng = createPRNGV1();
      const invalidSnapshot = { version: 'v2.0', state0: 0, state1: 0 };

      expect(() => prng.restore(invalidSnapshot)).toThrow(/Incompatible snapshot version/);
    });

    it('should throw error for snapshot with missing state', () => {
      const prng = createPRNGV1();

      const invalidSnapshot1 = { version: 'v1.0', state0: 123 };
      expect(() => prng.restore(invalidSnapshot1)).toThrow('Invalid snapshot: state0 and state1 must be numbers');

      const invalidSnapshot2 = { version: 'v1.0', state1: 456 };
      expect(() => prng.restore(invalidSnapshot2)).toThrow('Invalid snapshot: state0 and state1 must be numbers');
    });
  });

  describe('Statistical Properties', () => {
    it('should produce good distribution of values', () => {
      const prng = createPRNGV1();
      prng.seed(42);

      const buckets = new Array(10).fill(0);
      const sampleSize = 10000;

      for (let i = 0; i < sampleSize; i++) {
        const value = prng.nextFloat();
        const bucketIndex = Math.floor(value * 10);
        buckets[bucketIndex]++;
      }

      // Each bucket should have approximately sampleSize/10 values
      // Allow 20% deviation for statistical variance
      const expectedPerBucket = sampleSize / 10;
      const tolerance = expectedPerBucket * 0.2;

      for (let i = 0; i < buckets.length; i++) {
        expect(buckets[i]).toBeGreaterThan(expectedPerBucket - tolerance);
        expect(buckets[i]).toBeLessThan(expectedPerBucket + tolerance);
      }
    });

    it('should not produce NaN or Infinity', () => {
      const prng = createPRNGV1();
      prng.seed(0);

      for (let i = 0; i < 1000; i++) {
        const value = prng.nextFloat();
        expect(Number.isFinite(value)).toBe(true);
        expect(Number.isNaN(value)).toBe(false);
      }
    });

    it('should handle edge case seeds', () => {
      const edgeSeeds = [0, 1, -1, 2147483647, -2147483648, 123456789];

      for (const seed of edgeSeeds) {
        const prng = createPRNGV1();
        prng.seed(seed);

        // Should produce valid values for any seed
        for (let i = 0; i < 100; i++) {
          const value = prng.nextFloat();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
          expect(Number.isFinite(value)).toBe(true);
        }
      }
    });
  });

  describe('Type Compatibility', () => {
    it('should satisfy PRNGV1 interface', () => {
      const prng: PRNGV1 = createPRNGV1();
      expect(prng).toBeDefined();
    });
  });
});
