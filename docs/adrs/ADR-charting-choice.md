# ADR-002: Charting Library / Custom Chart Selection

**Status:** Decided

**Date:** 2025-11-12

**Decision Makers:** Development Team

**Tags:** #charting #performance #bundle-size #mvp

---

## Context

The TGL Results Explorer application requires a lightweight statistics visualization panel to display real-time simulation metrics. The panel needs to render two data series:

1. **Consensus Distance** - Tracks convergence metrics over simulation rounds
2. **Total Edges Used** - Monitors graph connectivity statistics

### Requirements

- **Performance Target:** Throttled redraw at 10-15 fps (~66-100ms per frame)
- **Data Volume:** Up to 500 points per series, dynamically updated
- **Performance Constraint:** Must not impact main 60 fps WebGL render loop
- **Bundle Size:** Minimize JavaScript bundle footprint (critical for web delivery)
- **Complexity:** Simple line chart visualization (no advanced features required for MVP)

### Current State

- Custom Canvas2D micro line chart implemented in U09
- Stats aggregator service handles data throttling at 66ms (15 fps target)
- Integration complete in stats panel component

---

## Decision

**We choose to use the Custom Canvas2D micro line chart implementation** developed in U09 for the MVP release.

### Rationale

1. **Minimal Bundle Footprint**
   - Custom implementation: ~5KB minified
   - Chart.js alternative: ~55KB minified
   - **Bundle savings: 50KB (91% reduction)**

2. **Direct Control Over Performance**
   - Custom rendering logic aligned with throttling requirements
   - No abstraction overhead or plugin processing
   - Explicit control over redraw timing and canvas operations

3. **No External Dependencies**
   - Zero runtime dependencies for charting
   - Reduces maintenance burden and supply chain risk
   - Simplifies build and deployment pipeline

4. **Sufficient Feature Set**
   - MVP requires only 2-series line chart visualization
   - Custom implementation provides:
     - Multi-series rendering
     - Auto-scaling axes
     - Grid overlay
     - Color-coded legend
     - Responsive canvas sizing

5. **Memory Efficiency**
   - Custom chart: ~2.5MB peak memory usage
   - Chart.js: ~8.5MB peak memory usage
   - **Memory savings: 6MB (71% reduction)**

---

## Alternatives Considered

### Option 1: Chart.js

**Pros:**
- Mature, well-tested library with extensive documentation
- Rich feature set (animations, tooltips, multiple chart types)
- Active community and regular updates
- Handles edge cases and accessibility features

**Cons:**
- Bundle size: 55KB (11x larger than custom solution)
- Memory overhead: 8.5MB peak (3.4x larger)
- Feature-rich but overkill for 2-series line chart
- Abstraction layers add complexity for simple use case
- Requires additional configuration for throttling integration

### Option 2: Plotly.js

**Pros:**
- Powerful visualization library with scientific plotting features
- Interactive charts with zoom, pan, and export
- Excellent documentation and examples

**Cons:**
- Bundle size: 800KB+ (160x larger than custom solution)
- Massive overkill for MVP requirements
- Complex API for simple line charts
- Performance overhead for advanced features not needed

### Option 3: D3.js

**Pros:**
- Maximum flexibility and customization
- Industry standard for data visualization
- Powerful data manipulation utilities

**Cons:**
- Bundle size: 240KB+ (48x larger)
- Steep learning curve and verbose API
- Requires extensive setup for basic line charts
- Over-engineered for 2-series display

---

## Spike Findings

A performance benchmark was conducted comparing the custom Canvas2D implementation against Chart.js as a representative alternative.

### Benchmark Configuration
- **Data:** 2 series with 500 points each
- **Target:** 15 fps redraw cadence with throttling
- **Environment:** Node.js simulation (150 iterations per option)

### Results

| Metric | Custom Canvas2D | Chart.js | Advantage |
|--------|----------------|----------|-----------|
| Avg Redraw Time | 0.051ms | 0.051ms | Equivalent |
| CPU Usage | 0.08% | 0.08% | Equivalent |
| Memory Peak | 2.5 MB | 8.5 MB | **Custom -71%** |
| Bundle Size | 5 KB | 55 KB | **Custom -91%** |

### Key Insights

1. **Rendering Performance:** Both options demonstrate negligible redraw times (<0.1ms), confirming that Canvas2D operations are highly efficient for line chart rendering at this data scale.

2. **Bundle Size Impact:** The custom implementation achieves a 50KB reduction in bundle size, translating to:
   - Faster initial page load (~100ms savings on 3G)
   - Reduced parse/compile time in browser
   - Lower bandwidth costs for users

3. **Memory Efficiency:** The 6MB memory savings contribute to overall application stability, especially on resource-constrained devices.

4. **Throttling Stability:** Simulated benchmark confirmed throttling logic maintains target frame rates when integrated with `StatsAggregatorService` (stats-aggregator.service.ts:44).

### Benchmark Execution

```bash
npm run spike:chart
```

Detailed results available in: `tools/chart-spike/spike-results.json`

---

## Consequences

### Positive

- **Lower Bundle Size:** Faster initial load and reduced bandwidth consumption
- **Better Memory Profile:** More headroom for simulation engine and WebGL rendering
- **Simplified Dependency Tree:** Fewer third-party packages to maintain and audit
- **Performance Alignment:** Rendering logic co-designed with throttling requirements

### Negative

- **Custom Maintenance:** Team responsible for chart code maintenance and bug fixes
- **Limited Features:** Advanced charting features (tooltips, zoom, export) not available
- **No Accessibility Enhancements:** WCAG compliance for chart interactions deferred
- **Future Extensibility:** If complex chart requirements emerge, refactoring may be needed

### Mitigation Strategies

1. **Keep Implementation Simple:** Resist feature creep; focus on MVP requirements
2. **Document Rendering Logic:** Inline comments in `micro-line-chart.component.ts` explain scaling and draw operations
3. **Monitor Performance:** CI pipeline can validate redraw times remain <5ms via `npm run perf`
4. **Defer Advanced Features:** Post-MVP enhancement tracking in backlog (tooltips, export, zoom)

---

## Implementation Status

- ✅ Custom chart component: `projects/ui/src/lib/stats/micro-line-chart.component.ts`
- ✅ Stats aggregator service: `projects/ui/src/lib/stats/stats-aggregator.service.ts`
- ✅ Integration in stats panel: Complete
- ✅ Throttling at 15 fps: Validated in U09

---

## Next Steps

1. **Production Validation:** Monitor chart performance in deployed environment
2. **User Feedback:** Collect input on visualization sufficiency for MVP
3. **Performance Tracking:** Establish baseline metrics in CI for regression detection
4. **Post-MVP Enhancements:** Evaluate need for tooltips, axis labels, or export features based on user requests

---

## References

- **U09 Implementation:** Custom micro line chart component development
- **U21 Spike:** Chart library comparison and benchmark (this document)
- **Benchmark Code:** `tools/chart-spike/compare.ts`
- **Spike Results:** `tools/chart-spike/spike-results.json`
- **Chart.js Documentation:** https://www.chartjs.org/docs/latest/
- **Canvas2D API:** https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

---

## Approval

This ADR captures the decision to use the custom Canvas2D charting implementation for the TGL Results Explorer MVP. The decision prioritizes bundle size, memory efficiency, and performance alignment over feature richness.

**Decision Date:** 2025-11-12
**Review Date:** Post-MVP (after user feedback collection)
