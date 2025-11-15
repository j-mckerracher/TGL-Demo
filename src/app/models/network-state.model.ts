import { Node } from './node.model';
import { Edge } from './edge.model';
import { Transfer } from './transfer.model';

/**
 * Protocol type enumeration
 */
export enum ProtocolType {
  FLOODING = 'flooding',
  TGL = 'tgl',
}

/**
 * Simulation stage enumeration
 */
export enum SimulationStage {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * Complete network state snapshot for P2P/TGL simulation
 */
export interface NetworkState {
  /** Array of all nodes in the network */
  nodes: Node[];

  /** Array of all edges (connections) in the network */
  edges: Edge[];

  /** Array of active message transfers */
  transfers: Transfer[];

  /** Current simulation round number */
  round: number;

  /** Network coverage percentage (0-100) */
  coverage: number;

  /** Current protocol being simulated */
  protocol: ProtocolType;

  /** Current simulation stage */
  stage: SimulationStage;

  /** ID of the source node (initiator) */
  sourceNodeId?: string;

  /** Total number of messages sent */
  totalMessagesSent: number;

  /** Timestamp when simulation started */
  startTime?: number;

  /** Timestamp when simulation ended */
  endTime?: number;

  /** Whether the simulation is complete */
  isComplete: boolean;
}
