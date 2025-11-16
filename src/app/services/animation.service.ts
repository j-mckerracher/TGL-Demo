import { Injectable, NgZone, inject, signal } from '@angular/core';
import { SimulationService } from './simulation.service';
import { SettingsService } from './settings.service';

/**
 * Service that orchestrates the animation loop using requestAnimationFrame.
 * Manages play/pause/reset controls and drives simulation updates at 60fps.
 * Automatically pauses when both P2P and TGL simulations reach 100% coverage.
 */
@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  private readonly ngZone = inject(NgZone);
  private readonly simulationService = inject(SimulationService);
  private readonly settingsService = inject(SettingsService);

  /**
   * Internal writable signal for animation playing state.
   */
  private readonly _isPlaying = signal(false);

  /**
   * Public readonly accessor for animation playing state.
   */
  public readonly isPlaying = this._isPlaying.asReadonly();

  /**
   * RAF handle for cancellation.
   */
  private rafHandle: number | null = null;

  /**
   * Last timestamp from RAF callback (in milliseconds).
   */
  private lastTimestamp: number | null = null;

  /**
   * Accumulated elapsed time since the last P2P round advanced.
   */
  private p2pRoundAccumulator = 0;

  /**
   * Accumulated elapsed time since the last TGL stage advanced.
   */
  private tglStageAccumulator = 0;

  /**
   * Starts the animation loop.
   * Uses requestAnimationFrame outside Angular zone for performance.
   * Each frame updates both P2P and TGL simulations with delta time.
   */
  public play(): void {
    if (this._isPlaying()) {
      return; // Already playing
    }

    // Ensure networks are initialized before starting playback
    if (this.simulationService.p2pState().nodes.length === 0 || this.simulationService.tglState().nodes.length === 0) {
      this.simulationService.initializeNetworksFromSettings();
    }

    this._isPlaying.set(true);
    this.lastTimestamp = null; // Reset timestamp for fresh start
    // Seed accumulators so first round/stage kicks off immediately
    const initialDelay = this.settingsService.roundDelay();
    this.p2pRoundAccumulator = initialDelay;
    this.tglStageAccumulator = initialDelay;

    // Start RAF loop outside Angular zone to avoid triggering change detection on every frame
    this.ngZone.runOutsideAngular(() => {
      this.animationLoop(performance.now());
    });
  }

  /**
   * Pauses the animation loop.
   * Cancels any pending RAF and stops simulation updates.
   */
  public pause(): void {
    if (!this._isPlaying()) {
      return; // Already paused
    }

    this._isPlaying.set(false);

    // Cancel pending RAF
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }

    this.lastTimestamp = null;
  }

  /**
   * Resets the simulation to initial state.
   * Pauses the animation loop and resets both P2P and TGL networks.
   */
  public reset(): void {
    // Pause animation first
    this.pause();

    // Reset simulation state
    this.simulationService.reset();
    this.simulationService.initializeNetworksFromSettings();

    // Reset timing state
    this.lastTimestamp = null;
    this.p2pRoundAccumulator = 0;
    this.tglStageAccumulator = 0;
  }

  /**
   * Toggles between play and pause states.
   */
  public togglePlayPause(): void {
    if (this._isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Animation loop callback.
   * Computes delta time, reads speed settings, and updates simulations.
   * Auto-pauses when both P2P and TGL are complete.
   *
   * @param timestamp - Current timestamp from RAF (in milliseconds)
   */
  private animationLoop(timestamp: number): void {
    // Check if we should stop (user paused or external condition)
    if (!this._isPlaying()) {
      return;
    }

    // Calculate delta time
    let deltaTime = 0;
    if (this.lastTimestamp !== null) {
      deltaTime = timestamp - this.lastTimestamp;
    }
    this.lastTimestamp = timestamp;

    // Get current animation speed multiplier
    const speed = this.settingsService.animationSpeed();

    // Apply speed multiplier to delta time
    const adjustedDelta = deltaTime * speed;

    // Update transfer animations first so newly completed transfers are removed before scheduling next rounds
    this.simulationService.updateP2pTransfers(adjustedDelta);
    this.simulationService.updateTglTransfers(adjustedDelta);

    // Track elapsed time for scheduling next round/stage
    this.p2pRoundAccumulator += adjustedDelta;
    this.tglStageAccumulator += adjustedDelta;

    this.maybeAdvanceP2pRound();
    this.maybeAdvanceTglStage();

    // Check if both simulations are complete
    const p2pComplete = this.simulationService.p2pState().isComplete;
    const tglComplete = this.simulationService.tglState().isComplete;

    if (p2pComplete && tglComplete) {
      // Both simulations are complete, auto-pause
      this.ngZone.run(() => {
        this.pause();
      });
      return;
    }

    // Schedule next frame
    this.rafHandle = requestAnimationFrame((ts) => this.animationLoop(ts));
  }

  /**
   * Advance the P2P simulation by one round if enough time has elapsed
   * and there are no active transfers in-flight.
   */
  private maybeAdvanceP2pRound(): void {
    const state = this.simulationService.p2pState();
    if (state.isComplete || state.transfers.length > 0) {
      return;
    }

    const delay = this.settingsService.roundDelay();
    if (this.p2pRoundAccumulator < delay) {
      return;
    }

    this.simulationService.stepP2pRound();
    this.p2pRoundAccumulator = 0;
  }

  /**
   * Advance the TGL simulation to the next stage when the current transfers
   * have completed and the configured delay has elapsed.
   */
  private maybeAdvanceTglStage(): void {
    const state = this.simulationService.tglState();
    if (state.isComplete || state.transfers.length > 0) {
      return;
    }

    const delay = this.settingsService.roundDelay();
    if (this.tglStageAccumulator < delay) {
      return;
    }

    this.simulationService.stepTglRound();
    this.tglStageAccumulator = 0;
  }
}
