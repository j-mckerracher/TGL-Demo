import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from './services/settings.service';
import { SimulationService } from './services/simulation.service';
import { ThreeRendererService } from './services/three-renderer.service';

/**
 * Root application component for the P2P vs TGL visualization demo.
 * Provides the main layout structure with header, configuration panel,
 * dual canvas containers (P2P and TGL), and metrics panel.
 * Uses OnPush change detection and Angular Signals for reactive state management.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /**
   * Application title
   */
  public readonly title = 'P2P vs TGL Visualization';

  /**
   * Injected services using Angular's inject() function
   */
  protected readonly settingsService = inject(SettingsService);
  protected readonly simulationService = inject(SimulationService);
  protected readonly threeRendererService = inject(ThreeRendererService);

  /**
   * Expose read-only signals for template access
   */
  public readonly nodeCount = this.settingsService.nodeCount;
  public readonly protocol = this.settingsService.protocol;
  public readonly p2pState = this.simulationService.p2pState;
  public readonly tglState = this.simulationService.tglState;
}
