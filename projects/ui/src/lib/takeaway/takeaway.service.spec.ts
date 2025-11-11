/**
 * Unit tests for TakeawayService.
 *
 * Tests verify:
 * - Computation of percentage fewer edges
 * - Computation of rounds delta
 * - Optional absolute edge counts
 * - Message formatting with templates
 * - Edge cases and error handling
 */

import { TestBed } from '@angular/core/testing';
import { TakeawayService } from './takeaway.service';
import type { RunSummaryV1 } from 'simulation';

describe('TakeawayService', () => {
  let service: TakeawayService;

  const createMockSummary = (
    totalRounds: number,
    totalEdges: number,
    convergenceAchieved: boolean = true,
    convergenceRound?: number
  ): RunSummaryV1 => ({
    totalRounds,
    totalEdges,
    convergenceAchieved,
    convergenceRound,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TakeawayService],
    });
    service = TestBed.inject(TakeawayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('compute', () => {
    it('should calculate percentage fewer edges correctly', () => {
      const summaryA = createMockSummary(10, 100);
      const summaryB = createMockSummary(12, 120);

      const takeaway = service.compute(summaryA, summaryB);

      // (120 - 100) / 120 * 100 = 16.67%
      expect(takeaway.percentFewerEdges).toBeCloseTo(16.67, 2);
    });

    it('should calculate rounds delta correctly', () => {
      const summaryA = createMockSummary(10, 100);
      const summaryB = createMockSummary(12, 120);

      const takeaway = service.compute(summaryA, summaryB);

      // 12 - 10 = 2 (B took 2 more rounds than A)
      expect(takeaway.roundsDelta).toBe(2);
    });

    it('should handle case where A uses more edges than B', () => {
      const summaryA = createMockSummary(10, 150); // More edges
      const summaryB = createMockSummary(12, 120);

      const takeaway = service.compute(summaryA, summaryB);

      // (120 - 150) / 120 * 100 = -25% (negative means A used MORE)
      expect(takeaway.percentFewerEdges).toBeCloseTo(-25, 2);
    });

    it('should handle case where A takes more rounds than B', () => {
      const summaryA = createMockSummary(15, 100); // More rounds
      const summaryB = createMockSummary(12, 120);

      const takeaway = service.compute(summaryA, summaryB);

      // 12 - 15 = -3 (negative means A took MORE rounds)
      expect(takeaway.roundsDelta).toBe(-3);
    });

    it('should handle equal edges', () => {
      const summaryA = createMockSummary(10, 100);
      const summaryB = createMockSummary(10, 100);

      const takeaway = service.compute(summaryA, summaryB);

      expect(takeaway.percentFewerEdges).toBe(0);
      expect(takeaway.roundsDelta).toBe(0);
    });

    it('should handle zero edges in baseline', () => {
      const summaryA = createMockSummary(10, 50);
      const summaryB = createMockSummary(12, 0);

      const takeaway = service.compute(summaryA, summaryB);

      // Division by zero protection
      expect(takeaway.percentFewerEdges).toBe(0);
    });

    it('should round percentage to 2 decimal places', () => {
      const summaryA = createMockSummary(10, 100);
      const summaryB = createMockSummary(12, 117);

      const takeaway = service.compute(summaryA, summaryB);

      // (117 - 100) / 117 * 100 = 14.529914...
      expect(takeaway.percentFewerEdges).toBeCloseTo(14.53, 2);
    });
  });

  describe('absolutes flag', () => {
    it('should not include absolutes when flag is false', () => {
      const summaryA = createMockSummary(10, 100);
      const summaryB = createMockSummary(12, 120);

      const takeaway = service.compute(summaryA, summaryB, false);

      expect(takeaway.absEdgesA).toBeUndefined();
      expect(takeaway.absEdgesB).toBeUndefined();
    });

    it('should include absolutes when flag is true', () => {
      const summaryA = createMockSummary(10, 100);
      const summaryB = createMockSummary(12, 120);

      const takeaway = service.compute(summaryA, summaryB, true);

      expect(takeaway.absEdgesA).toBe(100);
      expect(takeaway.absEdgesB).toBe(120);
    });

    it('should default to false when flag not provided', () => {
      const summaryA = createMockSummary(10, 100);
      const summaryB = createMockSummary(12, 120);

      const takeaway = service.compute(summaryA, summaryB);

      expect(takeaway.absEdgesA).toBeUndefined();
      expect(takeaway.absEdgesB).toBeUndefined();
    });
  });

  describe('formatMessage', () => {
    it('should replace percentFewerEdges placeholder', () => {
      const takeaway = {
        percentFewerEdges: 16.67,
        roundsDelta: 2,
      };
      const template = 'Achieved {percentFewerEdges}% improvement';

      const message = service.formatMessage(takeaway, template);

      expect(message).toContain('16.67');
      expect(message).not.toContain('{percentFewerEdges}');
    });

    it('should replace roundsDelta placeholder', () => {
      const takeaway = {
        percentFewerEdges: 16.67,
        roundsDelta: 2,
      };
      const template = 'Finished in {roundsDelta} fewer rounds';

      const message = service.formatMessage(takeaway, template);

      expect(message).toContain('2');
      expect(message).not.toContain('{roundsDelta}');
    });

    it('should replace absolute edge placeholders when available', () => {
      const takeaway = {
        percentFewerEdges: 16.67,
        roundsDelta: 2,
        absEdgesA: 100,
        absEdgesB: 120,
      };
      const template =
        'A used {absEdgesA} edges vs B used {absEdgesB} edges';

      const message = service.formatMessage(takeaway, template);

      expect(message).toContain('100');
      expect(message).toContain('120');
      expect(message).not.toContain('{absEdgesA}');
      expect(message).not.toContain('{absEdgesB}');
    });

    it('should replace missing absolute placeholders with N/A', () => {
      const takeaway = {
        percentFewerEdges: 16.67,
        roundsDelta: 2,
      };
      const template = 'A: {absEdgesA} edges, B: {absEdgesB} edges';

      const message = service.formatMessage(takeaway, template);

      expect(message).toContain('N/A');
      expect(message).not.toContain('{absEdgesA}');
      expect(message).not.toContain('{absEdgesB}');
    });

    it('should use default template when none provided', () => {
      const takeaway = {
        percentFewerEdges: 16.67,
        roundsDelta: 2,
      };

      const message = service.formatMessage(takeaway);

      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
      expect(message).toContain('16.67');
      expect(message).toContain('2');
    });

    it('should handle multiple placeholders in template', () => {
      const takeaway = {
        percentFewerEdges: 16.67,
        roundsDelta: 2,
        absEdgesA: 100,
        absEdgesB: 120,
      };
      const template =
        'Mechanism achieved {percentFewerEdges}% fewer edges ({absEdgesA} vs {absEdgesB}) in {roundsDelta} rounds';

      const message = service.formatMessage(takeaway, template);

      expect(message).toContain('16.67');
      expect(message).toContain('2');
      expect(message).toContain('100');
      expect(message).toContain('120');
    });

    it('should use absolute value of roundsDelta in message', () => {
      const takeaway = {
        percentFewerEdges: -10,
        roundsDelta: -3,
      };
      const template = 'Delta: {roundsDelta}';

      const message = service.formatMessage(takeaway, template);

      expect(message).toContain('3'); // Absolute value
      expect(message).not.toContain('-3');
    });
  });

  describe('getDefaultTemplate', () => {
    it('should return default template', () => {
      const template = service.getDefaultTemplate();

      expect(template).toBeDefined();
      expect(template.length).toBeGreaterThan(0);
      expect(template).toContain('{percentFewerEdges}');
      expect(template).toContain('{roundsDelta}');
    });
  });

  describe('edge cases', () => {
    it('should handle very small percentage differences', () => {
      const summaryA = createMockSummary(10, 999);
      const summaryB = createMockSummary(12, 1000);

      const takeaway = service.compute(summaryA, summaryB);

      // (1000 - 999) / 1000 * 100 = 0.1%
      expect(takeaway.percentFewerEdges).toBeCloseTo(0.1, 2);
    });

    it('should handle very large edge counts', () => {
      const summaryA = createMockSummary(10, 1000000);
      const summaryB = createMockSummary(12, 1200000);

      const takeaway = service.compute(summaryA, summaryB);

      expect(takeaway.percentFewerEdges).toBeCloseTo(16.67, 2);
    });

    it('should handle negative rounds (should not happen, but defensive)', () => {
      const summaryA = createMockSummary(5, 100);
      const summaryB = createMockSummary(3, 120);

      const takeaway = service.compute(summaryA, summaryB);

      expect(takeaway.roundsDelta).toBe(-2);
    });
  });
});
