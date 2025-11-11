/**
 * MechanismCanvas component.
 *
 * Hosts RenderingAdapterV1 for mechanism layer visualization.
 * Features:
 * - Lazy initialization (only on first Run)
 * - Clean disposal on Reset (no memory leaks)
 * - Reduced-motion support (uses renderDiscrete instead of renderFrame)
 * - Compatible with Angular change detection
 */

import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import type { SimulationStateV1 } from 'simulation';
import { createRenderingAdapterV1 } from '../../adapter/rendering_adapter_v1';
import type { RenderingAdapterV1, ThemeV1 } from '../../adapter/types';

@Component({
  selector: 'mechanism-canvas',
  templateUrl: './mechanism-canvas.component.html',
  styleUrls: ['./mechanism-canvas.component.scss'],
  standalone: true,
})
export class MechanismCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  @Input() theme: ThemeV1 = {
    palette: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#1e293b',
      accent: '#f59e0b',
    },
    motion: {
      animationDuration: 300,
      enableTransitions: true,
    },
  };

  @Input() reducedMotion: boolean = false;
  @Input() simulationState$?: Observable<SimulationStateV1>;

  private adapter?: RenderingAdapterV1;
  private stateSubscription?: Subscription;
  private isAdapterInitialized = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // Lazy initialization - do NOT initialize adapter yet
    // Will be initialized on first Run signal via initAdapter()
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  /**
   * Initialize the rendering adapter.
   * Called on first Run signal (lazy initialization).
   */
  initAdapter(): void {
    if (this.isAdapterInitialized || !this.canvasRef) {
      return;
    }

    // Create and initialize adapter
    this.adapter = createRenderingAdapterV1();
    this.adapter.init(this.canvasRef.nativeElement, this.theme);
    this.isAdapterInitialized = true;

    // Subscribe to simulation state if provided
    if (this.simulationState$) {
      this.stateSubscription = this.simulationState$.subscribe((state) => {
        if (this.adapter) {
          this.adapter.syncState(state);

          // Render path selection based on reduced motion preference
          if (this.reducedMotion) {
            this.adapter.renderDiscrete();
          } else {
            this.adapter.renderFrame();
          }
        }
      });
    }
  }

  /**
   * Dispose the rendering adapter and clean up resources.
   * Called on Reset signal.
   */
  dispose(): void {
    // Unsubscribe from state stream
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = undefined;
    }

    // Dispose adapter
    if (this.adapter) {
      this.adapter.dispose();
      this.adapter = undefined;
    }

    this.isAdapterInitialized = false;
  }

  /**
   * Get adapter capabilities (for testing/debugging).
   */
  getCapabilities() {
    return this.adapter?.capabilities();
  }
}
