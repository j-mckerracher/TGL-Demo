/**
 * App Component Unit Tests.
 *
 * Tests for the main application shell component.
 * Covers initialization, fallback detection, and run/reset flow.
 *
 * Version: v1.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { App } from './app';
import { EngineController } from './state/engine.controller';
import { ParamsStore } from './state/params.store';
import { ErrorService } from './error/error.service';
import { FallbackService } from 'fallback';
import { StatsAggregatorService } from 'ui';
import { TakeawayService } from 'ui';
import type { SimulationStateV1, SimulationParametersV1 } from 'simulation';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let mockEngineController: jasmine.SpyObj<EngineController>;
  let mockParamsStore: jasmine.SpyObj<ParamsStore>;
  let mockFallbackService: jasmine.SpyObj<FallbackService>;
  let mockErrorService: jasmine.SpyObj<ErrorService>;
  let mockStatsAggregator: jasmine.SpyObj<StatsAggregatorService>;
  let mockTakeawayService: jasmine.SpyObj<TakeawayService>;

  const mockParams: SimulationParametersV1 = {
    seed: 12345,
    nodeCounts: { mechanism: 100, p2p: 100 },
    phaseBudgets: { setup: 10, run: 100 },
    p2pDegree: 4,
    epsilon: 0.01,
    reducedMotionEnabled: false,
  };

  const mockState: SimulationStateV1 = {
    roundIndex: 0,
    phase: 'setup',
    randomState: {},
  };

  beforeEach(async () => {
    // Create spies for all services
    mockEngineController = jasmine.createSpyObj('EngineController', [
      'initialize',
      'start',
      'stop',
      'reset',
    ], {
      engineState$: of(mockState),
      isRunning: signal(false),
      isInitialized: signal(false),
    });

    mockParamsStore = jasmine.createSpyObj('ParamsStore', ['updateParameters'], {
      parameters: signal(mockParams),
    });

    mockFallbackService = jasmine.createSpyObj('FallbackService', [
      'initialize',
      'detectCapabilities',
      'getStaticPlaceholder',
    ], {
      isFallbackActive: signal(false),
    });

    mockErrorService = jasmine.createSpyObj('ErrorService', [
      'reset',
      'reportError',
    ]);

    mockStatsAggregator = jasmine.createSpyObj('StatsAggregatorService', [
      'aggregate',
      'reset',
    ]);

    mockTakeawayService = jasmine.createSpyObj('TakeawayService', [
      'compute',
      'formatMessage',
    ]);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: EngineController, useValue: mockEngineController },
        { provide: ParamsStore, useValue: mockParamsStore },
        { provide: FallbackService, useValue: mockFallbackService },
        { provide: ErrorService, useValue: mockErrorService },
        { provide: StatsAggregatorService, useValue: mockStatsAggregator },
        { provide: TakeawayService, useValue: mockTakeawayService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize fallback service on ngOnInit', () => {
      fixture.detectChanges();
      expect(mockFallbackService.initialize).toHaveBeenCalled();
    });

    it('should initialize engine controller on ngOnInit', () => {
      fixture.detectChanges();
      expect(mockEngineController.initialize).toHaveBeenCalled();
    });

    it('should have engineState$ observable from controller', () => {
      expect(component.engineState$).toBe(mockEngineController.engineState$);
    });

    it('should initialize with stats not visible', () => {
      expect(component.statsSeriesVisible()).toBe(false);
    });

    it('should initialize with empty chart series', () => {
      expect(component.chartSeries()).toEqual([]);
    });

    it('should initialize with null run summaries', () => {
      expect(component.runSummaryMechanism()).toBeNull();
      expect(component.runSummaryP2P()).toBeNull();
    });
  });

  describe('Fallback Detection', () => {
    it('should reflect fallback state from service', () => {
      mockFallbackService.isFallbackActive.set(true);
      fixture.detectChanges();
      expect(component.isFallbackActive()).toBe(true);
    });

    it('should reflect non-fallback state from service', () => {
      mockFallbackService.isFallbackActive.set(false);
      fixture.detectChanges();
      expect(component.isFallbackActive()).toBe(false);
    });
  });

  describe('Running State', () => {
    it('should reflect running state from controller', () => {
      mockEngineController.isRunning.set(true);
      fixture.detectChanges();
      expect(component.isRunning()).toBe(true);
    });

    it('should show stats when simulation starts running', (done) => {
      fixture.detectChanges();
      expect(component.statsSeriesVisible()).toBe(false);

      mockEngineController.isRunning.set(true);
      fixture.detectChanges();

      // Use setTimeout to allow effect to run
      setTimeout(() => {
        expect(component.statsSeriesVisible()).toBe(true);
        done();
      }, 0);
    });
  });

  describe('Component Integration', () => {
    it('should render controls component', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const controls = compiled.querySelector('controls');
      expect(controls).toBeTruthy();
    });

    it('should render mechanism canvas', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const canvas = compiled.querySelector('mechanism-canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render p2p canvas', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const canvas = compiled.querySelector('p2p-canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render status banner', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const banner = compiled.querySelector('app-status-banner');
      expect(banner).toBeTruthy();
    });

    it('should render fallback banner', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const banner = compiled.querySelector('fallback-banner');
      expect(banner).toBeTruthy();
    });

    it('should render offline banner', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const banner = compiled.querySelector('app-offline-banner');
      expect(banner).toBeTruthy();
    });

    it('should render empty state initially', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('Click "Run" to start simulation');
    });
  });

  describe('Responsive Layout', () => {
    it('should have app-shell container', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const shell = compiled.querySelector('.app-shell');
      expect(shell).toBeTruthy();
    });

    it('should have app-main layout', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const main = compiled.querySelector('.app-main');
      expect(main).toBeTruthy();
    });

    it('should have controls panel', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const panel = compiled.querySelector('.controls-panel');
      expect(panel).toBeTruthy();
    });

    it('should have visualization area', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const area = compiled.querySelector('.visualization-area');
      expect(area).toBeTruthy();
    });

    it('should have stats panel', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const panel = compiled.querySelector('.stats-panel');
      expect(panel).toBeTruthy();
    });
  });
});
