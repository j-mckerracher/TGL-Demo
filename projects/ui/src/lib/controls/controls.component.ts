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
      .subscribe((value) => {
        if (this.form.valid) {
          this.formChangeInProgress = true;
          this.parametersChange.emit({
            nodeCounts: value.nodeCounts,
            phaseBudgets: value.phaseBudgets,
            p2pDegree: value.p2pDegree,
            epsilon: value.epsilon,
            reducedMotionEnabled: value.reducedMotionEnabled,
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
   * Handle Run button click.
   */
  onRun(): void {
    if (!this.form.valid || this.isRunning) {
      return;
    }
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
   * Check if form control has error.
   */
  hasError(controlPath: string, errorType: string): boolean {
    const control = this.form.get(controlPath);
    return !!(control?.hasError(errorType) && control?.touched);
  }
}
