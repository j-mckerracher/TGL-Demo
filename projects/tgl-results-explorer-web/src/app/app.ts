/**
 * App component - Main application shell.
 *
 * Orchestrates the entire application by integrating:
 * - Controls (Run/Reset buttons and parameter forms)
 * - Dual canvas visualizations (Mechanism and P2P)
 * - Statistics chart
 * - Takeaway summary
 * - Status and fallback banners
 *
 * Wires components to state stores and manages the simulation lifecycle.
 *
 * Version: v1.0
 */

import { Component, OnInit, signal, computed, effect, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import type { SimulationStateV1, RunSummaryV1 } from 'simulation';

// UI components
import { ControlsComponent, type ControlsParameters } from 'ui';
import { MicroLineChartComponent, type ChartSeries } from 'ui';
import { TakeawayComponent } from 'ui';

// Rendering components
import { MechanismCanvasComponent, P2PCanvasComponent } from 'rendering';

// State management
import { EngineController } from './state/engine.controller';
import { ParamsStore } from './state/params.store';

// Error handling
import { ErrorService } from './error/error.service';
import { StatusBannerComponent } from './error/status-banner.component';

// Fallback handling
import { FallbackService, FallbackBannerComponent } from 'fallback';

// Offline/SW support
import { OfflineBannerComponent } from './offline/offline-banner.component';

// Stats and takeaway
import { StatsAggregatorService } from 'ui';
import { TakeawayService } from 'ui';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
  imports: [
    CommonModule,
    ControlsComponent,
    MechanismCanvasComponent,
    P2PCanvasComponent,
    MicroLineChartComponent,
    TakeawayComponent,
    StatusBannerComponent,
    FallbackBannerComponent,
    OfflineBannerComponent,
  ],
})
export class App implements OnInit {
  // Canvas component references for rendering initialization
  @ViewChild(MechanismCanvasComponent) mechanismCanvas?: MechanismCanvasComponent;
  @ViewChild(P2PCanvasComponent) p2pCanvas?: P2PCanvasComponent;

  // Inject services using inject() function
  private readonly engineController = inject(EngineController);
  private readonly paramsStore = inject(ParamsStore);
  private readonly fallbackService = inject(FallbackService);
  private readonly errorService = inject(ErrorService);
  private readonly statsAggregatorService = inject(StatsAggregatorService);
  private readonly takeawayService = inject(TakeawayService);

  /**
   * Observable stream of engine state.
   * Must be a getter to always return the current engine's state observable,
   * since the engine is recreated on each initialize() call.
   */
  get engineState$(): Observable<SimulationStateV1> {
    return this.engineController.engineState$;
  }

  /**
   * Signal tracking whether stats chart should be visible.
   * Becomes true after simulation starts.
   */
  readonly statsSeriesVisible = signal<boolean>(false);

  /**
   * Signal for chart series data.
   */
  readonly chartSeries = signal<ChartSeries[]>([]);

  /**
   * Signal tracking Mechanism run summary.
   */
  readonly runSummaryMechanism = signal<RunSummaryV1 | null>(null);

  /**
   * Signal tracking P2P run summary.
   */
  readonly runSummaryP2P = signal<RunSummaryV1 | null>(null);

  /**
   * Computed signal for fallback state.
   */
  readonly isFallbackActive = computed(() =>
    this.fallbackService.isFallbackActive()
  );

  /**
   * Computed signal for running state.
   */
  readonly isRunning = computed(() => this.engineController.isRunning());

  /**
   * Computed signal for controls parameters.
   */
  readonly controlsParameters = computed<ControlsParameters>(() => {
    const params = this.paramsStore.parameters();
    return {
      seed: params.seed,
      nodeCounts: params.nodeCounts,
      phaseBudgets: params.phaseBudgets,
      p2pDegree: params.p2pDegree,
      epsilon: params.epsilon,
      reducedMotionEnabled: params.reducedMotionEnabled,
    };
  });

  constructor() {
    // React to engine state changes to update stats and summaries
    effect(() => {
      const isRunning = this.isRunning();
      if (isRunning) {
        this.statsSeriesVisible.set(true);
      }
    });
  }

  ngOnInit(): void {
    // Initialize fallback service to detect capabilities
    this.fallbackService.initialize();

    // Initialize engine controller
    this.engineController.initialize();
  }

  /**
   * Handle parameter changes from controls component.
   */
  onParametersChange(params: Partial<ControlsParameters>): void {
    this.paramsStore.updateParameters(params);
  }

  /**
   * Handle run button click from controls component.
   */
  onRun(): void {
    console.log('[App] onRun() called');
    console.log('[App] engineController.isRunning():', this.engineController.isRunning());

    // Dispose old adapters first to reset their state
    console.log('[App] Disposing old canvas adapters');
    this.mechanismCanvas?.dispose();
    this.p2pCanvas?.dispose();

    // Initialize fresh canvas adapters for rendering
    console.log('[App] Initializing canvas adapters');
    this.mechanismCanvas?.initAdapter();
    this.p2pCanvas?.initAdapter();
    console.log('[App] Canvas adapters initialized');

    this.engineController.initialize();
    console.log('[App] After initialize() - engineController.isRunning():', this.engineController.isRunning());
    this.engineController.start();
    console.log('[App] After start() - engineController.isRunning():', this.engineController.isRunning());
  }

  /**
   * Handle reset button click from controls component.
   */
  onReset(): void {
    console.log('[App] onReset() called');
    this.engineController.reset();
    this.errorService.reset();
    // Dispose canvas adapters to clean up rendering resources
    console.log('[App] Disposing canvas adapters');
    this.mechanismCanvas?.dispose();
    this.p2pCanvas?.dispose();
  }

  /**
   * Handle generate new seed request from controls component.
   */
  onGenerateNewSeed(): void {
    this.paramsStore.generateNewSeed();
  }
}
