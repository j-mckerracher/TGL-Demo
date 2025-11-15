import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { AnimationService } from '../../services/animation.service';

/**
 * TglParametersComponent provides a configuration panel with dropdowns
 * for adjusting TGL-specific relay and leaf node distribution parameters.
 *
 * Relay nodes in TGL act as message forwarders and maintainers of the gossip network,
 * while leaf nodes are lightweight participants that rely on relays for message propagation.
 *
 * All controls are disabled during active animation playback to prevent
 * mid-simulation configuration changes.
 */
@Component({
  selector: 'app-tgl-parameters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tgl-parameters.component.html',
  styleUrls: ['./tgl-parameters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TglParametersComponent {
  // Inject services
  protected readonly settings = inject(SettingsService);
  protected readonly animation = inject(AnimationService);

  // Expose signals for template binding
  public readonly relayPercentage = this.settings.relayPercentage;
  public readonly leafPercentage = this.settings.leafPercentage;
  public readonly isPlaying = this.animation.isPlaying;

  // Available relay percentage options (discrete presets)
  public readonly relayOptions = [10, 20, 30, 40, 50];

  // Available leaf percentage options (discrete presets)
  public readonly leafOptions = [90, 80, 70, 60, 50];

  /**
   * Handle relay percentage dropdown change.
   * Updates the relay percentage and automatically adjusts leaf percentage.
   */
  public onRelayPercentageChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.settings.setRelayPercentage(value);
  }

  /**
   * Handle leaf percentage dropdown change.
   * Updates relay percentage to maintain the complementary relationship (relay = 100 - leaf).
   */
  public onLeafPercentageChange(event: Event): void {
    const leafValue = parseInt((event.target as HTMLSelectElement).value, 10);
    const relayValue = 100 - leafValue;
    this.settings.setRelayPercentage(relayValue);
  }
}
