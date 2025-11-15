/**
 * Transfer state enumeration
 */
export enum TransferState {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Message transfer between nodes in the network
 */
export interface Transfer {
  /** Unique identifier for the transfer */
  id: string;

  /** Source node ID */
  sourceId: string;

  /** Target node ID */
  targetId: string;

  /** Associated edge ID (constructed as sourceId-targetId or similar) */
  edgeId: string;

  /** Transfer progress (0-1, where 1 is complete) */
  progress: number;

  /** Current state of the transfer */
  state: TransferState;

  /** Timestamp when transfer started (milliseconds or round number) */
  startTime: number;

  /** Timestamp when transfer completed (if applicable) */
  endTime?: number;

  /** Round number when transfer initiated */
  round: number;

  /** Optional: Message payload or identifier */
  messageId?: string;
}
