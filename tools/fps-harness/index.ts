/**
 * FPS Harness - Performance Measurement Tool
 *
 * Measures frames per second (FPS) and memory usage during simulation execution.
 * Provides local performance validation and baseline metrics for optimization.
 *
 * Usage: npm run perf
 */

import { performance } from 'perf_hooks';
import { createSimulationEngineV1 } from '../../projects/simulation/src/lib/engine/simulation_engine_v1';
import type { SimulationParametersV1 } from '../../projects/simulation/src/lib/engine/types';

/**
 * Results from a performance harness run.
 */
export interface HarnessResult {
  /** Test duration in seconds */
  duration: number;
  /** Total simulation frames executed */
  totalFrames: number;
  /** Average frames per second */
  averageFps: number;
  /** Minimum FPS observed (lowest performance) */
  minFps: number;
  /** Maximum FPS observed (highest performance) */
  maxFps: number;
  /** Peak memory usage in MB */
  peakMemory: number;
  /** Pass/fail status based on thresholds */
  status: 'PASS' | 'FAIL';
}

/**
 * Default simulation parameters for performance testing.
 */
const DEFAULT_PARAMS: SimulationParametersV1 = {
  seed: 42,
  nodeCounts: {
    mechanism: 50,
    p2p: 50,
  },
  phaseBudgets: {
    setup: 10,
    run: 100,
  },
  p2pDegree: 3,
  epsilon: 0.01,
  reducedMotionEnabled: false,
};

/**
 * Performance thresholds for pass/fail determination.
 */
const THRESHOLDS = {
  minFps: 55, // Minimum acceptable FPS
  maxMemoryMB: 200, // Maximum acceptable memory usage
};

/**
 * Test duration in milliseconds.
 */
const TEST_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Maximum frames to run (prevents infinite loops).
 * Set to a reasonable number to complete the test in a timely manner.
 */
const MAX_FRAMES = 1000;

/**
 * Run the FPS performance harness.
 *
 * Executes the simulation with default parameters and measures:
 * - Frame timing (FPS)
 * - Memory usage
 * - Overall performance metrics
 *
 * @returns Performance metrics and pass/fail status
 */
export async function runFpsHarness(): Promise<HarnessResult> {
  // Create and initialize simulation engine
  const engine = createSimulationEngineV1();
  engine.initialize(DEFAULT_PARAMS);

  // Metrics collection
  const frameTimes: number[] = [];
  let frameCount = 0;
  const startTime = performance.now();

  // Simulation loop - measure frame timing
  // Note: We don't check convergence in the loop to get accurate sustained performance
  while (
    performance.now() - startTime < TEST_DURATION_MS &&
    frameCount < MAX_FRAMES
  ) {
    const frameStart = performance.now();
    engine.stepRound();
    const frameEnd = performance.now();

    frameTimes.push(frameEnd - frameStart);
    frameCount++;
  }

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds

  // Calculate FPS metrics
  const averageFps = frameCount / duration;

  // Min FPS = slowest frame (longest time)
  const slowestFrame = Math.max(...frameTimes);
  const minFps = slowestFrame > 0 ? 1000 / slowestFrame : 0;

  // Max FPS = fastest frame (shortest time)
  const fastestFrame = Math.min(...frameTimes);
  const maxFps = fastestFrame > 0 ? 1000 / fastestFrame : 0;

  // Memory measurement (Node.js)
  const memUsage = process.memoryUsage();
  const peakMemory = memUsage.heapUsed / (1024 * 1024); // Convert to MB

  // Determine pass/fail status
  const status =
    averageFps >= THRESHOLDS.minFps && peakMemory < THRESHOLDS.maxMemoryMB ? 'PASS' : 'FAIL';

  return {
    duration: Math.round(duration * 10) / 10, // Round to 1 decimal
    totalFrames: frameCount,
    averageFps: Math.round(averageFps * 10) / 10, // Round to 1 decimal
    minFps: Math.round(minFps),
    maxFps: Math.round(maxFps),
    peakMemory: Math.round(peakMemory),
    status,
  };
}

/**
 * Format and display harness results to console.
 */
function displayResults(result: HarnessResult): void {
  console.log('=== FPS Harness Results ===');
  console.log(`Duration: ${result.duration}s`);
  console.log(`Total frames: ${result.totalFrames}`);
  console.log(`Average FPS: ${result.averageFps}`);
  console.log(`Min FPS: ${result.minFps}`);
  console.log(`Max FPS: ${result.maxFps}`);
  console.log(`Memory: ${result.peakMemory}MB`);
  console.log(
    `Status: ${result.status} (target: ~60 fps, memory <${THRESHOLDS.maxMemoryMB}MB)`
  );
}

/**
 * Main entry point when run as a script.
 */
if (require.main === module) {
  runFpsHarness()
    .then((result) => {
      displayResults(result);
      process.exit(result.status === 'PASS' ? 0 : 1);
    })
    .catch((err) => {
      console.error('Harness error:', err);
      process.exit(1);
    });
}
