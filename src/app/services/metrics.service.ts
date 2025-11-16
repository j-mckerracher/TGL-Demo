import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { SimulationService } from './simulation.service';
import { SettingsService } from './settings.service';
import { ComparisonMetrics, NetworkMetrics } from '../models/metrics.model';

/**
 * Service that computes comparison metrics between P2P and TGL simulations.
 * Provides reactive signals for displaying performance differences and individual network metrics.
 */
@Injectable({
  providedIn: 'root',
})
export class MetricsService {
  private readonly simulationService = inject(SimulationService);
  private readonly settingsService = inject(SettingsService);

  /**
   * Tracks the maximum message savings percentage seen during the current simulation.
   * Only updates when a new maximum is reached.
   */
  private maxMessageSavingsValue: number | null = null;
  private readonly _maxMessageSavings = signal<number | null>(null);
  public readonly maxMessageSavings = this._maxMessageSavings.asReadonly();

  constructor() {
    // Effect to track and update max message savings
    effect(() => {
      const comp = this.comparison();
      
      console.log('[MetricsService] Comparison:', comp);
      
      // Reset max when simulation restarts (no comparison available)
      if (comp === null) {
        console.log('[MetricsService] Resetting max savings to null');
        this.maxMessageSavingsValue = null;
        this._maxMessageSavings.set(null);
        return;
      }

      const currentReduction = comp.messageReduction;
      console.log('[MetricsService] Current reduction:', currentReduction);

      // Update max if we have a new maximum
      if (currentReduction !== null && currentReduction !== undefined && !Number.isNaN(currentReduction)) {
        console.log('[MetricsService] Current max:', this.maxMessageSavingsValue, 'New value:', currentReduction);
        if (this.maxMessageSavingsValue === null || currentReduction > this.maxMessageSavingsValue) {
          console.log('[MetricsService] Setting new max:', currentReduction);
          this.maxMessageSavingsValue = currentReduction;
          this._maxMessageSavings.set(currentReduction);
        }
      }
    });
  }

  /**
   * Computed signal for P2P network metrics.
   * Returns current metrics even if simulation is not complete.
   */
  readonly p2pMetrics = computed<NetworkMetrics>(() => {
    const state = this.simulationService.p2pState();

    // Calculate completion time
    const completionTime = state.endTime && state.startTime
      ? state.endTime - state.startTime
      : 0;

    return {
      protocol: state.protocol,
      totalRounds: state.round,
      totalMessages: state.totalMessagesSent,
      completionTime,
      finalCoverage: state.coverage,
      nodeCount: state.nodes.length,
      averageDegree: this.settingsService.averageDegree(),
      peakMessagesPerRound: 0, // Could be tracked if needed
      startTimestamp: state.startTime ?? 0,
      endTimestamp: state.endTime ?? 0,
      successful: state.isComplete,
    };
  });

  /**
   * Computed signal for TGL network metrics.
   * Returns current metrics even if simulation is not complete.
   */
  readonly tglMetrics = computed<NetworkMetrics>(() => {
    const state = this.simulationService.tglState();

    // Calculate completion time
    const completionTime = state.endTime && state.startTime
      ? state.endTime - state.startTime
      : 0;

    return {
      protocol: state.protocol,
      totalRounds: state.round,
      totalMessages: state.totalMessagesSent,
      completionTime,
      finalCoverage: state.coverage,
      nodeCount: state.nodes.length,
      averageDegree: 0, // TGL has different topology structure
      peakMessagesPerRound: 0, // Could be tracked if needed
      startTimestamp: state.startTime ?? 0,
      endTimestamp: state.endTime ?? 0,
      successful: state.isComplete,
    };
  });

  /**
   * Computed signal that calculates comparison metrics between P2P and TGL.
   * Returns live metrics even before simulations complete.
   */
  readonly comparison = computed<ComparisonMetrics | null>(() => {
    const p2pMetrics = this.p2pMetrics();
    const tglMetrics = this.tglMetrics();

    // Return null if neither simulation has started
    if (p2pMetrics.totalMessages === 0 && tglMetrics.totalMessages === 0) {
      return null;
    }

    // Calculate time difference
    const timeDifference = p2pMetrics.completionTime - tglMetrics.completionTime;

    // Calculate message reduction percentage: (P2P - TGL) / P2P * 100
    const messageReduction = p2pMetrics.totalMessages > 0
      ? ((p2pMetrics.totalMessages - tglMetrics.totalMessages) / p2pMetrics.totalMessages) * 100
      : 0;

    // Calculate round difference
    const roundDifference = p2pMetrics.totalRounds - tglMetrics.totalRounds;

    // Calculate efficiency improvement (messages * rounds)
    const p2pEfficiency = p2pMetrics.totalMessages * p2pMetrics.totalRounds;
    const tglEfficiency = tglMetrics.totalMessages * tglMetrics.totalRounds;
    const efficiencyImprovement = p2pEfficiency > 0
      ? ((p2pEfficiency - tglEfficiency) / p2pEfficiency) * 100
      : 0;

    return {
      flooding: p2pMetrics,
      tgl: tglMetrics,
      messageReduction,
      roundDifference,
      timeDifference,
      efficiencyImprovement,
    };
  });

  /**
   * Computed signal for message reduction percentage.
   * Returns the maximum message savings percentage seen so far.
   * Only updates when a new maximum is reached.
   */
  readonly messageReduction = computed(() => this.maxMessageSavings());

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
