import { Component, ChangeDetectionStrategy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from './services/settings.service';
import { SimulationService, TglStage } from './services/simulation.service';
import { AnimationService } from './services/animation.service';
import { MetricsService } from './services/metrics.service';
import { NetworkCanvasComponent } from './components/network-canvas/network-canvas.component';
import { InfoBannerComponent } from './components/info-banner/info-banner.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';

interface CompletionStatCard {
  id: 'exchanges' | 'communication' | 'speed';
  title: string;
  subtitle: string;
  tglValue: string;
  p2pValue: string;
  diffPercent: number | null;
  diffLabel: string;
  descriptor: string;
  positive: boolean | null;
}

/**
 * Root application component for the P2P vs TGL visualization demo.
 * Provides the main layout structure with header, configuration panel,
 * dual canvas containers (P2P and TGL), and metrics panel.
 * Uses OnPush change detection and Angular Signals for reactive state management.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NetworkCanvasComponent, InfoBannerComponent, HeroSectionComponent],
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
  public readonly maliciousPercentage = this.settingsService.maliciousPercentage;
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
    { label: 'Source Node', color: '#a855f7' },
    { label: 'Relay Node', color: '#ff8c00' },
    { label: 'Malicious Node', color: '#991b1b' },
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
  public readonly completionStats = computed<CompletionStatCard[] | null>(() => {
    const comparison = this.metricsService.comparison();
    if (!comparison) {
      return null;
    }

    const exchangesDiff = comparison.flooding.totalMessages > 0
      ? ((comparison.flooding.totalMessages - comparison.tgl.totalMessages) / comparison.flooding.totalMessages) * 100
      : null;

    const roundsDiff = comparison.flooding.totalRounds > 0
      ? ((comparison.flooding.totalRounds - comparison.tgl.totalRounds) / comparison.flooding.totalRounds) * 100
      : null;

    const speedDiff = comparison.flooding.completionTime > 0
      ? ((comparison.flooding.completionTime - comparison.tgl.completionTime) / comparison.flooding.completionTime) * 100
      : null;

    return [
      this.createCompletionStatCard({
        id: 'exchanges',
        title: 'Exchanges',
        subtitle: 'Total message transmissions',
        tglRawValue: comparison.tgl.totalMessages,
        p2pRawValue: comparison.flooding.totalMessages,
        diffPercent: exchangesDiff,
        positiveWord: 'fewer',
        negativeWord: 'more',
        descriptor: 'Less chatter required',
        formatter: (value) => this.formatCount(value),
      }),
      this.createCompletionStatCard({
        id: 'communication',
        title: 'Comm.',
        subtitle: 'Rounds to reach coverage',
        tglRawValue: comparison.tgl.totalRounds,
        p2pRawValue: comparison.flooding.totalRounds,
        diffPercent: roundsDiff,
        positiveWord: 'fewer',
        negativeWord: 'more',
        descriptor: 'Rounds saved overall',
        formatter: (value) => this.formatCount(value),
      }),
      this.createCompletionStatCard({
        id: 'speed',
        title: 'Speed',
        subtitle: 'Time to full coverage',
        tglRawValue: comparison.tgl.completionTime,
        p2pRawValue: comparison.flooding.completionTime,
        diffPercent: speedDiff,
        positiveWord: 'faster',
        negativeWord: 'slower',
        descriptor: 'Wall-clock improvement',
        formatter: (value) => this.formatDuration(value),
      }),
    ];
  });

  /**
   * Local UI state for dismissing the completion popup.
   */
  private readonly completionPopupDismissed = signal(true);
  private readonly numberFormatter = new Intl.NumberFormat('en-US');

  public readonly coverageDifference = computed(() => {
    const stats = this.completionStats();
    if (!stats) {
      return null;
    }
    const exchangesStat = stats.find((stat) => stat.id === 'exchanges');
    if (!exchangesStat || exchangesStat.diffPercent === null) {
      return null;
    }

    return {
      percent: Math.abs(Math.round(exchangesStat.diffPercent)),
      direction: exchangesStat.diffPercent >= 0 ? 'fewer' : 'more',
    };
  });
  public readonly showCoveragePopup = computed(() => this.metricsService.bothComplete() && !this.completionPopupDismissed());

  constructor() {
    effect(
      () => {
        const complete = this.metricsService.bothComplete();
        if (complete) {
          this.completionPopupDismissed.set(false);
        } else {
          this.completionPopupDismissed.set(true);
        }
      },
      { allowSignalWrites: true }
    );
  }

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
   * Dismiss the completion popup until the next run finishes.
   */
  public dismissCoveragePopup(): void {
    this.completionPopupDismissed.set(true);
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
   * Handle slider changes for malicious percentage.
   */
  public onMaliciousPercentageChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settingsService.setMaliciousPercentage(value);
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

  private createCompletionStatCard(config: {
    id: CompletionStatCard['id'];
    title: string;
    subtitle: string;
    tglRawValue: number;
    p2pRawValue: number;
    diffPercent: number | null;
    positiveWord: string;
    negativeWord: string;
    descriptor: string;
    formatter: (value: number) => string;
  }): CompletionStatCard {
    const { diffPercent } = config;
    const positive = diffPercent === null ? null : diffPercent >= 0;

    let diffLabel = '--';
    if (diffPercent !== null && Number.isFinite(diffPercent)) {
      diffLabel = `${Math.abs(Math.round(diffPercent))}% ${diffPercent >= 0 ? config.positiveWord : config.negativeWord}`;
    }

    return {
      id: config.id,
      title: config.title,
      subtitle: config.subtitle,
      tglValue: config.formatter(config.tglRawValue),
      p2pValue: config.formatter(config.p2pRawValue),
      diffPercent,
      diffLabel,
      descriptor: config.descriptor,
      positive,
    };
  }

  private formatCount(value: number): string {
    return this.numberFormatter.format(Math.max(0, Math.round(value)));
  }

  private formatDuration(valueMs: number): string {
    if (!Number.isFinite(valueMs) || valueMs <= 0) {
      return '0.0s';
    }

    const seconds = valueMs / 1000;
    if (seconds >= 10) {
      return `${seconds.toFixed(1)}s`;
    }
    return `${seconds.toFixed(2)}s`;
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
