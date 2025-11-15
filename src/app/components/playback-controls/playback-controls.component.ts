import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationService } from '../../services/animation.service';

/**
 * Standalone component providing playback controls for the simulation animation.
 * Renders Play, Pause, and Reset buttons wired to AnimationService,
 * with visual states reflecting the current playback status.
 * Ensures full keyboard accessibility via native button elements.
 */
@Component({
  selector: 'app-playback-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playback-controls.component.html',
  styleUrls: ['./playback-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaybackControlsComponent {
  /**
   * Injected AnimationService for playback control
   */
  protected readonly animationService = inject(AnimationService);

  /**
   * Expose isPlaying signal for template access
   */
  public readonly isPlaying = this.animationService.isPlaying;

  /**
   * Start animation playback
   */
  public onPlay(): void {
    this.animationService.play();
  }

  /**
   * Pause animation playback
   */
  public onPause(): void {
    this.animationService.pause();
  }

  /**
   * Reset animation to initial state
   */
  public onReset(): void {
    this.animationService.reset();
  }
}
