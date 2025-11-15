import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { NetworkMetricCardComponent } from '../network-metric-card/network-metric-card.component';
import { SimulationService } from '../../services/simulation.service';

/**
 * Container component that displays six metric cards for P2P and TGL simulations.
 * Shows rounds, messages, and time metrics for each protocol.
 */
@Component({
  selector: 'app-metrics-panel',
  templateUrl: './metrics-panel.component.html',
  styleUrls: ['./metrics-panel.component.css'],
  standalone: true,
  imports: [NetworkMetricCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPanelComponent {
  private readonly simulationService = inject(SimulationService);

  /** P2P network state signal */
  readonly p2pState = this.simulationService.p2pState;

  /** TGL network state signal */
  readonly tglState = this.simulationService.tglState;

  /** P2P rounds metric */
  readonly p2pRounds = computed(() => this.p2pState().round);

  /** P2P messages metric */
  readonly p2pMessages = computed(() => this.p2pState().totalMessagesSent);

  /** P2P time metric (in milliseconds) */
  readonly p2pTime = computed(() => {
    const state = this.p2pState();
    if (!state.startTime) return null;
    const endTime = state.endTime ?? Date.now();
    return endTime - state.startTime;
  });

  /** TGL rounds metric */
  readonly tglRounds = computed(() => this.tglState().round);

  /** TGL messages metric */
  readonly tglMessages = computed(() => this.tglState().totalMessagesSent);

  /** TGL time metric (in milliseconds) */
  readonly tglTime = computed(() => {
    const state = this.tglState();
    if (!state.startTime) return null;
    const endTime = state.endTime ?? Date.now();
    return endTime - state.startTime;
  });
}
