import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  signal,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ThreeRendererService } from '../../services/three-renderer.service';
import { SimulationService } from '../../services/simulation.service';

/**
 * NetworkCanvasComponent hosts a canvas element for rendering P2P or TGL network visualizations.
 * Integrates with ThreeRendererService and reacts to network state changes.
 */
@Component({
  selector: 'app-network-canvas',
  standalone: true,
  templateUrl: './network-canvas.component.html',
  styleUrls: ['./network-canvas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkCanvasComponent implements AfterViewInit, OnDestroy {
  /**
   * Network type to render (p2p or tgl)
   */
  @Input({ required: true }) networkType!: 'p2p' | 'tgl';

  /**
   * Reference to the canvas element
   */
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /**
   * Injected services
   */
  private readonly threeRenderer = inject(ThreeRendererService);
  private readonly simulationService = inject(SimulationService);

  /**
   * Scene ID returned by ThreeRendererService
   */
  private sceneId: string | null = null;

  /**
   * Resize event subscription
   */
  private resizeSubscription: Subscription | null = null;

  /**
   * Signal to track if the component is initialized
   */
  private readonly isInitialized = signal(false);

  constructor() {
    // Set up effect to update scene when network state changes
    effect(() => {
      // Guard against uninitialized scene
      if (!this.isInitialized() || !this.sceneId) {
        return;
      }

      // Get the appropriate network state based on networkType
      const state = this.networkType === 'p2p'
        ? this.simulationService.p2pState()
        : this.simulationService.tglState();

      // Update the scene with the current state
      this.threeRenderer.updateScene(this.sceneId, state);
    });
  }

  /**
   * Initialize the Three.js scene after view is ready
   */
  ngAfterViewInit(): void {
    // Ensure canvas is available
    if (!this.canvasRef?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    try {
      // Create the scene and store the scene ID
      this.sceneId = this.threeRenderer.createScene(
        this.canvasRef.nativeElement,
        this.networkType
      );

      // Mark as initialized to enable effect
      this.isInitialized.set(true);

      // Set up resize handler
      this.setupResizeHandler();
    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
    }
  }

  /**
   * Set up window resize handler
   */
  private setupResizeHandler(): void {
    // Listen to window resize events with debounce
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        if (this.sceneId) {
          this.threeRenderer.handleResize(this.sceneId);
        }
      });
  }

  /**
   * Clean up resources on component destruction
   */
  ngOnDestroy(): void {
    // Unsubscribe from resize events
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
      this.resizeSubscription = null;
    }

    // Destroy the Three.js scene
    if (this.sceneId) {
      this.threeRenderer.destroyScene(this.sceneId);
      this.sceneId = null;
    }

    // Mark as not initialized
    this.isInitialized.set(false);
  }
}
