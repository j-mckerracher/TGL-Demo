# FPS Harness - Performance Measurement Tool

Performance measurement harness for the TGL Results Explorer simulation engine.

## Purpose

This tool provides local performance validation by measuring:
- Frames per second (FPS) during simulation execution
- Memory usage throughout the test
- Overall execution metrics

## Usage

Run the performance harness with default simulation parameters:

```bash
npm run perf
```

## Output

The harness reports the following metrics:

- **Duration**: Total test duration in seconds
- **Total frames**: Number of simulation rounds executed
- **Average FPS**: Mean frames per second
- **Min/Max FPS**: Range of FPS values observed
- **Memory**: Peak JavaScript heap usage in MB
- **Status**: PASS/FAIL based on performance thresholds

### Example Output

```
=== FPS Harness Results ===
Duration: 30.0s
Total frames: 1800
Average FPS: 60.0
Min FPS: 55
Max FPS: 62
Memory: 185MB
Status: PASS (target: ~60 fps, memory <200MB)
```

## Performance Targets

- **FPS**: ≥55 fps average (target ~60 fps)
- **Memory**: <200MB peak usage

## Notes

- **Simulation Only**: This harness measures the simulation engine in isolation, **without rendering**. The reported FPS reflects pure computation performance, not visual rendering performance.
- **No GPU Rendering**: Since this runs in Node.js, there is no canvas/GPU rendering. Visual rendering FPS (when integrated with the UI) will be lower due to DOM/WebGL overhead.
- **Hardware Variance**: FPS and memory usage vary by hardware
- **Baseline**: Use results as a baseline for tracking performance regressions over time
- **Local Testing Only**: This tool is for local validation; CI/CD environments may show different results

## Implementation Details

The harness:
1. Creates a simulation engine with default parameters (seed: 42, 50 mechanism nodes, 50 P2P nodes)
2. Runs the simulation for up to 30 seconds or 1000 frames, whichever comes first
3. Measures frame timing for each `stepRound()` call (pure simulation logic)
4. Captures memory snapshots using Node.js `process.memoryUsage()`
5. Outputs aggregated metrics to console
6. Exits with code 0 (PASS) or 1 (FAIL) based on performance thresholds

### Note on Performance Metrics

The harness measures **simulation engine performance only**, not rendering performance. When the simulation is integrated with the UI and rendering layer:
- Rendering FPS will be capped by browser refresh rate (typically 60 Hz)
- DOM/Canvas/WebGL operations add overhead
- Visual FPS will be lower than the values reported by this harness

This tool is useful for:
- Tracking simulation logic performance regressions
- Validating memory usage of the simulation engine
- Establishing baseline metrics for optimization work
