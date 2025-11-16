import { Injectable, signal, computed } from '@angular/core';
import { DEFAULT_SETTINGS, TopologyType } from '../models/settings.model';
import { ProtocolType } from '../models/network-state.model';
import { clamp } from '../utils/math.utils';

/**
 * Service that centralizes all simulation configuration parameters using Angular Signals.
 * Provides reactive state management with validated setters and computed derived values.
 * All settings are clamped to valid ranges to ensure the service never enters an invalid state.
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  // ===== Network topology settings =====

  /**
   * Internal writable signal for node count.
   * Valid range: [10, 100]
   */
  private readonly _nodeCount = signal(DEFAULT_SETTINGS.nodeCount);

  /**
   * Internal writable signal for average degree (connections per node).
   * Valid range: [2, nodeCount - 1]
   */
  private readonly _averageDegree = signal(DEFAULT_SETTINGS.averageDegree);

  /**
   * Internal writable signal for network topology type.
   */
  private readonly _topologyType = signal(DEFAULT_SETTINGS.topologyType);

  // ===== Node distribution settings =====

  /**
   * Internal writable signal for relay percentage.
   * Valid range: [0, 100]
   */
  private readonly _relayPercentage = signal(DEFAULT_SETTINGS.relayPercentage);

  /**
   * Internal writable signal for leaf percentage.
   * Valid range: [0, 100]
   * Note: This is automatically derived as 100 - relayPercentage
   */
  private readonly _leafPercentage = signal(DEFAULT_SETTINGS.leafPercentage);

  // ===== TGL protocol settings =====

  /**
   * Internal writable signal for leaf → relay push attempts per stage.
   * Valid range: [1, 10]
   */
  private readonly _pushBudget = signal(DEFAULT_SETTINGS.pushBudget);

  /**
   * Internal writable signal for relay ↔ relay gossip exchanges per stage.
   * Valid range: [1, 10]
   */
  private readonly _gossipBudget = signal(DEFAULT_SETTINGS.gossipBudget);

  /**
   * Internal writable signal for relay → leaf pull attempts per stage.
   * Valid range: [1, 10]
   */
  private readonly _pullBudget = signal(DEFAULT_SETTINGS.pullBudget);

  // ===== Simulation settings =====

  /**
   * Internal writable signal for protocol type.
   */
  private readonly _protocol = signal(DEFAULT_SETTINGS.protocol);

  /**
   * Internal writable signal for animation speed multiplier.
   * Valid range: [0.1, 10]
   */
  private readonly _animationSpeed = signal(DEFAULT_SETTINGS.animationSpeed);

  /**
   * Internal writable signal for delay between rounds in milliseconds.
   * Valid range: [50, 5000]
   */
  private readonly _roundDelay = signal(DEFAULT_SETTINGS.roundDelay);

  /**
   * Internal writable signal for maximum number of rounds before timeout.
   * Valid range: [10, 1000]
   */
  private readonly _maxRounds = signal(DEFAULT_SETTINGS.maxRounds);

  // ===== Visualization settings =====

  /**
   * Internal writable signal for showing node labels.
   */
  private readonly _showLabels = signal(DEFAULT_SETTINGS.showLabels);

  /**
   * Internal writable signal for showing transfer animations.
   */
  private readonly _showTransfers = signal(DEFAULT_SETTINGS.showTransfers);

  /**
   * Internal writable signal for camera auto-rotate.
   */
  private readonly _autoRotate = signal(DEFAULT_SETTINGS.autoRotate);

  /**
   * Internal writable signal for 3D visualization mode.
   */
  private readonly _enable3D = signal(DEFAULT_SETTINGS.enable3D);

  // ===== Public readonly signals =====

  /**
   * Total number of nodes in the network.
   * Valid range: [10, 100]
   */
  public readonly nodeCount = this._nodeCount.asReadonly();

  /**
   * Average degree (connections per node).
   * Valid range: [2, nodeCount - 1]
   */
  public readonly averageDegree = this._averageDegree.asReadonly();

  /**
   * Network topology type.
   */
  public readonly topologyType = this._topologyType.asReadonly();

  /**
   * Percentage of relay nodes.
   * Valid range: [0, 100]
   */
  public readonly relayPercentage = this._relayPercentage.asReadonly();

  /**
   * Percentage of leaf nodes.
   * Valid range: [0, 100]
   * Automatically computed as 100 - relayPercentage
   */
  public readonly leafPercentage = this._leafPercentage.asReadonly();

  /**
   * Push budget (leaf → relay attempts per stage).
   * Valid range: [1, 10]
   */
  public readonly pushBudget = this._pushBudget.asReadonly();

  /**
   * Gossip budget (relay ↔ relay exchanges per stage).
   * Valid range: [1, 10]
   */
  public readonly gossipBudget = this._gossipBudget.asReadonly();

  /**
   * Pull budget (relay → leaf attempts per stage).
   * Valid range: [1, 10]
   */
  public readonly pullBudget = this._pullBudget.asReadonly();

  /**
   * Protocol to simulate.
   */
  public readonly protocol = this._protocol.asReadonly();

  /**
   * Animation speed multiplier (1 = normal, 2 = 2x speed, etc.).
   * Valid range: [0.1, 10]
   */
  public readonly animationSpeed = this._animationSpeed.asReadonly();

  /**
   * Delay between rounds in milliseconds.
   * Valid range: [50, 5000]
   */
  public readonly roundDelay = this._roundDelay.asReadonly();

  /**
   * Maximum number of rounds before timeout.
   * Valid range: [10, 1000]
   */
  public readonly maxRounds = this._maxRounds.asReadonly();

  /**
   * Whether to show node labels.
   */
  public readonly showLabels = this._showLabels.asReadonly();

  /**
   * Whether to show transfer animations.
   */
  public readonly showTransfers = this._showTransfers.asReadonly();

  /**
   * Whether camera auto-rotates.
   */
  public readonly autoRotate = this._autoRotate.asReadonly();

  /**
   * Whether 3D visualization is enabled (vs 2D).
   */
  public readonly enable3D = this._enable3D.asReadonly();

  // ===== Computed signals =====

  /**
   * Number of relay nodes, computed as floor(nodeCount * relayPercentage / 100).
   * Updates reactively when nodeCount or relayPercentage changes.
   */
  public readonly relayCount = computed(() => {
    return Math.floor(this._nodeCount() * this._relayPercentage() / 100);
  });

  /**
   * Number of leaf nodes, computed as nodeCount - relayCount.
   * Updates reactively when nodeCount or relayPercentage changes.
   */
  public readonly leafCount = computed(() => {
    return this._nodeCount() - this.relayCount();
  });

  // ===== Setter methods with validation =====

  /**
   * Sets the total number of nodes in the network.
   * Value is clamped to [10, 100].
   * Also re-clamps averageDegree to ensure it remains valid (≤ nodeCount - 1).
   *
   * @param value - The desired node count
   */
  public setNodeCount(value: number): void {
    const clamped = clamp(value, 10, 100);
    this._nodeCount.set(clamped);
    // Re-clamp averageDegree to ensure it doesn't exceed nodeCount - 1
    const maxDegree = clamped - 1;
    if (this._averageDegree() > maxDegree) {
      this._averageDegree.set(clamp(this._averageDegree(), 2, maxDegree));
    }
  }

  /**
   * Sets the average degree (connections per node).
   * Value is clamped to [2, nodeCount - 1].
   *
   * @param value - The desired average degree
   */
  public setAverageDegree(value: number): void {
    const maxDegree = this._nodeCount() - 1;
    this._averageDegree.set(clamp(value, 2, maxDegree));
  }

  /**
   * Sets the network topology type.
   *
   * @param value - The desired topology type
   */
  public setTopologyType(value: TopologyType): void {
    this._topologyType.set(value);
  }

  /**
   * Sets the percentage of relay nodes.
   * Value is clamped to [0, 100].
   * Automatically updates leafPercentage to 100 - relayPercentage.
   *
   * @param value - The desired relay percentage
   */
  public setRelayPercentage(value: number): void {
    const clamped = clamp(value, 0, 100);
    this._relayPercentage.set(clamped);
    this._leafPercentage.set(100 - clamped);
  }

  /**
   * Sets the push budget (leaf → relay attempts per stage).
   * Value is clamped to [1, 10].
   *
   * @param value - The desired push budget
   */
  public setPushBudget(value: number): void {
    this._pushBudget.set(clamp(value, 1, 10));
  }

  /**
   * Sets the gossip budget (relay ↔ relay exchanges per stage).
   * Value is clamped to [1, 10].
   *
   * @param value - The desired gossip budget
   */
  public setGossipBudget(value: number): void {
    this._gossipBudget.set(clamp(value, 1, 10));
  }

  /**
   * Sets the pull budget (relay → leaf attempts per stage).
   * Value is clamped to [1, 10].
   *
   * @param value - The desired pull budget
   */
  public setPullBudget(value: number): void {
    this._pullBudget.set(clamp(value, 1, 10));
  }

  /**
   * Sets the protocol to simulate.
   *
   * @param value - The desired protocol type
   */
  public setProtocol(value: ProtocolType): void {
    this._protocol.set(value);
  }

  /**
   * Sets the animation speed multiplier.
   * Value is clamped to [0.1, 10].
   *
   * @param value - The desired animation speed (1 = normal, 2 = 2x speed, etc.)
   */
  public setAnimationSpeed(value: number): void {
    this._animationSpeed.set(clamp(value, 0.1, 10));
  }

  /**
   * Sets the delay between rounds in milliseconds.
   * Value is clamped to [50, 5000].
   *
   * @param value - The desired round delay in milliseconds
   */
  public setRoundDelay(value: number): void {
    this._roundDelay.set(clamp(value, 50, 5000));
  }

  /**
   * Sets the maximum number of rounds before timeout.
   * Value is clamped to [10, 1000].
   *
   * @param value - The desired maximum rounds
   */
  public setMaxRounds(value: number): void {
    this._maxRounds.set(clamp(value, 10, 1000));
  }

  /**
   * Toggles or sets the visibility of node labels.
   *
   * @param value - Whether to show labels
   */
  public setShowLabels(value: boolean): void {
    this._showLabels.set(value);
  }

  /**
   * Toggles or sets the visibility of transfer animations.
   *
   * @param value - Whether to show transfer animations
   */
  public setShowTransfers(value: boolean): void {
    this._showTransfers.set(value);
  }

  /**
   * Toggles or sets the camera auto-rotate feature.
   *
   * @param value - Whether camera should auto-rotate
   */
  public setAutoRotate(value: boolean): void {
    this._autoRotate.set(value);
  }

  /**
   * Toggles or sets the 3D visualization mode.
   *
   * @param value - Whether to enable 3D visualization (vs 2D)
   */
  public setEnable3D(value: boolean): void {
    this._enable3D.set(value);
  }
}
