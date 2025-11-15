import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { AnimationService } from '../../services/animation.service';

/**
 * NetworkConfigComponent provides a configuration panel with sliders
 * for adjusting network simulation parameters including node count,
 * degree, relay percentage, and animation speed.
 *
 * All controls are disabled during active animation playback to prevent
 * mid-simulation configuration changes.
 */
@Component({
  selector: 'app-network-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './network-config.component.html',
  styleUrls: ['./network-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkConfigComponent {
  // Inject services
  protected readonly settings = inject(SettingsService);
  protected readonly animation = inject(AnimationService);

  // Expose signals for template binding
  public readonly nodeCount = this.settings.nodeCount;
  public readonly averageDegree = this.settings.averageDegree;
  public readonly relayPercentage = this.settings.relayPercentage;
  public readonly leafPercentage = this.settings.leafPercentage;
  public readonly animationSpeed = this.settings.animationSpeed;
  public readonly isPlaying = this.animation.isPlaying;

  /**
   * Handle node count slider change
   */
  public onNodeCountChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.settings.setNodeCount(value);
  }

  /**
   * Handle average degree slider change
   */
  public onAverageDegreeChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.settings.setAverageDegree(value);
  }

  /**
   * Handle relay percentage slider change
   */
  public onRelayPercentageChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.settings.setRelayPercentage(value);
  }

  /**
   * Handle animation speed slider change
   */
  public onAnimationSpeedChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.settings.setAnimationSpeed(value);
  }
}
