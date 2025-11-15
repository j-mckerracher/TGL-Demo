import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Reusable card component for displaying a single network metric.
 * Accepts label, value, and optional unit as inputs.
 */
@Component({
  selector: 'app-network-metric-card',
  templateUrl: './network-metric-card.component.html',
  styleUrls: ['./network-metric-card.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkMetricCardComponent {
  /** The display label for this metric */
  readonly label = input.required<string>();

  /** The metric value to display */
  readonly value = input.required<number | string | null>();

  /** Optional unit suffix (e.g., "ms", "%", "msgs") */
  readonly unit = input<string | undefined>(undefined);
}
