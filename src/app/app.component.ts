import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from './services/settings.service';
import { SimulationService, TglStage } from './services/simulation.service';
import { AnimationService } from './services/animation.service';
import { MetricsService } from './services/metrics.service';
import { NetworkCanvasComponent } from './components/network-canvas/network-canvas.component';
import { InfoBannerComponent } from './components/info-banner/info-banner.component';

/**
 * Root application component for the P2P vs TGL visualization demo.
 * Provides the main layout structure with header, configuration panel,
 * dual canvas containers (P2P and TGL), and metrics panel.
 * Uses OnPush change detection and Angular Signals for reactive state management.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NetworkCanvasComponent, InfoBannerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  /**
   * Application title
   */
  public readonly title = 'P2P vs TGL Visualization';

  /**
   * Injected services using Angular's inject() function
   */
  private readonly settingsService = inject(SettingsService);
  private readonly simulationService = inject(SimulationService);
  private readonly animationService = inject(AnimationService);
  private readonly metricsService = inject(MetricsService);

  /**
   * Expose read-only signals for template access
   */
  public readonly nodeCount = this.settingsService.nodeCount;
  public readonly animationSpeed = this.settingsService.animationSpeed;
  public readonly averageDegree = this.settingsService.averageDegree;
  public readonly pushBudget = this.settingsService.pushBudget;
  public readonly gossipBudget = this.settingsService.gossipBudget;
  public readonly pullBudget = this.settingsService.pullBudget;
  public readonly maxRounds = this.settingsService.maxRounds;
  public readonly isPlaying = this.animationService.isPlaying;
  public readonly p2pState = this.simulationService.p2pState;
  public readonly tglState = this.simulationService.tglState;
  public readonly tglStage = this.simulationService.tglCurrentStage;

  /**
   * Legend entries shown in the sidebar
   */
  public readonly legendItems = [
    { label: 'Inactive Node', color: '#3b82f6' },
    { label: 'Has Update', color: '#22c55e' },
    { label: 'Source Node', color: '#ef4444' },
    { label: 'Relay Node', color: '#ff8c00' },
  ];

  /**
   * Dropdown options for TGL budgets
   */
  public readonly pushBudgetOptions = [2, 3, 4, 5];
  public readonly gossipBudgetOptions = [1, 2, 3, 4];
  public readonly pullBudgetOptions = [1, 2, 3, 4];

  /**
   * Control panel toggles
   */
  public readonly showConnections = signal(true);
  public readonly showDataFlow = signal(true);

  /**
   * Computed helpers for header + metrics
   */
  public readonly currentRound = computed(() => Math.max(this.p2pState().round, this.tglState().round));
  public readonly p2pCoverage = computed(() => this.p2pState().coverage);
  public readonly tglCoverage = computed(() => this.tglState().coverage);
  public readonly p2pCoverageLabel = computed(() => `${Math.round(this.p2pCoverage())}%`);
  public readonly tglCoverageLabel = computed(() => `${Math.round(this.tglCoverage())}%`);
  public readonly p2pProgressWidth = computed(() => `${Math.min(100, this.p2pCoverage())}%`);
  public readonly tglProgressWidth = computed(() => `${Math.min(100, this.tglCoverage())}%`);
  public readonly p2pMessages = computed(() => this.p2pState().totalMessagesSent);
  public readonly tglMessages = computed(() => this.tglState().totalMessagesSent);
  public readonly p2pRound = computed(() => this.p2pState().round);
  public readonly tglRound = computed(() => this.tglState().round);
  public readonly stageBadgeText = computed(() => this.getStageBadgeText());
  public readonly messageReduction = this.metricsService.messageReduction;
  public readonly speedGain = this.metricsService.speedGain;
  public readonly messageReductionLabel = computed(() => this.formatMetricPercentage(this.messageReduction()));
  public readonly speedGainLabel = computed(() => this.formatMetricPercentage(this.speedGain()));

  /**
   * Initialize both simulations when the component is mounted.
   */
  public ngOnInit(): void {
    this.simulationService.initializeNetworksFromSettings();
  }

  /**
   * Toggle between play and pause states.
   */
  public togglePlayback(): void {
    if (this.isPlaying()) {
      this.animationService.pause();
    } else {
      this.animationService.play();
    }
  }

  /**
   * Reset the simulation.
   */
  public onReset(): void {
    this.animationService.reset();
  }

  /**
   * Handle slider changes for node count.
   */
  public onNodeCountChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settingsService.setNodeCount(value);
    this.animationService.reset();
  }

  /**
   * Handle slider changes for animation speed.
   */
  public onAnimationSpeedChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settingsService.setAnimationSpeed(value);
    this.animationService.reset();
  }

  /**
   * Handle slider changes for P2P degree.
   */
  public onAverageDegreeChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settingsService.setAverageDegree(value);
    this.animationService.reset();
  }

  /**
   * Handle dropdown changes for the TGL push budget.
   */
  public onPushBudgetChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.settingsService.setPushBudget(value);
    this.animationService.reset();
  }

  /**
   * Handle dropdown changes for the TGL gossip budget.
   */
  public onGossipBudgetChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.settingsService.setGossipBudget(value);
    this.animationService.reset();
  }

  /**
   * Handle dropdown changes for the TGL pull budget.
   */
  public onPullBudgetChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.settingsService.setPullBudget(value);
    this.animationService.reset();
  }

  /**
   * Track user preference for showing connections.
   */
  public onShowConnectionsChange(event: Event): void {
    this.showConnections.set((event.target as HTMLInputElement).checked);
  }

  /**
   * Track user preference for showing particle flow.
   */
  public onShowDataFlowChange(event: Event): void {
    this.showDataFlow.set((event.target as HTMLInputElement).checked);
  }

  /**
   * Format metric values with +/- percentage notation.
   */
  private formatMetricPercentage(value: number | null): string {
    if (value === null || Number.isNaN(value)) {
      return '--';
    }
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(0)}%`;
  }

  /**
   * Derive the stage badge text shown above the TGL canvas.
   */
  private getStageBadgeText(): string {
    const state = this.tglState();
    if (!this.isPlaying() && state.round === 0 && state.transfers.length === 0) {
      return 'Stage: Idle';
    }

    const stage = this.tglStage();
    switch (stage) {
      case TglStage.PUSH:
        return 'Stage 1: Push (Leaf → Relay)';
      case TglStage.GOSSIP:
        return 'Stage 2: Gossip (Relay ↔ Relay)';
      case TglStage.PULL:
        return 'Stage 3: Pull (Relay → Leaf)';
      default:
        return 'Stage: Idle';
    }
  }

  /**
   * Smooth scroll to the demo section.
   */
  public scrollToDemo(): void {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
