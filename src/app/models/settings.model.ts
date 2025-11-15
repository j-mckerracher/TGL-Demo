import { ProtocolType } from './network-state.model';

/**
 * Network topology type
 */
export enum TopologyType {
  RANDOM = 'random',
  SCALE_FREE = 'scale-free',
  SMALL_WORLD = 'small-world',
  GRID = 'grid',
}

/**
 * Simulation settings and parameters
 */
export interface Settings {
  // Network topology settings
  /** Total number of nodes in the network */
  nodeCount: number;

  /** Average degree (connections per node) */
  averageDegree: number;

  /** Network topology type */
  topologyType: TopologyType;

  // Node distribution settings
  /** Percentage of relay nodes (0-100) */
  relayPercentage: number;

  /** Percentage of leaf nodes (0-100) */
  leafPercentage: number;

  // TGL protocol settings
  /** Message budget for relay nodes */
  relayBudget: number;

  /** Message budget for leaf nodes */
  leafBudget: number;

  // Simulation settings
  /** Protocol to simulate */
  protocol: ProtocolType;

  /** Animation speed multiplier (1 = normal, 2 = 2x speed, etc.) */
  animationSpeed: number;

  /** Delay between rounds in milliseconds */
  roundDelay: number;

  /** Maximum number of rounds before timeout */
  maxRounds: number;

  // Visualization settings
  /** Show node labels */
  showLabels: boolean;

  /** Show transfer animations */
  showTransfers: boolean;

  /** Camera auto-rotate */
  autoRotate: boolean;

  /** Enable 3D visualization (vs 2D) */
  enable3D: boolean;
}

/**
 * Default simulation settings
 */
export const DEFAULT_SETTINGS: Settings = {
  // Network topology
  nodeCount: 50,
  averageDegree: 4,
  topologyType: TopologyType.RANDOM,

  // Node distribution (should sum to 100)
  relayPercentage: 20,
  leafPercentage: 80,

  // TGL budgets
  relayBudget: 3,
  leafBudget: 1,

  // Simulation
  protocol: ProtocolType.FLOODING,
  animationSpeed: 1,
  roundDelay: 500,
  maxRounds: 100,

  // Visualization
  showLabels: false,
  showTransfers: true,
  autoRotate: false,
  enable3D: true,
};

/**
 * Preset configurations for common scenarios
 */
export const PRESET_SETTINGS = {
  SMALL_NETWORK: {
    ...DEFAULT_SETTINGS,
    nodeCount: 20,
    averageDegree: 3,
    animationSpeed: 0.5,
  } as Settings,

  LARGE_NETWORK: {
    ...DEFAULT_SETTINGS,
    nodeCount: 200,
    averageDegree: 6,
    animationSpeed: 2,
    showLabels: false,
  } as Settings,

  FAST_SIMULATION: {
    ...DEFAULT_SETTINGS,
    animationSpeed: 4,
    roundDelay: 100,
    showTransfers: false,
  } as Settings,

  TGL_OPTIMIZED: {
    ...DEFAULT_SETTINGS,
    protocol: ProtocolType.TGL,
    relayPercentage: 25,
    leafPercentage: 75,
    relayBudget: 4,
    leafBudget: 1,
  } as Settings,
};
