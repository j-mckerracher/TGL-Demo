/**
 * Array utility functions for the P2P-TGL simulation.
 * All functions are pure (do not mutate input arrays) and strictly typed.
 */

/**
 * Samples a specified number of unique elements from an array without replacement.
 * Returns a new array containing a random subset of the input.
 * If count exceeds array length, returns a shuffled copy of the entire array.
 *
 * @param array - The source array to sample from
 * @param count - The number of elements to sample
 * @returns A new array containing count random elements from the input (or all if count > length)
 *
 * @example
 * ```typescript
 * const items = [1, 2, 3, 4, 5];
 * sampleWithoutReplacement(items, 3);  // returns e.g. [2, 5, 1]
 * sampleWithoutReplacement(items, 10); // returns all 5 items in random order
 * ```
 */
export function sampleWithoutReplacement<T>(
  array: T[],
  count: number
): T[] {
  if (count <= 0) {
    return [];
  }

  // If requesting more than available, return a shuffled copy of the entire array
  if (count >= array.length) {
    return shuffle(array);
  }

  // Clone the array to avoid mutating the original
  const pool = [...array];
  const result: T[] = [];

  // Use Fisher-Yates partial shuffle to select count elements
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * (pool.length - i)) + i;
    // Swap the randomly selected element to position i
    [pool[i], pool[randomIndex]] = [pool[randomIndex], pool[i]];
    result.push(pool[i]);
  }

  return result;
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * Returns a new shuffled array without modifying the original.
 *
 * @param array - The array to shuffle
 * @returns A new array with elements in random order
 *
 * @example
 * ```typescript
 * const ordered = [1, 2, 3, 4, 5];
 * const shuffled = shuffle(ordered);  // returns e.g. [3, 1, 5, 2, 4]
 * // ordered is unchanged: [1, 2, 3, 4, 5]
 * ```
 */
export function shuffle<T>(array: T[]): T[] {
  // Clone the array to avoid mutating the original
  const result = [...array];

  // Fisher-Yates shuffle algorithm
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at positions i and j
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Returns a new array containing only the unique elements from the input array.
 * Preserves the order of first occurrence for each unique element.
 * Uses strict equality (===) for comparison.
 *
 * @param array - The array to filter for unique elements
 * @returns A new array containing only unique elements in first-occurrence order
 *
 * @example
 * ```typescript
 * unique([1, 2, 2, 3, 1, 4]);      // returns [1, 2, 3, 4]
 * unique(['a', 'b', 'a', 'c']);    // returns ['a', 'b', 'c']
 * unique([1, 1, 1]);               // returns [1]
 * ```
 */
export function unique<T>(array: T[]): T[] {
  // Use a Set to track seen values, then filter to preserve first occurrences
  const seen = new Set<T>();
  const result: T[] = [];

  for (const item of array) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }

  return result;
}
