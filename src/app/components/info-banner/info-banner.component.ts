import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * InfoBannerComponent displays an informative banner explaining the TGL vs P2P comparison.
 * Shows what the animations represent, node types, visual encoding, and the three-stage protocol.
 */
@Component({
  selector: 'app-info-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-banner.component.html',
  styleUrls: ['./info-banner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBannerComponent {
  /**
   * Visual indicators for node types with their colors
   */
  public readonly nodeTypes = [
    { label: 'Relay Nodes', color: '#8b5cf6', description: 'Forward messages between network tiers' },
    { label: 'Leaf Nodes', color: '#22c55e', description: 'Connect through relay nodes for efficiency' },
  ];

  /**
   * Protocol stages with visual indicators
   */
  public readonly protocolStages = [
    { 
      stage: 'Push', 
      icon: '↑', 
      description: 'Leaves send to relays',
      color: '#3b82f6'
    },
    { 
      stage: 'Gossip', 
      icon: '↔', 
      description: 'Relays exchange with each other',
      color: '#8b5cf6'
    },
    { 
      stage: 'Pull', 
      icon: '↓', 
      description: 'Relays broadcast to leaves',
      color: '#22c55e'
    },
  ];

  /**
   * Visual state encodings
   */
  public readonly stateEncodings = [
    { label: 'Idle', color: '#64748b', description: 'Waiting for data' },
    { label: 'Active', color: '#22c55e', description: 'Has received data' },
    { label: 'Transferring', animation: 'pulse', description: 'Data in transit' },
  ];
}

