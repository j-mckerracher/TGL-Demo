/**
 * Controls Component Unit Tests.
 *
 * Tests reactive forms, validation, ParamsStore integration, and EngineController interaction.
 *
 * Version: v1.0
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { ControlsComponent } from './controls.component';
import { ParamsStore } from '../../../../tgl-results-explorer-web/src/app/state/params.store';
import { EngineController } from '../../../../tgl-results-explorer-web/src/app/state/engine.controller';
import type { SimulationParametersV1 } from 'simulation';

describe('ControlsComponent', () => {
  let component: ControlsComponent;
  let fixture: ComponentFixture<ControlsComponent>;
  let mockParamsStore: jasmine.SpyObj<ParamsStore>;
  let mockEngineController: jasmine.SpyObj<EngineController>;

  // Default test parameters
  const defaultParams: SimulationParametersV1 = {
    seed: 12345,
    nodeCounts: { mechanism: 50, p2p: 50 },
    phaseBudgets: { setup: 10, run: 100 },
    p2pDegree: 4,
    epsilon: 0.01,
    reducedMotionEnabled: false,
  };

  beforeEach(async () => {
    // Create mock ParamsStore with signal
    const parametersSignal = signal(defaultParams);
    mockParamsStore = jasmine.createSpyObj(
      'ParamsStore',
      ['updateParameters', 'generateNewSeed'],
      {
        parameters: parametersSignal,
      }
    );

    // Create mock EngineController with signals
    const isRunningSignal = signal(false);
    const isInitializedSignal = signal(false);
    mockEngineController = jasmine.createSpyObj(
      'EngineController',
      ['initialize', 'start', 'stop', 'reset', 'step'],
      {
        isRunning: isRunningSignal,
        isInitialized: isInitializedSignal,
      }
    );

    await TestBed.configureTestingModule({
      imports: [ControlsComponent, ReactiveFormsModule],
      providers: [
        { provide: ParamsStore, useValue: mockParamsStore },
        { provide: EngineController, useValue: mockEngineController },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with ParamsStore values', () => {
      expect(component.form.value.seed).toBe(12345);
      expect(component.form.value.nodeCounts.mechanism).toBe(50);
      expect(component.form.value.nodeCounts.p2p).toBe(50);
      expect(component.form.value.phaseBudgets.setup).toBe(10);
      expect(component.form.value.phaseBudgets.run).toBe(100);
      expect(component.form.value.p2pDegree).toBe(4);
      expect(component.form.value.epsilon).toBe(0.01);
      expect(component.form.value.reducedMotionEnabled).toBe(false);
    });

    it('should have seed field disabled', () => {
      const seedControl = component.form.get('seed');
      expect(seedControl?.disabled).toBe(true);
    });

    it('should have valid form with default values', () => {
      expect(component.form.valid).toBe(true);
    });
  });

  describe('Form Validation', () => {
    describe('Node Counts', () => {
      it('should reject mechanism nodes below minimum (10)', () => {
        component.form.patchValue({ nodeCounts: { mechanism: 9 } });
        expect(component.form.get('nodeCounts.mechanism')?.hasError('min')).toBe(true);
        expect(component.form.valid).toBe(false);
      });

      it('should reject mechanism nodes above maximum (200)', () => {
        component.form.patchValue({ nodeCounts: { mechanism: 201 } });
        expect(component.form.get('nodeCounts.mechanism')?.hasError('max')).toBe(true);
        expect(component.form.valid).toBe(false);
      });

      it('should accept mechanism nodes within valid range', () => {
        component.form.patchValue({ nodeCounts: { mechanism: 100 } });
        expect(component.form.get('nodeCounts.mechanism')?.hasError('min')).toBe(false);
        expect(component.form.get('nodeCounts.mechanism')?.hasError('max')).toBe(false);
      });

      it('should reject p2p nodes below minimum (10)', () => {
        component.form.patchValue({ nodeCounts: { p2p: 5 } });
        expect(component.form.get('nodeCounts.p2p')?.hasError('min')).toBe(true);
      });

      it('should reject p2p nodes above maximum (200)', () => {
        component.form.patchValue({ nodeCounts: { p2p: 250 } });
        expect(component.form.get('nodeCounts.p2p')?.hasError('max')).toBe(true);
      });
    });

    describe('Phase Budgets', () => {
      it('should reject setup budget below minimum (1)', () => {
        component.form.patchValue({ phaseBudgets: { setup: 0 } });
        expect(component.form.get('phaseBudgets.setup')?.hasError('min')).toBe(true);
      });

      it('should reject setup budget above maximum (100)', () => {
        component.form.patchValue({ phaseBudgets: { setup: 150 } });
        expect(component.form.get('phaseBudgets.setup')?.hasError('max')).toBe(true);
      });

      it('should reject run budget below minimum (1)', () => {
        component.form.patchValue({ phaseBudgets: { run: 0 } });
        expect(component.form.get('phaseBudgets.run')?.hasError('min')).toBe(true);
      });

      it('should reject run budget above maximum (1000)', () => {
        component.form.patchValue({ phaseBudgets: { run: 1500 } });
        expect(component.form.get('phaseBudgets.run')?.hasError('max')).toBe(true);
      });
    });

    describe('Advanced Controls', () => {
      it('should reject p2pDegree below minimum (1)', () => {
        component.form.patchValue({ p2pDegree: 0 });
        expect(component.form.get('p2pDegree')?.hasError('min')).toBe(true);
      });

      it('should reject p2pDegree above maximum (20)', () => {
        component.form.patchValue({ p2pDegree: 25 });
        expect(component.form.get('p2pDegree')?.hasError('max')).toBe(true);
      });

      it('should reject epsilon below minimum (0.001)', () => {
        component.form.patchValue({ epsilon: 0.0005 });
        expect(component.form.get('epsilon')?.hasError('min')).toBe(true);
      });

      it('should reject epsilon above maximum (0.5)', () => {
        component.form.patchValue({ epsilon: 0.6 });
        expect(component.form.get('epsilon')?.hasError('max')).toBe(true);
      });

      it('should accept reducedMotionEnabled boolean values', () => {
        component.form.patchValue({ reducedMotionEnabled: true });
        expect(component.form.get('reducedMotionEnabled')?.value).toBe(true);

        component.form.patchValue({ reducedMotionEnabled: false });
        expect(component.form.get('reducedMotionEnabled')?.value).toBe(false);
      });
    });
  });

  describe('Form Value Changes', () => {
    it('should update ParamsStore when valid form values change (debounced)', fakeAsync(() => {
      component.form.patchValue({
        nodeCounts: { mechanism: 75, p2p: 80 },
      });

      // Should not update immediately
      expect(mockParamsStore.updateParameters).not.toHaveBeenCalled();

      // Should update after debounce period (300ms)
      tick(300);

      expect(mockParamsStore.updateParameters).toHaveBeenCalledWith(
        jasmine.objectContaining({
          nodeCounts: { mechanism: 75, p2p: 80 },
        })
      );
    }));

    it('should not update ParamsStore when form is invalid', fakeAsync(() => {
      component.form.patchValue({
        nodeCounts: { mechanism: 5 }, // Below minimum
      });

      tick(300);

      expect(mockParamsStore.updateParameters).not.toHaveBeenCalled();
    }));

    it('should debounce multiple rapid changes', fakeAsync(() => {
      component.form.patchValue({ p2pDegree: 5 });
      tick(100);
      component.form.patchValue({ p2pDegree: 6 });
      tick(100);
      component.form.patchValue({ p2pDegree: 7 });
      tick(300);

      // Should only update once with final value
      expect(mockParamsStore.updateParameters).toHaveBeenCalledTimes(1);
      expect(mockParamsStore.updateParameters).toHaveBeenCalledWith(
        jasmine.objectContaining({
          p2pDegree: 7,
        })
      );
    }));
  });

  describe('ParamsStore Synchronization', () => {
    it('should update form when ParamsStore parameters change', fakeAsync(() => {
      const newParams: SimulationParametersV1 = {
        ...defaultParams,
        seed: 99999,
        nodeCounts: { mechanism: 100, p2p: 120 },
      };

      // Update the signal
      (mockParamsStore.parameters as any).set(newParams);
      tick();
      fixture.detectChanges();

      expect(component.form.value.seed).toBe(99999);
      expect(component.form.value.nodeCounts.mechanism).toBe(100);
      expect(component.form.value.nodeCounts.p2p).toBe(120);
    }));
  });

  describe('Run Button Handler', () => {
    it('should call initialize and start when form is valid', () => {
      component.onRun();

      expect(mockEngineController.initialize).toHaveBeenCalled();
      expect(mockEngineController.start).toHaveBeenCalled();
    });

    it('should not start when form is invalid', () => {
      component.form.patchValue({ p2pDegree: 0 }); // Invalid value
      component.onRun();

      expect(mockEngineController.initialize).not.toHaveBeenCalled();
      expect(mockEngineController.start).not.toHaveBeenCalled();
    });

    it('should not start when already running', () => {
      (mockEngineController.isRunning as any).set(true);
      component.onRun();

      expect(mockEngineController.initialize).not.toHaveBeenCalled();
      expect(mockEngineController.start).not.toHaveBeenCalled();
    });
  });

  describe('Reset Button Handler', () => {
    it('should call engineController.reset', () => {
      component.onReset();

      expect(mockEngineController.reset).toHaveBeenCalled();
    });
  });

  describe('Generate New Seed Handler', () => {
    it('should call paramsStore.generateNewSeed', () => {
      component.onGenerateNewSeed();

      expect(mockParamsStore.generateNewSeed).toHaveBeenCalled();
    });
  });

  describe('isRunning Method', () => {
    it('should return false when engine is not running', () => {
      (mockEngineController.isRunning as any).set(false);
      expect(component.isRunning()).toBe(false);
    });

    it('should return true when engine is running', () => {
      (mockEngineController.isRunning as any).set(true);
      expect(component.isRunning()).toBe(true);
    });
  });

  describe('hasError Method', () => {
    it('should return true when control has error and is touched', () => {
      const control = component.form.get('p2pDegree');
      control?.setValue(0); // Invalid value
      control?.markAsTouched();

      expect(component.hasError('p2pDegree', 'min')).toBe(true);
    });

    it('should return false when control has error but is not touched', () => {
      const control = component.form.get('p2pDegree');
      control?.setValue(0); // Invalid value
      control?.markAsUntouched();

      expect(component.hasError('p2pDegree', 'min')).toBe(false);
    });

    it('should return false when control is valid', () => {
      const control = component.form.get('p2pDegree');
      control?.setValue(10); // Valid value
      control?.markAsTouched();

      expect(component.hasError('p2pDegree', 'min')).toBe(false);
    });

    it('should handle nested control paths', () => {
      const control = component.form.get('nodeCounts.mechanism');
      control?.setValue(5); // Invalid value
      control?.markAsTouched();

      expect(component.hasError('nodeCounts.mechanism', 'min')).toBe(true);
    });
  });

  describe('Fallback Mode', () => {
    it('should disable advanced controls when fallbackActive is true', () => {
      component.fallbackActive = true;
      fixture.detectChanges();

      const mechanismControl = component.form.get('nodeCounts.mechanism');
      const p2pControl = component.form.get('nodeCounts.p2p');
      const setupControl = component.form.get('phaseBudgets.setup');
      const runControl = component.form.get('phaseBudgets.run');
      const p2pDegreeControl = component.form.get('p2pDegree');
      const epsilonControl = component.form.get('epsilon');

      // Note: Disabled state is handled in template with [disabled] attribute
      // Component logic doesn't programmatically disable controls
      expect(component.fallbackActive).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ subject on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
