/**
 * Unit tests for StatsAggregatorService.
 *
 * Tests verify:
 * - Aggregation of round statistics
 * - Series length capping at max (500 points)
 * - Throttling at ~66ms intervals
 * - Reset functionality
 * - Chart series format
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StatsAggregatorService } from './stats-aggregator.service';
import type { RoundStatsV1 } from 'simulation';

describe('StatsAggregatorService', () => {
  let service: StatsAggregatorService;

  const createMockStats = (
    consensusDistance: number,
    totalEdgesUsed: number
  ): RoundStatsV1 => ({
    consensusDistance,
    totalEdgesUsed,
    timeMs: 10,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StatsAggregatorService],
    });
    service = TestBed.inject(StatsAggregatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('aggregation', () => {
    it('should aggregate round statistics', () => {
      const stats = createMockStats(0.5, 100);

      const result = service.aggregate(stats);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should update series with new values', () => {
      service.aggregate(createMockStats(0.5, 100));
      service.aggregate(createMockStats(0.4, 110));

      // Wait for throttle to pass
      const series = service.getCurrentSeries();

      expect(series.length).toBe(2); // consensus and edges
      expect(series[0].points.length).toBe(2);
      expect(series[1].points.length).toBe(2);
    });

    it('should track consensus distance in first series', () => {
      service.aggregate(createMockStats(0.5, 100));
      service.aggregate(createMockStats(0.4, 110));
      service.aggregate(createMockStats(0.3, 120));

      const series = service.getCurrentSeries();
      const consensusSeries = series[0];

      expect(consensusSeries.label).toBe('Consensus Distance');
      expect(consensusSeries.points[0].y).toBe(0.5);
      expect(consensusSeries.points[1].y).toBe(0.4);
      expect(consensusSeries.points[2].y).toBe(0.3);
    });

    it('should track edges used in second series', () => {
      service.aggregate(createMockStats(0.5, 100));
      service.aggregate(createMockStats(0.4, 110));
      service.aggregate(createMockStats(0.3, 120));

      const series = service.getCurrentSeries();
      const edgesSeries = series[1];

      expect(edgesSeries.label).toBe('Edges Used');
      expect(edgesSeries.points[0].y).toBe(100);
      expect(edgesSeries.points[1].y).toBe(110);
      expect(edgesSeries.points[2].y).toBe(120);
    });

    it('should assign incrementing x values', () => {
      service.aggregate(createMockStats(0.5, 100));
      service.aggregate(createMockStats(0.4, 110));
      service.aggregate(createMockStats(0.3, 120));

      const series = service.getCurrentSeries();
      const points = series[0].points;

      expect(points[0].x).toBe(0);
      expect(points[1].x).toBe(1);
      expect(points[2].x).toBe(2);
    });
  });

  describe('series cap', () => {
    it('should cap series length at maxSeriesLength (500)', () => {
      // Add 600 points
      for (let i = 0; i < 600; i++) {
        service.aggregate(createMockStats(i * 0.001, i * 10));
      }

      const series = service.getCurrentSeries();

      // Both series should be capped at 500
      expect(series[0].points.length).toBe(500);
      expect(series[1].points.length).toBe(500);
    });

    it('should remove oldest points when exceeding max length', () => {
      // Add 505 points
      for (let i = 0; i < 505; i++) {
        service.aggregate(createMockStats(i, i * 10));
      }

      const series = service.getCurrentSeries();
      const consensusSeries = series[0];

      // Should have 500 points, starting from point 5 (0-4 removed)
      expect(consensusSeries.points.length).toBe(500);
      expect(consensusSeries.points[0].y).toBe(5); // First point is now 5
      expect(consensusSeries.points[499].y).toBe(504); // Last point is 504
    });

    it('should maintain series integrity after capping', () => {
      // Add points beyond max
      for (let i = 0; i < 550; i++) {
        service.aggregate(createMockStats(i * 0.01, i));
      }

      const series = service.getCurrentSeries();

      // Verify both series capped
      expect(series[0].points.length).toBe(500);
      expect(series[1].points.length).toBe(500);

      // Verify data matches (edges series should have values 50-549)
      expect(series[1].points[0].y).toBe(50);
      expect(series[1].points[499].y).toBe(549);
    });
  });

  describe('throttling', () => {
    it('should return null if called within throttle interval', fakeAsync(() => {
      const result1 = service.aggregate(createMockStats(0.5, 100));
      expect(result1).not.toBeNull();

      // Call again immediately (within 66ms)
      tick(30);
      const result2 = service.aggregate(createMockStats(0.4, 110));
      expect(result2).toBeNull();
    }));

    it('should return data after throttle interval elapses', fakeAsync(() => {
      const result1 = service.aggregate(createMockStats(0.5, 100));
      expect(result1).not.toBeNull();

      // Wait for throttle interval to pass
      tick(70);

      const result2 = service.aggregate(createMockStats(0.4, 110));
      expect(result2).not.toBeNull();
    }));

    it('should accumulate data even when throttled', fakeAsync(() => {
      // Add points rapidly
      service.aggregate(createMockStats(0.5, 100));
      tick(30);
      service.aggregate(createMockStats(0.4, 110));
      tick(30);
      service.aggregate(createMockStats(0.3, 120));

      // All data should be accumulated
      const series = service.getCurrentSeries();
      expect(series[0].points.length).toBe(3);
    }));

    it('should respect ~66ms throttle interval (15 fps)', fakeAsync(() => {
      let emitCount = 0;

      // Try to emit 100 times over 1 second (1000ms)
      for (let i = 0; i < 100; i++) {
        const result = service.aggregate(createMockStats(i, i));
        if (result !== null) {
          emitCount++;
        }
        tick(10); // 10ms between calls
      }

      // Should emit approximately 1000 / 66 = ~15 times
      // Allow some tolerance
      expect(emitCount).toBeGreaterThanOrEqual(12);
      expect(emitCount).toBeLessThanOrEqual(18);
    }));
  });

  describe('reset', () => {
    it('should clear all series', () => {
      service.aggregate(createMockStats(0.5, 100));
      service.aggregate(createMockStats(0.4, 110));
      service.aggregate(createMockStats(0.3, 120));

      service.reset();

      const series = service.getCurrentSeries();
      expect(series[0].points.length).toBe(0);
      expect(series[1].points.length).toBe(0);
    });

    it('should reset throttle state', fakeAsync(() => {
      service.aggregate(createMockStats(0.5, 100));

      service.reset();

      // First aggregate after reset should not be throttled
      const result = service.aggregate(createMockStats(0.4, 110));
      expect(result).not.toBeNull();
    }));

    it('should allow new aggregation after reset', () => {
      service.aggregate(createMockStats(0.5, 100));
      service.reset();

      const result = service.aggregate(createMockStats(0.4, 110));

      expect(result).not.toBeNull();
      const series = service.getCurrentSeries();
      expect(series[0].points.length).toBe(1);
    });
  });

  describe('chart series format', () => {
    it('should return array of ChartSeries', () => {
      service.aggregate(createMockStats(0.5, 100));

      const series = service.getCurrentSeries();

      expect(Array.isArray(series)).toBe(true);
      expect(series.length).toBe(2);
    });

    it('should include label for each series', () => {
      service.aggregate(createMockStats(0.5, 100));

      const series = service.getCurrentSeries();

      expect(series[0].label).toBeDefined();
      expect(series[0].label).toBe('Consensus Distance');
      expect(series[1].label).toBeDefined();
      expect(series[1].label).toBe('Edges Used');
    });

    it('should include color for each series', () => {
      service.aggregate(createMockStats(0.5, 100));

      const series = service.getCurrentSeries();

      expect(series[0].color).toBeDefined();
      expect(series[1].color).toBeDefined();
    });

    it('should include points array with x,y coordinates', () => {
      service.aggregate(createMockStats(0.5, 100));

      const series = service.getCurrentSeries();
      const point = series[0].points[0];

      expect(point).toBeDefined();
      expect(typeof point.x).toBe('number');
      expect(typeof point.y).toBe('number');
    });
  });

  describe('getCurrentSeries', () => {
    it('should return current series without throttling', () => {
      service.aggregate(createMockStats(0.5, 100));

      const series1 = service.getCurrentSeries();
      const series2 = service.getCurrentSeries();

      // Both calls should return data immediately
      expect(series1).toBeDefined();
      expect(series2).toBeDefined();
      expect(series1[0].points.length).toBe(series2[0].points.length);
    });
  });
});
