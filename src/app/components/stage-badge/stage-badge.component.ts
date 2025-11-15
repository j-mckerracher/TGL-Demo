import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { TglStage } from '../../services/simulation.service';
import { NgClass } from '@angular/common';

/**
 * StageBadgeComponent displays the current TGL protocol stage as a visual badge.
 * Shows Push, Gossip, or Pull stages with distinct colors and styling.
 *
 * Standalone component with OnPush change detection for optimal performance.
 */
@Component({
  selector: 'app-stage-badge',
  templateUrl: './stage-badge.component.html',
  styleUrls: ['./stage-badge.component.css'],
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageBadgeComponent {
  /**
   * Current TGL stage to display
   * If undefined, displays "Idle" state
   */
  @Input() stage?: TglStage;

  /**
   * Expose TglStage enum to template for comparison
   */
  readonly TglStage = TglStage;

  /**
   * Get display text for the current stage
   */
  get stageLabel(): string {
    if (!this.stage) {
      return 'Idle';
    }

    switch (this.stage) {
      case TglStage.PUSH:
        return 'Push';
      case TglStage.GOSSIP:
        return 'Gossip';
      case TglStage.PULL:
        return 'Pull';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get CSS class modifier for the current stage
   */
  get stageClass(): string {
    if (!this.stage) {
      return 'stage-badge--idle';
    }

    switch (this.stage) {
      case TglStage.PUSH:
        return 'stage-badge--push';
      case TglStage.GOSSIP:
        return 'stage-badge--gossip';
      case TglStage.PULL:
        return 'stage-badge--pull';
      default:
        return 'stage-badge--idle';
    }
  }
}
