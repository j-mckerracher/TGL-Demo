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
   * Resize observer for responsive canvas sizing
   */
  private resizeObserver: ResizeObserver | null = null;

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

      // Ensure initial sizing happens after layout
      requestAnimationFrame(() => {
        if (this.sceneId) {
          this.threeRenderer.handleResize(this.sceneId);
          this.renderCurrentState();
        }
        // Mark as initialized to enable effect-driven updates
        this.isInitialized.set(true);
      });

      // Set up resize handler
      this.setupResizeObserver();
    } catch (error) {
      console.error('Failed to initialize Three.js scene:', error);
    }
  }

  /**
   * Set up window resize handler
   */
  private setupResizeObserver(): void {
    if (!this.canvasRef?.nativeElement || this.resizeObserver) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (this.sceneId) {
        this.threeRenderer.handleResize(this.sceneId);
        this.renderCurrentState();
      }
    });

    this.resizeObserver.observe(this.canvasRef.nativeElement);
  }

  /**
   * Clean up resources on component destruction
   */
  ngOnDestroy(): void {
    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Destroy the Three.js scene
    if (this.sceneId) {
      this.threeRenderer.destroyScene(this.sceneId);
      this.sceneId = null;
    }

    // Mark as not initialized
    this.isInitialized.set(false);
  }

  /**
   * Immediately render the current network state.
   * Ensures the canvas is never blank while waiting for reactive updates.
   */
  private renderCurrentState(): void {
    if (!this.sceneId) {
      return;
    }

    const state = this.networkType === 'p2p'
      ? this.simulationService.p2pState()
      : this.simulationService.tglState();

    this.threeRenderer.updateScene(this.sceneId, state);
  }

  /**
   * Reset the camera/controls back to the default view for this scene.
   */
  public resetView(): void {
    if (!this.sceneId) {
      return;
    }
    this.threeRenderer.resetView(this.sceneId);
  }
}
