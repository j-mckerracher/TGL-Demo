/**
 * LoggerService - Dev-only structured logging with Performance API spans.
 *
 * Outputs structured console logs with context metadata and optional performance
 * timing spans. Logs are only emitted in dev builds and include no PII or
 * persistent data.
 *
 * Version: v1.0
 */

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Context metadata for structured logging.
 */
export interface LogContext {
  /** Module name (e.g., 'engine', 'render', 'ui') */
  module: string;
  /** Event name (e.g., 'stepRound', 'renderFrame', 'reset') */
  event: string;
  /** Session correlation ID */
  runId: string;
  /** Current round index (optional) */
  roundIndex?: number;
  /** Additional context metadata (optional) */
  metadata?: Record<string, unknown>;
}

/**
 * Injectable logger service for dev-only structured logging.
 *
 * Provides structured console logging and Performance API timing spans
 * that are completely disabled in production builds.
 */
@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  /**
   * Session correlation ID.
   * Generated once on service initialization.
   */
  readonly runId: string;

  constructor() {
    this.runId = this.generateRunId();
  }

  /**
   * Generate a unique run ID for session correlation.
   *
   * Uses crypto.randomUUID() if available (modern browsers),
   * falls back to simple random hex string otherwise.
   *
   * @returns A unique session identifier
   */
  generateRunId(): string {
    // Use native crypto.randomUUID() if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback: generate simple random hex string
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Log a structured message with context metadata.
   *
   * No-op in production builds. In dev builds, outputs structured
   * log to console with timestamp and context.
   *
   * @param context - Log context metadata
   * @param message - Log message
   * @param data - Optional additional data to log
   */
  log(context: LogContext, message: string, data?: unknown): void {
    // No-op in production
    if (environment.production) {
      return;
    }

    // Build structured log object
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...context,
      message,
      ...(data !== undefined && { data }),
    };

    // Output structured format to console
    console.log(`[${context.module}:${context.event}] ${message}`, logEntry);
  }

  /**
   * Measure synchronous function execution with Performance API.
   *
   * No-op in production builds. In dev builds, records performance
   * marks and measures that can be inspected in DevTools Performance panel.
   *
   * @param spanName - Name for the performance span
   * @param fn - Synchronous function to measure
   */
  measureSpan(spanName: string, fn: () => void): void {
    // In production, just execute the function
    if (environment.production) {
      fn();
      return;
    }

    // Record performance span in dev
    const startMark = `${spanName}-start`;
    const endMark = `${spanName}-end`;

    performance.mark(startMark);
    fn();
    performance.mark(endMark);
    performance.measure(spanName, startMark, endMark);
  }

  /**
   * Measure asynchronous function execution with Performance API.
   *
   * No-op in production builds. In dev builds, records performance
   * marks and measures that can be inspected in DevTools Performance panel.
   *
   * @param spanName - Name for the performance span
   * @param fn - Asynchronous function to measure
   * @returns Promise that resolves when the function completes
   */
  async measureAsync(spanName: string, fn: () => Promise<void>): Promise<void> {
    // In production, just execute the function
    if (environment.production) {
      await fn();
      return;
    }

    // Record performance span in dev
    const startMark = `${spanName}-start`;
    const endMark = `${spanName}-end`;

    performance.mark(startMark);
    await fn();
    performance.mark(endMark);
    performance.measure(spanName, startMark, endMark);
  }
}
