import { ProtocolType } from './network-state.model';

/**
 * Metrics for a single simulation run
 */
export interface NetworkMetrics {
  /** Protocol used in this simulation */
  protocol: ProtocolType;

  /** Total number of rounds to complete */
  totalRounds: number;

  /** Total number of messages sent */
  totalMessages: number;

  /** Total time to completion (milliseconds) */
  completionTime: number;

  /** Final network coverage percentage (0-100) */
  finalCoverage: number;

  /** Number of nodes in the network */
  nodeCount: number;

  /** Average node degree */
  averageDegree: number;

  /** Peak messages in a single round */
  peakMessagesPerRound: number;

  /** Timestamp when simulation started */
  startTimestamp: number;

  /** Timestamp when simulation ended */
  endTimestamp: number;

  /** Whether simulation completed successfully */
  successful: boolean;
}

/**
 * Comparison metrics between two protocols
 */
export interface ComparisonMetrics {
  /** Metrics for flooding protocol */
  flooding: NetworkMetrics;

  /** Metrics for TGL protocol */
  tgl: NetworkMetrics;

  /** Message reduction percentage (positive = TGL used fewer messages) */
  messageReduction: number;

  /** Round difference (positive = TGL used fewer rounds) */
  roundDifference: number;

  /** Time difference in milliseconds (positive = TGL was faster) */
  timeDifference: number;

  /** Percentage improvement in efficiency (messages * rounds) */
  efficiencyImprovement: number;
}

/**
 * Historical metrics for tracking simulation runs over time
 */
export interface HistoricalMetrics {
  /** Array of all simulation runs */
  runs: NetworkMetrics[];

  /** Total number of simulations run */
  totalSimulations: number;

  /** Average message count across all runs */
  averageMessages: number;

  /** Average rounds across all runs */
  averageRounds: number;

  /** Best (lowest) message count achieved */
  bestMessageCount: number;

  /** Worst (highest) message count */
  worstMessageCount: number;
}
