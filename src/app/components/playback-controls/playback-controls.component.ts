import { Component, ChangeDetectionStrategy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationService } from '../../services/animation.service';

/**
 * Standalone component providing playback controls for the simulation animation.
 * Renders Play, Pause, and Reset buttons wired to AnimationService,
 * with visual states reflecting the current playback status.
 * Ensures full keyboard accessibility via native button elements and keyboard shortcuts.
 *
 * Keyboard shortcuts:
 * - Space: Toggle play/pause
 * - R: Reset simulation
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

  /**
   * Handle keyboard shortcuts for playback controls
   * Space: Toggle play/pause
   * R: Reset simulation
   *
   * @param event Keyboard event
   */
  @HostListener('window:keydown', ['$event'])
  public handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ignore if user is typing in an input, textarea, or select element
    const target = event.target as HTMLElement;
    const tagName = target?.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return;
    }

    // Space key: Toggle play/pause (only if not already handled by button focus)
    if (event.code === 'Space' || event.key === ' ') {
      // Prevent default scroll behavior
      event.preventDefault();

      // Toggle play/pause based on current state
      if (this.isPlaying()) {
        this.onPause();
      } else {
        this.onPlay();
      }
    }

    // R key: Reset simulation
    if (event.code === 'KeyR' || event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.onReset();
    }
  }
}
