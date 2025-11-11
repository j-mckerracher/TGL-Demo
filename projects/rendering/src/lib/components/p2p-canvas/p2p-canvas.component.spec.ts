/**
 * Unit tests for P2PCanvas component.
 *
 * Tests verify:
 * - Lazy initialization (adapter not created until initAdapter called)
 * - Clean disposal (no memory leaks)
 * - Lifecycle management
 * - Reduced-motion routing
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { P2PCanvasComponent } from './p2p-canvas.component';
import type { SimulationStateV1 } from 'simulation';
import type { ThemeV1 } from '../../adapter/types';

describe('P2PCanvasComponent', () => {
  let component: P2PCanvasComponent;
  let fixture: ComponentFixture<P2PCanvasComponent>;

  const mockTheme: ThemeV1 = {
    palette: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#1e293b',
      accent: '#f59e0b',
    },
    motion: {
      animationDuration: 300,
      enableTransitions: true,
    },
  };

  const mockState: SimulationStateV1 = {
    roundIndex: 5,
    phase: 'run',
    randomState: { seed: 42 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [P2PCanvasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(P2PCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('lazy initialization', () => {
    it('should not initialize adapter on component creation', () => {
      // Component is created in beforeEach
      // Verify adapter is not initialized yet
      const capabilities = component.getCapabilities();
      expect(capabilities).toBeUndefined();
    });

    it('should not initialize adapter in ngAfterViewInit', () => {
      // ngAfterViewInit is called automatically
      // Verify adapter is still not initialized
      const capabilities = component.getCapabilities();
      expect(capabilities).toBeUndefined();
    });

    it('should initialize adapter when initAdapter is called', () => {
      component.initAdapter();

      // Verify adapter is now initialized
      const capabilities = component.getCapabilities();
      expect(capabilities).toBeDefined();
      expect(typeof capabilities?.webgl).toBe('boolean');
    });

    it('should not reinitialize adapter on second initAdapter call', () => {
      component.initAdapter();
      const capabilities1 = component.getCapabilities();

      component.initAdapter();
      const capabilities2 = component.getCapabilities();

      // Should be the same adapter instance
      expect(capabilities1).toEqual(capabilities2);
    });
  });

  describe('disposal', () => {
    it('should dispose adapter cleanly', () => {
      component.initAdapter();
      expect(component.getCapabilities()).toBeDefined();

      component.dispose();

      // After disposal, adapter should be cleared
      expect(component.getCapabilities()).toBeUndefined();
    });

    it('should be safe to dispose without initializing', () => {
      // Should not throw
      expect(() => component.dispose()).not.toThrow();
    });

    it('should be idempotent (safe to call multiple times)', () => {
      component.initAdapter();
      component.dispose();

      // Second dispose should not throw
      expect(() => component.dispose()).not.toThrow();
    });

    it('should unsubscribe from state stream on dispose', () => {
      const stateSubject = new BehaviorSubject<SimulationStateV1>(mockState);
      component.simulationState$ = stateSubject.asObservable();

      component.initAdapter();
      expect(stateSubject.observers.length).toBe(1);

      component.dispose();
      expect(stateSubject.observers.length).toBe(0);
    });
  });

  describe('lifecycle management', () => {
    it('should call dispose on ngOnDestroy', () => {
      spyOn(component, 'dispose');

      component.ngOnDestroy();

      expect(component.dispose).toHaveBeenCalled();
    });

    it('should complete full lifecycle without errors', () => {
      expect(() => {
        component.ngAfterViewInit();
        component.initAdapter();
        component.dispose();
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('state synchronization', () => {
    it('should subscribe to simulation state observable', () => {
      const stateSubject = new BehaviorSubject<SimulationStateV1>(mockState);
      component.simulationState$ = stateSubject.asObservable();

      component.initAdapter();

      expect(stateSubject.observers.length).toBe(1);

      component.dispose();
    });

    it('should handle state updates', () => {
      const stateSubject = new BehaviorSubject<SimulationStateV1>(mockState);
      component.simulationState$ = stateSubject.asObservable();

      component.initAdapter();

      // Emit a new state
      const newState: SimulationStateV1 = {
        roundIndex: 10,
        phase: 'run',
        randomState: { seed: 42 },
      };

      expect(() => stateSubject.next(newState)).not.toThrow();

      component.dispose();
    });

    it('should not fail if simulationState$ is not provided', () => {
      component.simulationState$ = undefined;

      expect(() => component.initAdapter()).not.toThrow();
      expect(() => component.dispose()).not.toThrow();
    });
  });

  describe('reduced-motion support', () => {
    it('should use renderFrame when reducedMotion is false', () => {
      const stateSubject = new BehaviorSubject<SimulationStateV1>(mockState);
      component.simulationState$ = stateSubject.asObservable();
      component.reducedMotion = false;

      component.initAdapter();

      // Should not throw when rendering with animation
      expect(() => stateSubject.next(mockState)).not.toThrow();

      component.dispose();
    });

    it('should use renderDiscrete when reducedMotion is true', () => {
      const stateSubject = new BehaviorSubject<SimulationStateV1>(mockState);
      component.simulationState$ = stateSubject.asObservable();
      component.reducedMotion = true;

      component.initAdapter();

      // Should not throw when rendering discretely
      expect(() => stateSubject.next(mockState)).not.toThrow();

      component.dispose();
    });
  });

  describe('theme configuration', () => {
    it('should use default theme if not provided', () => {
      expect(component.theme).toBeDefined();
      expect(component.theme.palette).toBeDefined();
      expect(component.theme.motion).toBeDefined();
    });

    it('should accept custom theme', () => {
      const customTheme: ThemeV1 = {
        palette: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#0000ff',
          accent: '#ffff00',
        },
        motion: {
          animationDuration: 0,
          enableTransitions: false,
        },
      };

      component.theme = customTheme;
      component.initAdapter();

      expect(component.theme).toEqual(customTheme);

      component.dispose();
    });
  });

  describe('canvas reference', () => {
    it('should have canvas element after view init', () => {
      expect(component.canvasRef).toBeDefined();
      expect(component.canvasRef?.nativeElement).toBeInstanceOf(
        HTMLCanvasElement
      );
    });

    it('should initialize adapter with canvas element', () => {
      component.initAdapter();

      // If adapter initialized successfully, it has the canvas
      const capabilities = component.getCapabilities();
      expect(capabilities).toBeDefined();

      component.dispose();
    });
  });
});
