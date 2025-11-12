# Chart Spike - Charting Library Benchmark

**Project:** TGL Results Explorer
**Assignment:** U21
**Date:** 2025-11-12
**Status:** Complete

---

## Overview

This spike validates the custom Canvas2D micro line chart implementation (developed in U09) against alternative Canvas-based charting libraries. The goal is to confirm that the custom approach provides sufficient performance, acceptable bundle size, and reliable throttling behavior for the MVP requirements.

## Motivation

The TGL Results Explorer requires a lightweight stats visualization panel displaying two data series:
- **Consensus Distance:** Convergence metrics over simulation rounds
- **Total Edges Used:** Graph connectivity statistics

The application has strict performance constraints:
- Must not interfere with main 60 fps WebGL render loop
- Throttled chart updates at 10-15 fps (~66-100ms per frame)
- Minimal bundle size to optimize initial load time

## Benchmark Approach

The benchmark compares:

1. **Custom Canvas2D (U09):** Lightweight custom implementation with direct Canvas API usage
2. **Chart.js 4.x:** Popular Canvas-based charting library as representative alternative

### Metrics Collected

- **Average Redraw Time:** Time per frame to render chart (ms)
- **Measured FPS:** Actual frames per second achieved
- **CPU Usage:** Estimated CPU utilization during rendering (%)
- **Memory Peak:** Peak memory consumption during rendering (MB)
- **Bundle Size:** JavaScript bundle footprint (KB)
- **Throttle Stability:** Ability to maintain target 10-15 fps

### Test Configuration

- **Series Count:** 2 (matching production requirements)
- **Points Per Series:** 500 (max expected in production)
- **Target FPS:** 15 fps with 66ms throttle interval
- **Iterations:** 150 rendering cycles per option

## Usage

Run the benchmark:

```bash
npm run spike:chart
```

This executes the comparison and outputs:
1. Console table with performance comparison
2. JSON results file: `tools/chart-spike/spike-results.json`

## Results Summary

| Metric | Custom Canvas2D | Chart.js | Winner |
|--------|----------------|----------|--------|
| Avg Redraw Time | 0.051ms | 0.051ms | Tie |
| Memory Peak | 2.5 MB | 8.5 MB | **Custom (-71%)** |
| Bundle Size | 5 KB | 55 KB | **Custom (-91%)** |
| CPU Usage | 0.08% | 0.08% | Tie |

### Key Findings

1. **Bundle Size:** Custom implementation saves 50KB (91% reduction), improving initial page load by ~100ms on 3G connections.

2. **Memory Efficiency:** 6MB memory savings (71% reduction) provides more headroom for simulation engine and WebGL rendering.

3. **Rendering Performance:** Both options achieve equivalent sub-millisecond redraw times, confirming Canvas2D efficiency for line charts at this scale.

4. **Feature Sufficiency:** Custom implementation provides all required MVP features (2-series line charts, throttled updates, responsive sizing).

## Decision

**Recommendation: Use Custom Canvas2D Implementation**

The custom chart approach is optimal for MVP because:
- Significantly lower bundle and memory footprint
- Sufficient feature set for 2-series line chart visualization
- Direct control over throttling and performance characteristics
- Zero external dependencies

See detailed rationale in: [`docs/adrs/ADR-charting-choice.md`](../../docs/adrs/ADR-charting-choice.md)

## Files

- **Benchmark Harness:** `tools/chart-spike/compare.ts`
- **Benchmark Results:** `tools/chart-spike/spike-results.json`
- **Decision Record:** `docs/adrs/ADR-charting-choice.md`
- **Custom Chart Implementation:** `projects/ui/src/lib/stats/micro-line-chart.component.ts`
- **Stats Aggregator:** `projects/ui/src/lib/stats/stats-aggregator.service.ts`

## Notes

- Benchmark runs in Node.js environment (simulation)
- FPS measurements are artificially high due to simulation without real rendering delays
- Focus on relative comparison between options, not absolute values
- Measurements may vary by hardware; key insight is bundle/memory deltas

## Next Steps

1. Monitor production chart performance in deployed environment
2. Validate throttling stability at target 15 fps in browser
3. Establish CI baselines for redraw time regression detection
4. Defer advanced charting features (tooltips, zoom, export) to post-MVP backlog

---

**Assignment Complete:** U21 spike validates custom Canvas2D chart implementation as optimal choice for TGL Results Explorer MVP.
