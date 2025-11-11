import { PRNGV1 } from './prng.types';

/**
 * Internal snapshot format for PRNGV1.
 */
interface PRNGV1Snapshot {
  version: 'v1.0';
  state0: number;
  state1: number;
}

/**
 * Implementation of PRNGV1 using the xorshift* algorithm.
 *
 * This implementation uses a 64-bit state (represented as two 32-bit integers)
 * to ensure deterministic behavior and numeric stability across all browsers.
 *
 * The xorshift* algorithm is fast, has good statistical properties, and
 * produces consistent results across different JavaScript engines.
 */
class PRNGV1Impl implements PRNGV1 {
  readonly version = 'v1.0' as const;

  private state0: number = 0;
  private state1: number = 0;

  /**
   * Initialize the PRNG with a seed value.
   *
   * Uses a simple hash function to spread bits from the seed across
   * the 64-bit state. Ensures the state is never all zeros.
   */
  seed(seed: number): void {
    // Convert seed to unsigned 32-bit integer
    const s = seed >>> 0;

    // Initialize state using a simple linear congruential generator
    // to spread bits across both state variables
    this.state0 = s;
    this.state1 = (s * 1103515245 + 12345) >>> 0;

    // Ensure state is never all zeros (xorshift* requirement)
    if (this.state0 === 0 && this.state1 === 0) {
      this.state0 = 1;
      this.state1 = 0;
    }

    // Warm up the generator to improve initial randomness
    for (let i = 0; i < 10; i++) {
      this.nextFloat();
    }
  }

  /**
   * Generate the next pseudo-random float using xorshift128+ algorithm.
   *
   * The algorithm:
   * 1. Apply xorshift operations to mix bits
   * 2. Update state
   * 3. Combine results and normalize to [0, 1)
   */
  nextFloat(): number {
    // xorshift128+ algorithm
    let s1 = this.state0;
    const s0 = this.state1;

    // Update state0
    this.state0 = s0;

    // Apply xorshift operations
    s1 ^= s1 << 23; // Shift left 23
    s1 = s1 >>> 0; // Keep unsigned
    s1 ^= s1 >>> 17; // Shift right 17
    s1 ^= s0;
    s1 ^= s0 >>> 26; // Shift right 26

    // Update state1
    this.state1 = s1 >>> 0;

    // Combine and normalize to [0, 1)
    // Use addition and convert to unsigned 32-bit
    const result = (this.state1 + s0) >>> 0;

    // Divide by 2^32 to get [0, 1)
    return result / 0x100000000;
  }

  /**
   * Capture the current state as a snapshot.
   */
  snapshot(): unknown {
    const snapshot: PRNGV1Snapshot = {
      version: this.version,
      state0: this.state0,
      state1: this.state1,
    };
    return snapshot;
  }

  /**
   * Restore the PRNG state from a snapshot.
   *
   * Validates the snapshot format and version before restoration.
   */
  restore(snapshot: unknown): void {
    if (!snapshot || typeof snapshot !== 'object') {
      throw new Error('Invalid snapshot: must be an object');
    }

    const snap = snapshot as Partial<PRNGV1Snapshot>;

    if (snap.version !== this.version) {
      throw new Error(
        `Incompatible snapshot version: expected ${this.version}, got ${snap.version}`
      );
    }

    if (typeof snap.state0 !== 'number' || typeof snap.state1 !== 'number') {
      throw new Error('Invalid snapshot: state0 and state1 must be numbers');
    }

    this.state0 = snap.state0;
    this.state1 = snap.state1;
  }
}

/**
 * Factory function to create a new PRNGV1 instance.
 *
 * @returns A new PRNGV1 implementation.
 *
 * @example
 * ```typescript
 * const prng = createPRNGV1();
 * prng.seed(12345);
 * const randomValue = prng.nextFloat(); // Returns a value in [0, 1)
 * ```
 */
export function createPRNGV1(): PRNGV1 {
  return new PRNGV1Impl();
}
