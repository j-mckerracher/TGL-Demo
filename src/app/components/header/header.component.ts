import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * HeaderComponent displays the application title and provides a slot for playback controls.
 * Standalone component with OnPush change detection strategy.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  /** Application title displayed in the header */
  readonly title = 'P2P vs TGL Network Visualization';
}
