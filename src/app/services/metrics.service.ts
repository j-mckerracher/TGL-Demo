import { Injectable, inject, computed } from '@angular/core';
import { SimulationService } from './simulation.service';
import { ComparisonMetrics } from '../models/metrics.model';

/**
 * Service that computes comparison metrics between P2P and TGL simulations.
 * Provides reactive signals for displaying performance differences.
 */
@Injectable({
  providedIn: 'root',
})
export class MetricsService {
  private readonly simulationService = inject(SimulationService);

  /**
   * Computed signal that calculates comparison metrics between P2P and TGL.
   * Returns null if either simulation has not completed.
   */
  readonly comparison = computed<ComparisonMetrics | null>(() => {
    const p2pState = this.simulationService.p2pState();
    const tglState = this.simulationService.tglState();

    // Only compute comparison if both simulations are complete
    if (!p2pState.isComplete || !tglState.isComplete) {
      return null;
    }

    // Calculate time difference
    const p2pTime = p2pState.endTime && p2pState.startTime
      ? p2pState.endTime - p2pState.startTime
      : 0;
    const tglTime = tglState.endTime && tglState.startTime
      ? tglState.endTime - tglState.startTime
      : 0;

    const timeDifference = p2pTime - tglTime;

    // Calculate message reduction percentage: (P2P - TGL) / P2P * 100
    const messageReduction = p2pState.totalMessagesSent > 0
      ? ((p2pState.totalMessagesSent - tglState.totalMessagesSent) / p2pState.totalMessagesSent) * 100
      : 0;

    // Calculate round difference
    const roundDifference = p2pState.round - tglState.round;

    // Calculate efficiency improvement (messages * rounds)
    const p2pEfficiency = p2pState.totalMessagesSent * p2pState.round;
    const tglEfficiency = tglState.totalMessagesSent * tglState.round;
    const efficiencyImprovement = p2pEfficiency > 0
      ? ((p2pEfficiency - tglEfficiency) / p2pEfficiency) * 100
      : 0;

    return {
      flooding: {
        protocol: p2pState.protocol,
        totalRounds: p2pState.round,
        totalMessages: p2pState.totalMessagesSent,
        completionTime: p2pTime,
        finalCoverage: p2pState.coverage,
        nodeCount: p2pState.nodes.length,
        averageDegree: 0, // Can be calculated if needed
        peakMessagesPerRound: 0, // Can be tracked if needed
        startTimestamp: p2pState.startTime ?? 0,
        endTimestamp: p2pState.endTime ?? 0,
        successful: p2pState.isComplete,
      },
      tgl: {
        protocol: tglState.protocol,
        totalRounds: tglState.round,
        totalMessages: tglState.totalMessagesSent,
        completionTime: tglTime,
        finalCoverage: tglState.coverage,
        nodeCount: tglState.nodes.length,
        averageDegree: 0, // Can be calculated if needed
        peakMessagesPerRound: 0, // Can be tracked if needed
        startTimestamp: tglState.startTime ?? 0,
        endTimestamp: tglState.endTime ?? 0,
        successful: tglState.isComplete,
      },
      messageReduction,
      roundDifference,
      timeDifference,
      efficiencyImprovement,
    };
  });

  /**
   * Computed signal for message reduction percentage.
   * Positive values indicate TGL used fewer messages than P2P.
   */
  readonly messageReduction = computed(() => this.comparison()?.messageReduction ?? null);

  /**
   * Computed signal for speed gain percentage.
   * Positive values indicate TGL was faster than P2P.
   */
  readonly speedGain = computed(() => {
    const comp = this.comparison();
    if (!comp || comp.flooding.completionTime === 0) return null;
    return (comp.timeDifference / comp.flooding.completionTime) * 100;
  });

  /**
   * Computed signal for efficiency gain percentage.
   * Positive values indicate TGL was more efficient (fewer messages * rounds).
   */
  readonly efficiencyGain = computed(() => this.comparison()?.efficiencyImprovement ?? null);

  /**
   * Computed signal indicating whether both simulations have completed.
   */
  readonly bothComplete = computed(() => this.comparison() !== null);
}
