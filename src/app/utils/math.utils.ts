/**
 * Mathematical utility functions for the P2P-TGL simulation.
 * All functions are pure (no side effects) and strictly typed.
 */

/**
 * Clamps a value between a minimum and maximum bound.
 *
 * @param value - The value to clamp
 * @param min - The minimum bound (inclusive)
 * @param max - The maximum bound (inclusive)
 * @returns The clamped value, guaranteed to be in [min, max]
 *
 * @example
 * ```typescript
 * clamp(-5, 0, 10);  // returns 0
 * clamp(15, 0, 10);  // returns 10
 * clamp(5, 0, 10);   // returns 5
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values.
 * Computes a value at position t between a and b, where t ∈ [0, 1].
 *
 * @param a - The start value (when t = 0)
 * @param b - The end value (when t = 1)
 * @param t - The interpolation parameter, typically in [0, 1]
 * @returns The interpolated value: a + (b - a) * t
 *
 * @example
 * ```typescript
 * lerp(0, 10, 0.5);   // returns 5
 * lerp(0, 10, 0);     // returns 0
 * lerp(0, 10, 1);     // returns 10
 * lerp(10, 20, 0.25); // returns 12.5
 * ```
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generates a random integer in the range [min, max] (inclusive on both ends).
 *
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (inclusive)
 * @returns A random integer in [min, max]
 *
 * @example
 * ```typescript
 * randomInt(1, 6);    // returns 1, 2, 3, 4, 5, or 6 (dice roll)
 * randomInt(0, 100);  // returns any integer from 0 to 100
 * ```
 */
export function randomInt(min: number, max: number): number {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}
