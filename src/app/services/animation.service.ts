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
   * Starts the animation loop.
   * Uses requestAnimationFrame outside Angular zone for performance.
   * Each frame updates both P2P and TGL simulations with delta time.
   */
  public play(): void {
    if (this._isPlaying()) {
      return; // Already playing
    }

    this._isPlaying.set(true);
    this.lastTimestamp = null; // Reset timestamp for fresh start

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
    // Note: SimulationService.reset() resets internal state
    // We need to reinitialize both networks
    this.simulationService.reset();
    this.simulationService.initializeP2pNetwork();
    this.simulationService.initializeTglNetwork();

    // Reset timing state
    this.lastTimestamp = null;
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

    // Update P2P transfers
    this.simulationService.updateP2pTransfers(adjustedDelta);

    // Update TGL transfers
    this.simulationService.updateTglTransfers(adjustedDelta);

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
}
