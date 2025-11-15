import { Injectable, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { NetworkState, ProtocolType, SimulationStage } from '../models/network-state.model';
import { Node, NodeState, Position3D } from '../models/node.model';
import { Edge } from '../models/edge.model';
import { Transfer, TransferState } from '../models/transfer.model';
import { sampleWithoutReplacement } from '../utils/array.utils';
import { clamp } from '../utils/math.utils';

/**
 * Service that manages the P2P gossip simulation logic.
 * Provides headless simulation state management with round-by-round propagation,
 * transfer tracking, and coverage metrics.
 */
@Injectable({
  providedIn: 'root',
})
export class SimulationService {
  private readonly settingsService = inject(SettingsService);

  /**
   * Internal writable signal for the P2P network state.
   */
  private readonly _p2pState = signal<NetworkState>(this.createInitialState());

  /**
   * Public readonly accessor for the P2P network state.
   */
  public readonly p2pState = this._p2pState.asReadonly();

  /**
   * Transfer ID counter for generating unique transfer IDs.
   */
  private transferIdCounter = 0;

  /**
   * Duration for a transfer to complete (in milliseconds).
   * This determines how fast particles move along edges.
   */
  private readonly transferDuration = 1000; // 1 second per transfer

  /**
   * Creates the initial empty network state.
   */
  private createInitialState(): NetworkState {
    return {
      nodes: [],
      edges: [],
      transfers: [],
      round: 0,
      coverage: 0,
      protocol: ProtocolType.FLOODING,
      stage: SimulationStage.IDLE,
      sourceNodeId: undefined,
      totalMessagesSent: 0,
      startTime: undefined,
      endTime: undefined,
      isComplete: false,
    };
  }

  /**
   * Initializes a P2P network with a circular k-regular topology.
   * Each node is placed on a circle and connected to exactly degreeK neighbors.
   * Node 0 starts with data (ACTIVE state), all others start waiting (IDLE state).
   *
   * @returns A new NetworkState with the initialized P2P network
   */
  public initializeP2pNetwork(): NetworkState {
    const nodeCount = this.settingsService.nodeCount();
    const degreeK = this.settingsService.averageDegree();

    // Create nodes in a circular layout
    const nodes: Node[] = [];
    const radius = 100; // Radius of the circle for node placement

    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount;
      const position: Position3D = {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: 0, // 2D layout
      };

      const node: Node = {
        id: `node-${i}`,
        position,
        state: i === 0 ? NodeState.ACTIVE : NodeState.IDLE,
        neighbors: [],
        receivedAtRound: i === 0 ? 0 : undefined,
      };

      nodes.push(node);
    }

    // Build k-regular neighbor connections
    // Each node connects to k/2 neighbors on each side in the circular arrangement
    const edges: Edge[] = [];
    const neighborsPerSide = Math.floor(degreeK / 2);
    const extraNeighbor = degreeK % 2; // If degreeK is odd, add one more neighbor

    for (let i = 0; i < nodeCount; i++) {
      const neighborIds: string[] = [];

      // Connect to neighbors on the right
      for (let j = 1; j <= neighborsPerSide; j++) {
        const neighborIndex = (i + j) % nodeCount;
        neighborIds.push(`node-${neighborIndex}`);
      }

      // Connect to neighbors on the left
      for (let j = 1; j <= neighborsPerSide; j++) {
        const neighborIndex = (i - j + nodeCount) % nodeCount;
        neighborIds.push(`node-${neighborIndex}`);
      }

      // If degreeK is odd, add one more neighbor on the right
      if (extraNeighbor > 0) {
        const neighborIndex = (i + neighborsPerSide + 1) % nodeCount;
        neighborIds.push(`node-${neighborIndex}`);
      }

      nodes[i].neighbors = neighborIds;

      // Create edges (avoid duplicates by only creating edges where i < j)
      for (const neighborId of neighborIds) {
        const neighborIndex = parseInt(neighborId.split('-')[1], 10);
        if (i < neighborIndex) {
          edges.push({
            sourceId: `node-${i}`,
            targetId: neighborId,
            active: false,
          });
        }
      }
    }

    // Calculate initial coverage (only node 0 has data)
    const coverage = (1 / nodeCount) * 100;

    const networkState: NetworkState = {
      nodes,
      edges,
      transfers: [],
      round: 0,
      coverage,
      protocol: ProtocolType.FLOODING,
      stage: SimulationStage.INITIALIZING,
      sourceNodeId: 'node-0',
      totalMessagesSent: 0,
      startTime: Date.now(),
      endTime: undefined,
      isComplete: false,
    };

    this._p2pState.set(networkState);
    this.transferIdCounter = 0;
    return networkState;
  }

  /**
   * Executes one round of P2P gossip propagation.
   * Each node with data sends to degreeK randomly chosen neighbors.
   * Updates node states, increments round counter, and recalculates coverage.
   *
   * @returns A new NetworkState after executing one round
   */
  public stepP2pRound(): NetworkState {
    const currentState = this._p2pState();

    // If simulation is already complete, return current state
    if (currentState.isComplete) {
      return currentState;
    }

    const degreeK = this.settingsService.averageDegree();
    const newRound = currentState.round + 1;

    // Clone nodes array for immutability
    const newNodes = currentState.nodes.map((node) => ({ ...node }));

    // Find all nodes that currently have data (ACTIVE state)
    const activeNodes = newNodes.filter((node) => node.state === NodeState.ACTIVE);

    // Track new transfers for this round
    const newTransfers: Transfer[] = [];
    let messagesSent = 0;

    // Each active node sends to degreeK random neighbors
    for (const senderNode of activeNodes) {
      // Get neighbors that haven't received data yet (IDLE state)
      const eligibleNeighbors = senderNode.neighbors.filter((neighborId) => {
        const neighbor = newNodes.find((n) => n.id === neighborId);
        return neighbor && neighbor.state === NodeState.IDLE;
      });

      // Sample up to degreeK neighbors (may be fewer if not enough eligible neighbors)
      const targetCount = Math.min(degreeK, eligibleNeighbors.length);
      const selectedNeighbors = sampleWithoutReplacement(eligibleNeighbors, targetCount);

      // Update target node states and create transfers
      for (const neighborId of selectedNeighbors) {
        const targetNode = newNodes.find((n) => n.id === neighborId);
        if (targetNode) {
          // Update target node state
          targetNode.state = NodeState.ACTIVE;
          targetNode.receivedAtRound = newRound;

          // Create a transfer for visualization
          const transfer: Transfer = {
            id: `transfer-${this.transferIdCounter++}`,
            sourceId: senderNode.id,
            targetId: targetNode.id,
            edgeId: `${senderNode.id}-${targetNode.id}`,
            progress: 0,
            state: TransferState.IN_PROGRESS,
            startTime: Date.now(),
            round: newRound,
          };

          newTransfers.push(transfer);
          messagesSent++;
        }
      }
    }

    // Calculate new coverage (percentage of nodes with data)
    const nodesWithData = newNodes.filter((n) => n.state === NodeState.ACTIVE).length;
    const coverage = (nodesWithData / newNodes.length) * 100;

    // Check if simulation is complete (100% coverage)
    const isComplete = coverage >= 100;

    // Create new network state
    const newState: NetworkState = {
      ...currentState,
      nodes: newNodes,
      transfers: [...currentState.transfers, ...newTransfers],
      round: newRound,
      coverage,
      totalMessagesSent: currentState.totalMessagesSent + messagesSent,
      stage: isComplete ? SimulationStage.COMPLETED : SimulationStage.RUNNING,
      endTime: isComplete ? Date.now() : undefined,
      isComplete,
    };

    this._p2pState.set(newState);
    return newState;
  }

  /**
   * Updates the progress of all active transfers based on elapsed time.
   * Advances transfer progress from 0 to 1 and removes completed transfers.
   * This method should be called each animation frame with the time delta.
   *
   * @param deltaTime - Time elapsed since last update (in milliseconds)
   * @returns A new NetworkState with updated transfer states
   */
  public updateP2pTransfers(deltaTime: number): NetworkState {
    const currentState = this._p2pState();

    // Calculate progress increment based on deltaTime and transfer duration
    const progressIncrement = deltaTime / this.transferDuration;

    // Update all transfers
    const updatedTransfers: Transfer[] = [];

    for (const transfer of currentState.transfers) {
      if (transfer.state === TransferState.IN_PROGRESS) {
        // Advance progress
        const newProgress = clamp(transfer.progress + progressIncrement, 0, 1);

        // Check if transfer is complete
        if (newProgress >= 1) {
          // Transfer is complete, mark as completed
          const completedTransfer: Transfer = {
            ...transfer,
            progress: 1,
            state: TransferState.COMPLETED,
            endTime: Date.now(),
          };

          // Optionally, we can keep completed transfers for a short time
          // or remove them immediately. For now, we'll remove them.
          // If you want to keep them briefly, add them to updatedTransfers.
        } else {
          // Transfer still in progress
          updatedTransfers.push({
            ...transfer,
            progress: newProgress,
          });
        }
      } else {
        // Keep transfers in other states (PENDING, COMPLETED, FAILED)
        updatedTransfers.push(transfer);
      }
    }

    // Create new network state with updated transfers
    const newState: NetworkState = {
      ...currentState,
      transfers: updatedTransfers,
    };

    this._p2pState.set(newState);
    return newState;
  }

  /**
   * Resets the simulation to the initial state.
   */
  public reset(): void {
    this._p2pState.set(this.createInitialState());
    this.transferIdCounter = 0;
  }

  /**
   * Gets the circular position for a node at the given index.
   * Helper method for node placement in circular layout.
   *
   * @param index - The node index
   * @param total - Total number of nodes
   * @param radius - Radius of the circle
   * @returns Position3D coordinates
   */
  private getCircularPosition(index: number, total: number, radius: number): Position3D {
    const angle = (2 * Math.PI * index) / total;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: 0,
    };
  }
}
