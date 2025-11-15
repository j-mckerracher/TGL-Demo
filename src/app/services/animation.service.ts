import { Injectable, signal } from '@angular/core';

/**
 * Service for managing animation playback state and controls.
 * This is a stub implementation - full implementation in a later UoW.
 */
@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  /**
   * Signal indicating whether animation is currently playing
   */
  public readonly isPlaying = signal<boolean>(false);

  /**
   * Start or resume animation playback
   */
  public play(): void {
    this.isPlaying.set(true);
  }

  /**
   * Pause animation playback
   */
  public pause(): void {
    this.isPlaying.set(false);
  }

  /**
   * Reset animation to initial state and pause
   */
  public reset(): void {
    this.isPlaying.set(false);
    // Full reset logic will be implemented in later UoW
  }
}
