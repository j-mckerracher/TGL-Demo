import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Legend item interface for displaying node state colors
 */
interface LegendItem {
  label: string;
  color: string;
}

/**
 * LegendComponent displays a visual legend for node states in the network visualization.
 * Shows color swatches with labels matching the ThreeRendererService node color mapping.
 *
 * Standalone component with OnPush change detection for optimal performance.
 */
@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent {
  /**
   * Legend items matching ThreeRendererService color mapping
   * - Waiting (Gray): IDLE/ACTIVE nodes
   * - Receiving (Yellow): Nodes receiving data
   * - Has Data (Green): COMPLETED nodes
   * - Sending (Blue): Nodes sending data
   */
  readonly legendItems: LegendItem[] = [
    { label: 'Waiting', color: '#888888' },
    { label: 'Receiving', color: '#ffff00' },
    { label: 'Has Data', color: '#44ff44' },
    { label: 'Sending', color: '#4444ff' },
  ];
}
