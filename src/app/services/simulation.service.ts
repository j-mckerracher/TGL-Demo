import { Injectable, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { NetworkState, ProtocolType, SimulationStage } from '../models/network-state.model';
import { Node, NodeState, Position3D } from '../models/node.model';
import { Edge } from '../models/edge.model';
import { Transfer, TransferState } from '../models/transfer.model';
import { sampleWithoutReplacement } from '../utils/array.utils';
import { clamp } from '../utils/math.utils';

/**
 * TGL stage enumeration for three-stage rounds
 */
export enum TglStage {
  PUSH = 'push',
  GOSSIP = 'gossip',
  PULL = 'pull',
}

/**
 * Service that manages the P2P and TGL simulation logic.
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
   * Internal writable signal for the TGL network state.
   */
  private readonly _tglState = signal<NetworkState>(this.createInitialState());

  /**
   * Public readonly accessor for the TGL network state.
   */
  public readonly tglState = this._tglState.asReadonly();

  /**
   * Internal writable signal for the current TGL stage.
   */
  private readonly _tglCurrentStage = signal<TglStage>(TglStage.PUSH);

  /**
   * Public readonly accessor for the current TGL stage.
   */
  public readonly tglCurrentStage = this._tglCurrentStage.asReadonly();

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
   * Initializes a P2P network with a k-regular topology.
   * Each node is placed on a sphere and connected to exactly degreeK neighbors.
   * Node 0 starts with data (ACTIVE state), all others start waiting (IDLE state).
   *
   * @returns A new NetworkState with the initialized P2P network
   */
  public initializeP2pNetwork(): NetworkState {
    const nodeCount = this.settingsService.nodeCount();
    const degreeK = this.settingsService.averageDegree();

    // Create nodes in a 3D spherical layout
    const nodes: Node[] = [];
    const radius = 35; // Radius of the sphere for node placement

    for (let i = 0; i < nodeCount; i++) {
      // Use spherical distribution for 3D visualization
      const position: Position3D = this.getSphericalPosition(i, nodeCount, radius);

      const node: Node = {
        id: `node-${i}`,
        position,
        state: i === 0 ? NodeState.ACTIVE : NodeState.IDLE,
        neighbors: [],
        receivedAtRound: i === 0 ? 0 : undefined,
      };

      nodes.push(node);
    }

    // Mark nodes as malicious based on maliciousPercentage setting
    const maliciousCount = this.settingsService.maliciousCount();
    if (maliciousCount > 0) {
      // Randomly select nodes to be malicious (excluding the source node)
      const nodeIndices = Array.from({ length: nodeCount }, (_, i) => i);
      // Shuffle using Fisher-Yates algorithm
      for (let i = nodeIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nodeIndices[i], nodeIndices[j]] = [nodeIndices[j], nodeIndices[i]];
      }
      // Mark first maliciousCount nodes as malicious (skip source node if selected)
      let markedCount = 0;
      for (let i = 0; i < nodeIndices.length && markedCount < maliciousCount; i++) {
        const nodeIndex = nodeIndices[i];
        // Don't make the source node malicious
        if (nodeIndex !== 0) {
          nodes[nodeIndex].isMalicious = true;
          markedCount++;
        }
      }
    }

    // Build k-regular neighbor connections
    // Each node connects to k neighbors based on their index sequence
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

    // Each active node sends to degreeK neighbors per round.
    // Only ~1/3 of those are useful (targeting idle peers); the rest are redundant exchanges.
    for (const senderNode of activeNodes) {
      // Malicious nodes drop messages - they don't forward to neighbors
      if (senderNode.isMalicious) {
        continue;
      }

      const totalNeighbors = senderNode.neighbors;
      if (totalNeighbors.length === 0) {
        continue;
      }

      // Determine how many useful vs redundant contacts to make this round
      const targetCount = Math.min(degreeK, totalNeighbors.length);
      const usefulCount = Math.max(1, Math.round(targetCount / 3)); // ~33% useful
      const redundantCount = targetCount - usefulCount;

      const idleNeighbors = totalNeighbors.filter((neighborId) => {
        const neighbor = newNodes.find((n) => n.id === neighborId);
        return neighbor && neighbor.state === NodeState.IDLE;
      });

      const updatedNeighbors = totalNeighbors.filter((neighborId) => {
        const neighbor = newNodes.find((n) => n.id === neighborId);
        return neighbor && neighbor.state !== NodeState.IDLE;
      });

      const selectedUseful = sampleWithoutReplacement(
        idleNeighbors,
        Math.min(usefulCount, idleNeighbors.length)
      );

      const remainingUsefulBudget = usefulCount - selectedUseful.length;
      if (remainingUsefulBudget > 0) {
        const fallbackPool = updatedNeighbors.filter((id) => !selectedUseful.includes(id));
        selectedUseful.push(
          ...sampleWithoutReplacement(
            fallbackPool,
            Math.min(remainingUsefulBudget, fallbackPool.length)
          )
        );
      }

      const redundantPool = [
        ...updatedNeighbors.filter((id) => !selectedUseful.includes(id)),
        ...idleNeighbors.filter((id) => !selectedUseful.includes(id)),
      ];

      const selectedRedundant = sampleWithoutReplacement(
        redundantPool,
        Math.min(redundantCount, redundantPool.length)
      );

      const selectedNeighbors = [...selectedUseful, ...selectedRedundant];

      // Update target node states and create transfers
      for (const neighborId of selectedNeighbors) {
        const targetNode = newNodes.find((n) => n.id === neighborId);
        if (targetNode) {
          // Update target node state if it was still idle
          if (targetNode.state === NodeState.IDLE) {
            targetNode.state = NodeState.ACTIVE;
            targetNode.receivedAtRound = newRound;
          }

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

    // Check if simulation is complete
    // Complete if: (1) 100% coverage OR (2) no messages sent this round (network has stagnated)
    // Stagnation occurs when malicious nodes block all remaining propagation paths
    const isComplete = coverage >= 100 || (messagesSent === 0 && newRound > 0);

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
    this._tglState.set(this.createInitialState());
    this._tglCurrentStage.set(TglStage.PUSH);
    this.transferIdCounter = 0;
  }

  /**
   * Convenience helper that reinitializes both P2P and TGL networks
   * using the current settings snapshot.
   */
  public initializeNetworksFromSettings(): void {
    this.initializeP2pNetwork();
    this.initializeTglNetwork();
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

  /**
   * Gets a spherical position for a node at the given index.
   * Helper method for distributing nodes evenly on a sphere.
   *
   * @param index - The node index
   * @param total - Total number of nodes to distribute
   * @param radius - Radius of the sphere
   * @returns Position3D coordinates on the sphere surface
   */
  private getSphericalPosition(index: number, total: number, radius: number): Position3D {
    // Use golden spiral method for even distribution on sphere
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;

    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi),
    };
  }

  /**
   * Initializes a TGL network with a two-tier topology.
   * Relays are placed near the center, leaves are distributed on a sphere.
   * Relays connect to each other and to their assigned leaves.
   * One relay starts with data (ACTIVE state), all others start IDLE.
   *
   * @returns A new NetworkState with the initialized TGL network
   */
  public initializeTglNetwork(): NetworkState {
    const relayCount = Math.max(1, this.settingsService.relayCount());
    const leafCount = Math.max(1, this.settingsService.leafCount());
    const totalNodes = relayCount + leafCount;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const relayRadius = 15; // Small radius for relay cluster
    const leafRadius = 35; // Larger radius for leaf sphere

    // Create relay nodes near the center (all start idle)
    for (let i = 0; i < relayCount; i++) {
      const position: Position3D = this.getCircularPosition(i, relayCount, relayRadius);

      const node: Node = {
        id: `relay-${i}`,
        position,
        state: NodeState.IDLE,
        neighbors: [],
        isRelay: true,
        receivedAtRound: undefined,
      };

      nodes.push(node);
    }

    // Create leaf nodes on a sphere
    for (let i = 0; i < leafCount; i++) {
      const position: Position3D = this.getSphericalPosition(i, leafCount, leafRadius);

      const node: Node = {
        id: `leaf-${i}`,
        position,
        state: NodeState.IDLE,
        neighbors: [],
        isRelay: false,
        receivedAtRound: undefined,
      };

      nodes.push(node);
    }

    // Mark nodes as malicious based on maliciousPercentage setting
    const maliciousCount = this.settingsService.maliciousCount();
    if (maliciousCount > 0) {
      // Randomly select nodes to be malicious (both relays and leaves)
      const nodeIndices = Array.from({ length: totalNodes }, (_, i) => i);
      // Shuffle using Fisher-Yates algorithm
      for (let i = nodeIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nodeIndices[i], nodeIndices[j]] = [nodeIndices[j], nodeIndices[i]];
      }
      // Mark first maliciousCount nodes as malicious (skip source leaf node)
      let markedCount = 0;
      for (let i = 0; i < nodeIndices.length && markedCount < maliciousCount; i++) {
        const nodeIndex = nodeIndices[i];
        // Don't make the source leaf malicious (which is at relayCount index)
        if (nodeIndex !== relayCount) {
          nodes[nodeIndex].isMalicious = true;
          markedCount++;
        }
      }
    }

    // Connect relays to each other (fully connected relay mesh)
    for (let i = 0; i < relayCount; i++) {
      for (let j = i + 1; j < relayCount; j++) {
        const relay1 = nodes[i];
        const relay2 = nodes[j];

        relay1.neighbors.push(relay2.id);
        relay2.neighbors.push(relay1.id);

        edges.push({
          sourceId: relay1.id,
          targetId: relay2.id,
          active: false,
        });
      }
    }

    // Connect leaves to multiple relays for richer tiered interactions
    const connectionsPerLeaf = Math.max(1, Math.min(relayCount, this.settingsService.pushBudget()));

    for (let i = 0; i < leafCount; i++) {
      const leaf = nodes[relayCount + i];

      for (let connection = 0; connection < connectionsPerLeaf; connection++) {
        const relayIndex = (i + connection) % relayCount;
        const relay = nodes[relayIndex];

        if (!leaf.neighbors.includes(relay.id)) {
          leaf.neighbors.push(relay.id);
        }

        if (!relay.neighbors.includes(leaf.id)) {
          relay.neighbors.push(leaf.id);
        }

        edges.push({
          sourceId: leaf.id,
          targetId: relay.id,
          active: false,
        });
      }
    }

    // Activate the first leaf as the source node
    const sourceLeaf = nodes[relayCount];
    sourceLeaf.state = NodeState.ACTIVE;
    sourceLeaf.receivedAtRound = 0;

    const coverage = (1 / totalNodes) * 100;

    const networkState: NetworkState = {
      nodes,
      edges,
      transfers: [],
      round: 0,
      coverage,
      protocol: ProtocolType.TGL,
      stage: SimulationStage.INITIALIZING,
      sourceNodeId: sourceLeaf.id,
      totalMessagesSent: 0,
      startTime: Date.now(),
      endTime: undefined,
      isComplete: false,
    };

    this._tglState.set(networkState);
    this._tglCurrentStage.set(TglStage.PUSH);
    this.transferIdCounter = 0;
    return networkState;
  }

  /**
   * Executes one stage of the TGL round (Push, Gossip, or Pull).
   * Push: leaves send to relays
   * Gossip: relays exchange with other relays
   * Pull: relays send to leaves
   * Automatically advances to the next stage or next round.
   *
   * @returns A new NetworkState after executing one stage
   */
  public stepTglRound(): NetworkState {
    const currentState = this._tglState();

    // If simulation is already complete, return current state
    if (currentState.isComplete) {
      return currentState;
    }

    const currentStage = this._tglCurrentStage();
    const pushBudget = this.settingsService.pushBudget();
    const gossipBudget = this.settingsService.gossipBudget();
    const pullBudget = this.settingsService.pullBudget();
    let newNodes = currentState.nodes.map((node) => ({ ...node }));
    const newTransfers: Transfer[] = [];
    let messagesSent = 0;
    let newRound = currentState.round;
    let newStage = currentStage;

    // Execute stage-specific logic
    switch (currentStage) {
      case TglStage.PUSH: {
        // Leaves with data push to a limited number of connected relays
        const activeLeaves = newNodes.filter((node) => !node.isRelay && node.state === NodeState.ACTIVE);

        for (const leaf of activeLeaves) {
          // Malicious leaves don't push messages to relays
          if (leaf.isMalicious) {
            continue;
          }

          const relayNeighbors = leaf.neighbors
            .map((neighborId) => newNodes.find((n) => n.id === neighborId))
            .filter((neighbor): neighbor is Node => Boolean(neighbor && neighbor.isRelay));

          const eligibleRelays = relayNeighbors.filter((relay) => relay.state === NodeState.IDLE);
          const targetCount = Math.min(pushBudget, eligibleRelays.length);
          const selectedRelays = sampleWithoutReplacement(
            eligibleRelays.map((relay) => relay.id),
            targetCount
          );

          for (const relayId of selectedRelays) {
            const relay = newNodes.find((n) => n.id === relayId);
            if (!relay) {
              continue;
            }

            relay.state = NodeState.ACTIVE;
            relay.receivedAtRound = newRound;

            const transfer: Transfer = {
              id: `transfer-${this.transferIdCounter++}`,
              sourceId: leaf.id,
              targetId: relay.id,
              edgeId: `${leaf.id}-${relay.id}`,
              progress: 0,
              state: TransferState.IN_PROGRESS,
              startTime: Date.now(),
              round: newRound,
            };

            newTransfers.push(transfer);
            messagesSent++;
          }
        }

        newStage = TglStage.GOSSIP;
        break;
      }

      case TglStage.GOSSIP:
        // Relays with data exchange with other relays
        const activeRelays = newNodes.filter(
          (node) => node.isRelay && node.state === NodeState.ACTIVE
        );

        for (const relay of activeRelays) {
          // Malicious relays don't participate in gossip
          if (relay.isMalicious) {
            continue;
          }

          // Get other relays that are neighbors and don't have data yet
          const eligibleRelayNeighbors = relay.neighbors.filter((neighborId) => {
            const neighbor = newNodes.find((n) => n.id === neighborId);
            return neighbor && neighbor.isRelay && neighbor.state === NodeState.IDLE;
          });

          // Sample up to gossipBudget neighbors
          const targetCount = Math.min(gossipBudget, eligibleRelayNeighbors.length);
          const selectedRelays = sampleWithoutReplacement(eligibleRelayNeighbors, targetCount);

          for (const relayId of selectedRelays) {
            const targetRelay = newNodes.find((n) => n.id === relayId);
            if (targetRelay) {
              // Update target relay state
              targetRelay.state = NodeState.ACTIVE;
              targetRelay.receivedAtRound = newRound;

              // Create transfer
              const transfer: Transfer = {
                id: `transfer-${this.transferIdCounter++}`,
                sourceId: relay.id,
                targetId: targetRelay.id,
                edgeId: `${relay.id}-${targetRelay.id}`,
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

        // Advance to Pull stage
        newStage = TglStage.PULL;
        break;

      case TglStage.PULL: {
        // Relays with data pull limited leaves in the next round
        const activeRelaysForPull = newNodes.filter(
          (node) => node.isRelay && node.state === NodeState.ACTIVE
        );

        for (const relay of activeRelaysForPull) {
          // Malicious relays don't pull leaves
          if (relay.isMalicious) {
            continue;
          }

          const eligibleLeafNeighbors = relay.neighbors.filter((neighborId) => {
            const neighbor = newNodes.find((n) => n.id === neighborId);
            return neighbor && !neighbor.isRelay && neighbor.state === NodeState.IDLE;
          });

          const targetCount = Math.min(pullBudget, eligibleLeafNeighbors.length);
          const selectedLeaves = sampleWithoutReplacement(eligibleLeafNeighbors, targetCount);

          for (const leafId of selectedLeaves) {
            const leaf = newNodes.find((n) => n.id === leafId);
            if (!leaf) {
              continue;
            }

            leaf.state = NodeState.ACTIVE;
            leaf.receivedAtRound = newRound + 1;

            const transfer: Transfer = {
              id: `transfer-${this.transferIdCounter++}`,
              sourceId: relay.id,
              targetId: leaf.id,
              edgeId: `${relay.id}-${leaf.id}`,
              progress: 0,
              state: TransferState.IN_PROGRESS,
              startTime: Date.now(),
              round: newRound + 1,
            };

            newTransfers.push(transfer);
            messagesSent++;
          }
        }

        newRound = currentState.round + 1;
        newStage = TglStage.PUSH;
        break;
      }
    }

    // Calculate new coverage
    const nodesWithData = newNodes.filter((n) => n.state === NodeState.ACTIVE).length;
    const coverage = (nodesWithData / newNodes.length) * 100;

    // Check if simulation is complete
    // Complete if: (1) 100% coverage OR (2) starting new round with no messages sent
    // A new round with 0 messages indicates network stagnation due to malicious nodes
    const startingNewRound = newRound > currentState.round;
    const isComplete = coverage >= 100 || (startingNewRound && messagesSent === 0 && newRound > 1);

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

    this._tglState.set(newState);
    this._tglCurrentStage.set(newStage);
    return newState;
  }

  /**
   * Updates the progress of all active TGL transfers based on elapsed time.
   * Advances transfer progress from 0 to 1 and removes completed transfers.
   * This method should be called each animation frame with the time delta.
   *
   * @param deltaTime - Time elapsed since last update (in milliseconds)
   * @returns A new NetworkState with updated transfer states
   */
  public updateTglTransfers(deltaTime: number): NetworkState {
    const currentState = this._tglState();

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
          // Transfer is complete, remove it (or mark as completed if you want to keep them)
          // For now, we'll remove completed transfers
        } else {
          // Transfer still in progress
          updatedTransfers.push({
            ...transfer,
            progress: newProgress,
          });
        }
      } else {
        // Keep transfers in other states
        updatedTransfers.push(transfer);
      }
    }

    // Create new network state with updated transfers
    const newState: NetworkState = {
      ...currentState,
      transfers: updatedTransfers,
    };

    this._tglState.set(newState);
    return newState;
  }
}
