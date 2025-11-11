/**
 * Takeaway Service.
 *
 * Computes and formats key takeaway messages by comparing two RunSummaryV1
 * results (typically Mechanism vs P2P baseline).
 *
 * Features:
 * - Percentage calculation for edge reduction
 * - Round delta computation
 * - Optional absolute edge counts (feature flag gated)
 * - Template-based message formatting
 *
 * Version: v1.0
 */

import { Injectable } from '@angular/core';
import type { RunSummaryV1 } from 'simulation';

/**
 * Takeaway data structure.
 *
 * Contains computed comparison metrics between two simulation runs.
 */
export interface TakeawayV1 {
  /** Percentage fewer edges (positive if A uses fewer than B) */
  percentFewerEdges: number;

  /** Round difference (positive if A finishes faster than B) */
  roundsDelta: number;

  /** Absolute edges for run A (optional, feature flag gated) */
  absEdgesA?: number;

  /** Absolute edges for run B (optional, feature flag gated) */
  absEdgesB?: number;
}

/**
 * Injectable takeaway service.
 *
 * Computes comparison metrics and formats templated messages.
 */
@Injectable({
  providedIn: 'root',
})
export class TakeawayService {
  /**
   * Default message template.
   */
  private readonly defaultTemplate =
    'Mechanism achieved {percentFewerEdges}% fewer edges in {roundsDelta} rounds';

  /**
   * Compute takeaway metrics from two run summaries.
   *
   * @param summaryA - First run summary (typically Mechanism)
   * @param summaryB - Second run summary (typically P2P baseline)
   * @param includeAbsolutes - Whether to include absolute edge counts
   * @returns Computed takeaway metrics
   */
  compute(
    summaryA: RunSummaryV1,
    summaryB: RunSummaryV1,
    includeAbsolutes: boolean = false
  ): TakeawayV1 {
    // Calculate percentage fewer edges
    // Positive if A uses fewer edges than B
    const percentFewerEdges =
      summaryB.totalEdges > 0
        ? ((summaryB.totalEdges - summaryA.totalEdges) / summaryB.totalEdges) *
          100
        : 0;

    // Calculate rounds delta
    // Positive if A finishes in fewer rounds than B
    const roundsDelta = summaryB.totalRounds - summaryA.totalRounds;

    const takeaway: TakeawayV1 = {
      percentFewerEdges: Math.round(percentFewerEdges * 100) / 100, // Round to 2 decimal places
      roundsDelta,
    };

    // Include absolute edge counts if requested
    if (includeAbsolutes) {
      takeaway.absEdgesA = summaryA.totalEdges;
      takeaway.absEdgesB = summaryB.totalEdges;
    }

    return takeaway;
  }

  /**
   * Format a message using template and takeaway data.
   *
   * Replaces template placeholders with actual values from takeaway.
   * Handles missing optional fields gracefully.
   *
   * @param takeaway - Computed takeaway metrics
   * @param template - Message template with placeholders
   * @returns Formatted message
   */
  formatMessage(
    takeaway: TakeawayV1,
    template: string = this.defaultTemplate
  ): string {
    let message = template;

    // Replace percentFewerEdges
    message = message.replace(
      /\{percentFewerEdges\}/g,
      takeaway.percentFewerEdges.toFixed(2)
    );

    // Replace roundsDelta
    message = message.replace(
      /\{roundsDelta\}/g,
      Math.abs(takeaway.roundsDelta).toString()
    );

    // Replace absolute edges (if available)
    if (takeaway.absEdgesA !== undefined) {
      message = message.replace(
        /\{absEdgesA\}/g,
        takeaway.absEdgesA.toString()
      );
    } else {
      // Remove placeholder if not available
      message = message.replace(/\{absEdgesA\}/g, 'N/A');
    }

    if (takeaway.absEdgesB !== undefined) {
      message = message.replace(
        /\{absEdgesB\}/g,
        takeaway.absEdgesB.toString()
      );
    } else {
      // Remove placeholder if not available
      message = message.replace(/\{absEdgesB\}/g, 'N/A');
    }

    return message;
  }

  /**
   * Get default template.
   *
   * @returns Default message template
   */
  getDefaultTemplate(): string {
    return this.defaultTemplate;
  }
}
