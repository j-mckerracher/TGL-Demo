/**
 * Stats Aggregator Service.
 *
 * Aggregates RoundStatsV1 emissions from the engine into chart-ready series.
 * Features:
 * - Series length capping (~500 points max)
 * - Throttled updates (~66ms for 15 fps redraw)
 * - Multiple series tracking (consensus distance, edges used)
 *
 * Version: v1.0
 */

import { Injectable } from '@angular/core';
import type { RoundStatsV1 } from 'simulation';

/**
 * Chart series data point.
 */
export interface ChartPoint {
  x: number;
  y: number;
}

/**
 * Chart series with label and points.
 */
export interface ChartSeries {
  label: string;
  points: ChartPoint[];
  color?: string;
}

/**
 * Injectable stats aggregator service.
 *
 * Aggregates simulation statistics and provides chart-ready data
 * with throttling to avoid jank.
 */
@Injectable({
  providedIn: 'root',
})
export class StatsAggregatorService {
  private readonly maxSeriesLength = 500;
  private readonly throttleIntervalMs = 66; // ~15 fps

  private consensusSeries: number[] = [];
  private edgesSeries: number[] = [];
  private roundIndex = 0;
  private lastEmitTime = 0;

  /**
   * Aggregate new round statistics.
   *
   * Updates internal series and returns chart-ready data if throttle
   * interval has elapsed. Returns null if throttled.
   *
   * @param stats - Round statistics to aggregate
   * @returns Chart series array or null if throttled
   */
  aggregate(stats: RoundStatsV1): ChartSeries[] | null {
    // Push new values to series
    this.consensusSeries.push(stats.consensusDistance);
    this.edgesSeries.push(stats.totalEdgesUsed);

    // Cap series length (remove oldest if exceeds max)
    if (this.consensusSeries.length > this.maxSeriesLength) {
      this.consensusSeries.shift();
    }
    if (this.edgesSeries.length > this.maxSeriesLength) {
      this.edgesSeries.shift();
    }

    this.roundIndex++;

    // Throttle: check if enough time has elapsed
    const now = performance.now();
    if (now - this.lastEmitTime < this.throttleIntervalMs) {
      return null; // Skip this update
    }

    this.lastEmitTime = now;

    // Return chart-ready series
    return this.buildChartSeries();
  }

  /**
   * Reset all series and throttle state.
   */
  reset(): void {
    this.consensusSeries = [];
    this.edgesSeries = [];
    this.roundIndex = 0;
    this.lastEmitTime = 0;
  }

  /**
   * Get current series without throttling.
   *
   * @returns Current chart series
   */
  getCurrentSeries(): ChartSeries[] {
    return this.buildChartSeries();
  }

  /**
   * Build chart series from internal data.
   *
   * @returns Array of chart series
   */
  private buildChartSeries(): ChartSeries[] {
    const startIndex = Math.max(
      0,
      this.roundIndex - this.consensusSeries.length
    );

    return [
      {
        label: 'Consensus Distance',
        color: '#3b82f6',
        points: this.consensusSeries.map((y, i) => ({
          x: startIndex + i,
          y,
        })),
      },
      {
        label: 'Edges Used',
        color: '#8b5cf6',
        points: this.edgesSeries.map((y, i) => ({
          x: startIndex + i,
          y,
        })),
      },
    ];
  }
}
