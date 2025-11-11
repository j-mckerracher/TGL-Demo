/**
 * Controls Component.
 *
 * Provides Run/Reset buttons and advanced parameter controls with reactive forms.
 * Features:
 * - Form validation with bounds checking
 * - Debounced parameter updates to ParamsStore
 * - Run/Reset integration with EngineController
 * - Fallback mode support (disables advanced controls)
 * - Keyboard-first navigation
 *
 * Version: v1.0
 */

import { Component, Input, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ParamsStore } from '../../../../tgl-results-explorer-web/src/app/state/params.store';
import { EngineController } from '../../../../tgl-results-explorer-web/src/app/state/engine.controller';

@Component({
  selector: 'controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ControlsComponent implements OnInit, OnDestroy {
  @Input() fallbackActive: boolean = false;

  form!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private paramsStore: ParamsStore,
    private engineController: EngineController
  ) {
    // React to parameter store changes
    effect(() => {
      const params = this.paramsStore.parameters();
      if (this.form && !this.formChangeInProgress) {
        this.updateFormFromParams(params);
      }
    });
  }

  private formChangeInProgress = false;

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with validation.
   */
  private initializeForm(): void {
    const params = this.paramsStore.parameters();

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
          this.paramsStore.updateParameters({
            nodeCounts: value.nodeCounts,
            phaseBudgets: value.phaseBudgets,
            p2pDegree: value.p2pDegree,
            epsilon: value.epsilon,
            reducedMotionEnabled: value.reducedMotionEnabled,
          });
          this.formChangeInProgress = false;
        }
      });
  }

  /**
   * Update form from parameter store (without triggering change events).
   */
  private updateFormFromParams(params: any): void {
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
    if (!this.form.valid || this.isRunning()) {
      return;
    }

    this.engineController.initialize();
    this.engineController.start();
  }

  /**
   * Handle Reset button click.
   */
  onReset(): void {
    this.engineController.reset();
  }

  /**
   * Handle Generate New Seed button click.
   */
  onGenerateNewSeed(): void {
    this.paramsStore.generateNewSeed();
  }

  /**
   * Get isRunning signal from engine controller.
   */
  isRunning(): boolean {
    return this.engineController.isRunning();
  }

  /**
   * Check if form control has error.
   */
  hasError(controlPath: string, errorType: string): boolean {
    const control = this.form.get(controlPath);
    return !!(control?.hasError(errorType) && control?.touched);
  }
}
