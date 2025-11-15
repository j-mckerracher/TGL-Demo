/**
 * Edge representation connecting two nodes in the network
 */
export interface Edge {
  /** Source node ID */
  sourceId: string;

  /** Target node ID */
  targetId: string;

  /** Whether this edge is currently active (used for message transfer) */
  active: boolean;

  /** Optional: Edge weight or capacity */
  weight?: number;

  /** Optional: Timestamp when edge was last used */
  lastUsed?: number;
}
