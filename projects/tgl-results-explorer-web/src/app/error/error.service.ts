/**
 * ErrorService - Centralized error state management and user-friendly message mapping.
 *
 * Maps internal error codes to user-friendly messages and maintains app status state.
 * Supports error, warning, success, and idle states.
 *
 * Version: v1.0
 */

import { Injectable, signal, WritableSignal } from '@angular/core';

/**
 * Error taxonomy for the application.
 */
export enum ErrorCode {
  SIM_INVALID_PARAMS = 'SIM_INVALID_PARAMS',
  SIM_NON_CONVERGENCE = 'SIM_NON_CONVERGENCE',
  RENDER_INIT_FAILED = 'RENDER_INIT_FAILED',
  FALLBACK_ACTIVE = 'FALLBACK_ACTIVE',
}

/**
 * Application status type.
 */
export type AppStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';

/**
 * Status state interface.
 */
export interface StatusState {
  status: AppStatus;
  message: string;
  errorCode?: ErrorCode;
}

/**
 * Injectable error service.
 *
 * Manages app-wide status and error state reactively via signals.
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  /**
   * Signal tracking current status state.
   */
  readonly statusSignal: WritableSignal<StatusState> = signal<StatusState>({
    status: 'idle',
    message: '',
  });

  /**
   * Set error status with error code and optional custom message.
   *
   * @param code - Error code
   * @param message - Optional custom message (defaults to mapped message)
   */
  setError(code: ErrorCode, message?: string): void {
    this.statusSignal.set({
      status: 'error',
      message: message ?? this.getErrorMessage(code),
      errorCode: code,
    });
  }

  /**
   * Set warning status with message.
   *
   * @param message - Warning message
   */
  setWarning(message: string): void {
    this.statusSignal.set({
      status: 'warning',
      message,
    });
  }

  /**
   * Set success status with message.
   *
   * @param message - Success message
   */
  setSuccess(message: string): void {
    this.statusSignal.set({
      status: 'success',
      message,
    });
  }

  /**
   * Reset status to idle state.
   *
   * Idempotent: safe to call multiple times.
   */
  reset(): void {
    this.statusSignal.set({
      status: 'idle',
      message: '',
    });
  }

  /**
   * Get user-friendly message for error code.
   *
   * @param code - Error code
   * @returns User-friendly error message
   */
  getErrorMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.SIM_INVALID_PARAMS]:
        'Invalid simulation parameters. Please check values and try again.',
      [ErrorCode.SIM_NON_CONVERGENCE]:
        'Simulation did not converge within budget. Try adjusting parameters.',
      [ErrorCode.RENDER_INIT_FAILED]:
        'Graphics initialization failed. Please refresh and try again.',
      [ErrorCode.FALLBACK_ACTIVE]:
        'WebGL not available; displaying simplified preview.',
    };

    return messages[code];
  }
}
