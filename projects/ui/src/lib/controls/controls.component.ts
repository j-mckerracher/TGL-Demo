/**
 * Controls Component.
 *
 * Provides Run/Reset buttons and advanced parameter controls with reactive forms.
 * Features:
 * - Form validation with bounds checking
 * - Debounced parameter updates via outputs
 * - Run/Reset integration via outputs
 * - Fallback mode support (disables advanced controls)
 * - Keyboard-first navigation
 *
 * Version: v1.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

/**
 * Simulation parameters interface (subset needed for controls)
 */
export interface ControlsParameters {
  seed: number;
  nodeCounts: {
    mechanism: number;
    p2p: number;
  };
  phaseBudgets: {
    setup: number;
    run: number;
  };
  p2pDegree: number;
  epsilon: number;
  reducedMotionEnabled: boolean;
}

@Component({
  selector: 'controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ControlsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() fallbackActive: boolean = false;
  @Input() isRunning: boolean = false;
  @Input() parameters?: ControlsParameters;

  @Output() parametersChange = new EventEmitter<Partial<ControlsParameters>>();
  @Output() run = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() generateNewSeed = new EventEmitter<void>();

  form!: FormGroup;
  private destroy$ = new Subject<void>();
  private formChangeInProgress = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.updateControlStates();
    this.setupFormValueChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update form when parameters input changes
    if (changes['parameters'] && !changes['parameters'].firstChange && this.form) {
      const params = changes['parameters'].currentValue;
      if (params && !this.formChangeInProgress) {
        this.updateFormFromParams(params);
      }
    }

    if ((changes['fallbackActive'] || changes['isRunning']) && this.form) {
      this.updateControlStates();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with validation.
   */
  private initializeForm(): void {
    const params = this.parameters || {
      seed: 12345,
      nodeCounts: { mechanism: 100, p2p: 100 },
      phaseBudgets: { setup: 10, run: 100 },
      p2pDegree: 4,
      epsilon: 0.01,
      reducedMotionEnabled: false,
    };

    this.form = this.fb.group({
      seed: [{ value: params.seed, disabled: true }], // Read-only
      nodeCounts: this.fb.group({
        mechanism: [
          params.nodeCounts.mechanism,
          [Validators.required, Validators.min(10), Validators.max(200)],
        ],
        p2p: [
          params.nodeCounts.p2p,
          [Validators.required, Validators.min(10), Validators.max(200)],
        ],
      }),
      phaseBudgets: this.fb.group({
        setup: [
          params.phaseBudgets.setup,
          [Validators.required, Validators.min(1), Validators.max(100)],
        ],
        run: [
          params.phaseBudgets.run,
          [Validators.required, Validators.min(1), Validators.max(1000)],
        ],
      }),
      p2pDegree: [
        params.p2pDegree,
        [Validators.required, Validators.min(1), Validators.max(20)],
      ],
      epsilon: [
        params.epsilon,
        [Validators.required, Validators.min(0.001), Validators.max(0.5)],
      ],
      reducedMotionEnabled: [params.reducedMotionEnabled],
    });
  }

  /**
   * Setup debounced form value changes.
   */
  private setupFormValueChanges(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.form.valid) {
          const rawValue = this.form.getRawValue();
          this.formChangeInProgress = true;
          this.parametersChange.emit({
            nodeCounts: rawValue.nodeCounts,
            phaseBudgets: rawValue.phaseBudgets,
            p2pDegree: rawValue.p2pDegree,
            epsilon: rawValue.epsilon,
            reducedMotionEnabled: rawValue.reducedMotionEnabled,
          });
          // Small delay to prevent immediate re-update
          setTimeout(() => {
            this.formChangeInProgress = false;
          }, 50);
        }
      });
  }

  /**
   * Update form from parameters (without triggering change events).
   */
  private updateFormFromParams(params: ControlsParameters): void {
    this.form.patchValue(
      {
        seed: params.seed,
        nodeCounts: params.nodeCounts,
        phaseBudgets: params.phaseBudgets,
        p2pDegree: params.p2pDegree,
        epsilon: params.epsilon,
        reducedMotionEnabled: params.reducedMotionEnabled,
      },
      { emitEvent: false }
    );
  }

  /**
   * Check if form data is valid (ignoring disabled state).
   * Disabled controls shouldn't affect validity for the Run button.
   */
  isFormDataValid(): boolean {
    // Get all form values including disabled ones
    const rawValue = this.form.getRawValue();

    // Check if all enabled controls have valid values
    const nodeCounts = this.form.get('nodeCounts');
    const phaseBudgets = this.form.get('phaseBudgets');
    const p2pDegree = this.form.get('p2pDegree');
    const epsilon = this.form.get('epsilon');

    // If a control is disabled, don't check its validity
    const nodeCountsValid = !nodeCounts?.enabled || nodeCounts.valid;
    const phaseBudgetsValid = !phaseBudgets?.enabled || phaseBudgets.valid;
    const p2pDegreeValid = !p2pDegree?.enabled || p2pDegree.valid;
    const epsilonValid = !epsilon?.enabled || epsilon.valid;

    const isValid = nodeCountsValid && phaseBudgetsValid && p2pDegreeValid && epsilonValid;
    console.log('[Controls] isFormDataValid() result:', isValid, {
      nodeCountsValid,
      phaseBudgetsValid,
      p2pDegreeValid,
      epsilonValid,
    });
    return isValid;
  }

  /**
   * Handle Run button click.
   */
  onRun(): void {
    console.log('[Controls] onRun() called - isFormDataValid:', this.isFormDataValid(), 'isRunning:', this.isRunning);
    if (!this.isFormDataValid() || this.isRunning) {
      console.log('[Controls] onRun() - BLOCKED: validation failed or already running');
      return;
    }
    console.log('[Controls] onRun() - EMITTING run event');
    this.run.emit();
  }

  /**
   * Handle Reset button click.
   */
  onReset(): void {
    this.reset.emit();
  }

  /**
   * Handle Generate New Seed button click.
   */
  onGenerateNewSeed(): void {
    this.generateNewSeed.emit();
  }

  /**
   * Enable or disable form controls based on component inputs.
   */
  private updateControlStates(): void {
    if (!this.form) {
      return;
    }

    const disableAdvancedControls = this.fallbackActive || this.isRunning;

    this.toggleControlState('nodeCounts', disableAdvancedControls);
    this.toggleControlState('phaseBudgets', disableAdvancedControls);
    this.toggleControlState('p2pDegree', disableAdvancedControls);
    this.toggleControlState('epsilon', disableAdvancedControls);

    this.toggleControlState('reducedMotionEnabled', this.isRunning);
  }

  /**
   * Helper to enable/disable a control without emitting events.
   */
  private toggleControlState(controlPath: string, disable: boolean): void {
    const control = this.form.get(controlPath);
    if (!control) {
      return;
    }

    if (disable && control.enabled) {
      control.disable({ emitEvent: false });
    } else if (!disable && control.disabled) {
      control.enable({ emitEvent: false });
    }
  }

  /**
   * Check if form control has error.
   */
  hasError(controlPath: string, errorType: string): boolean {
    const control = this.form.get(controlPath);
    return !!(control?.hasError(errorType) && control?.touched);
  }
}
