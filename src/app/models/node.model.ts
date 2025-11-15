/**
 * Node state enumeration for P2P/TGL simulation
 */
export enum NodeState {
  IDLE = 'idle',
  ACTIVE = 'active',
  SENDING = 'sending',
  RECEIVING = 'receiving',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 3D position coordinates for node visualization
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Node representation in the P2P/TGL network
 */
export interface Node {
  /** Unique identifier for the node */
  id: string;

  /** 3D position for visualization */
  position: Position3D;

  /** Current state of the node */
  state: NodeState;

  /** Array of neighbor node IDs (connected nodes) */
  neighbors: string[];

  /** Whether this node is a relay node (vs leaf node) */
  isRelay?: boolean;

  /** Message budget remaining (for TGL protocol) */
  budget?: number;

  /** Round when node received the message */
  receivedAtRound?: number;
}
