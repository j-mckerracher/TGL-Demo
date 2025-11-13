/**
 * P2PCanvas component.
 *
 * Hosts RenderingAdapterV1 for peer-to-peer layer visualization.
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
  selector: 'p2p-canvas',
  templateUrl: './p2p-canvas.component.html',
  styleUrls: ['./p2p-canvas.component.scss'],
  standalone: true,
})
export class P2PCanvasComponent implements AfterViewInit, OnDestroy {
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
    console.log('[P2PCanvas] initAdapter() called - isAdapterInitialized:', this.isAdapterInitialized, 'canvasRef:', !!this.canvasRef);

    if (this.isAdapterInitialized || !this.canvasRef) {
      console.log('[P2PCanvas] initAdapter() - SKIPPED (already initialized or no canvas ref)');
      return;
    }

    // Create and initialize adapter
    console.log('[P2PCanvas] Creating adapter and initializing with canvas');
    this.adapter = createRenderingAdapterV1();
    this.adapter.init(this.canvasRef.nativeElement, this.theme);
    this.isAdapterInitialized = true;
    console.log('[P2PCanvas] Adapter initialized');

    // Subscribe to simulation state if provided
    if (this.simulationState$) {
      console.log('[P2PCanvas] Subscribing to simulationState$ stream');
      this.stateSubscription = this.simulationState$.subscribe((state) => {
        console.log('[P2PCanvas] Received state:', state);
        if (this.adapter) {
          this.adapter.syncState(state);

          // Render path selection based on reduced motion preference
          if (this.reducedMotion) {
            console.log('[P2PCanvas] Calling renderDiscrete()');
            this.adapter.renderDiscrete();
          } else {
            console.log('[P2PCanvas] Calling renderFrame()');
            this.adapter.renderFrame();
          }
        }
      });
    } else {
      console.log('[P2PCanvas] simulationState$ is NOT provided!');
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
