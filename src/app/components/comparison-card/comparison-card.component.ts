import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { MetricsService } from '../../services/metrics.service';

/**
 * Component that displays comparison metrics between TGL and P2P protocols.
 * Shows message reduction, speed gain, and efficiency gain percentages.
 * Displays metrics only after both simulations complete, with visual indicators
 * for positive (green) and negative (red) values.
 */
@Component({
  selector: 'app-comparison-card',
  templateUrl: './comparison-card.component.html',
  styleUrls: ['./comparison-card.component.css'],
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonCardComponent {
  private readonly metricsService = inject(MetricsService);

  /** Readonly comparison data signal from MetricsService */
  readonly comparison = this.metricsService.comparison;

  /** Whether both simulations have completed */
  readonly bothComplete = this.metricsService.bothComplete;

  /** Message reduction percentage (positive = TGL better) */
  readonly messageReduction = this.metricsService.messageReduction;

  /** Speed gain percentage (positive = TGL faster) */
  readonly speedGain = this.metricsService.speedGain;

  /** Efficiency gain percentage (positive = TGL more efficient) */
  readonly efficiencyGain = this.metricsService.efficiencyGain;

  /**
   * Computed signal that returns the CSS class for a metric value.
   * Positive values get 'positive' class (green), negative get 'negative' class (red).
   */
  getMetricClass = (value: number | null): string => {
    if (value === null) return '';
    return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  };

  /**
   * Formats a percentage value for display.
   * Returns formatted string with sign and percentage symbol.
   */
  formatPercentage = (value: number | null): string => {
    if (value === null) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };
}
