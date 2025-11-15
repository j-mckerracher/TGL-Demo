import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

/**
 * ViewportLabelComponent displays a text label as an overlay on a canvas viewport.
 * Used to identify different network viewports (e.g., "P2P Network", "TGL Network").
 *
 * Standalone component with OnPush change detection for optimal performance.
 * Assumes parent container has position: relative or similar positioning context.
 */
@Component({
  selector: 'app-viewport-label',
  templateUrl: './viewport-label.component.html',
  styleUrls: ['./viewport-label.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewportLabelComponent {
  /**
   * Label text to display in the overlay
   * If empty, the component will not render anything
   */
  @Input() label: string = '';
}
