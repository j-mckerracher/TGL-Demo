/**
 * StatusBannerComponent - Displays app status and errors with reset capability.
 *
 * Shows success, warning, and error states with appropriate styling.
 * Provides Reset button for error states to restore app to idle state.
 *
 * Version: v1.0
 */

import { Component, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorService, StatusState } from './error.service';
import { EngineController } from '../state/engine.controller';

/**
 * Status banner component.
 *
 * Displays current app status and provides reset functionality.
 */
@Component({
  selector: 'app-status-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-banner.component.html',
  styleUrls: ['./status-banner.component.scss'],
})
export class StatusBannerComponent {
  /**
   * Current status state signal.
   */
  readonly status: Signal<StatusState>;

  /**
   * Computed CSS class for status styling.
   */
  readonly statusClass: Signal<string>;

  constructor(
    private errorService: ErrorService,
    private engineController: EngineController
  ) {
    this.status = this.errorService.statusSignal;

    // Compute CSS class based on status
    this.statusClass = computed(() => {
      return `status-${this.status().status}`;
    });
  }

  /**
   * Handle reset button click.
   *
   * Resets both engine and error states. Idempotent.
   */
  onReset(): void {
    this.engineController.reset();
    this.errorService.reset();
  }
}
