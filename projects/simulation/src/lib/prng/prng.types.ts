/**
 * PRNGV1 interface for deterministic pseudo-random number generation.
 *
 * This interface defines a versioned API for pseudo-random number generators
 * that guarantees deterministic behavior across all browsers and runs.
 *
 * Version: v1.0
 */
export interface PRNGV1 {
  /**
   * Version identifier for this PRNG interface.
   * Enables tracking and compatibility checks across releases.
   */
  readonly version: 'v1.0';

  /**
   * Initialize the PRNG with a seed value.
   *
   * @param seed - A numeric seed value. Same seed produces identical sequences.
   */
  seed(seed: number): void;

  /**
   * Generate the next pseudo-random float in the range [0, 1).
   *
   * @returns A floating-point value in the range [0, 1), where 0 is inclusive and 1 is exclusive.
   */
  nextFloat(): number;

  /**
   * Capture the current internal state of the PRNG.
   *
   * The returned value is opaque and should only be used with the restore() method.
   *
   * @returns An opaque snapshot of the current PRNG state.
   */
  snapshot(): unknown;

  /**
   * Restore the PRNG to a previously captured state.
   *
   * After restoration, subsequent nextFloat() calls will produce identical outputs
   * as if continuing from the saved state.
   *
   * @param snapshot - A snapshot previously returned by snapshot().
   * @throws Error if the snapshot is invalid or incompatible.
   */
  restore(snapshot: unknown): void;
}
