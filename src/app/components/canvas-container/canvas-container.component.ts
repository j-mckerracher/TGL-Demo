import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CanvasContainerComponent provides a reusable wrapper for canvas elements.
 * Accepts a label input and emits the canvas element when ready.
 * Standalone component with OnPush change detection strategy.
 */
@Component({
  selector: 'app-canvas-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-container.component.html',
  styleUrls: ['./canvas-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasContainerComponent implements AfterViewInit {
  /** Label to display above the canvas */
  @Input() label = '';

  /** Event emitted when the canvas element is ready */
  @Output() canvasReady = new EventEmitter<HTMLCanvasElement>();

  /** Reference to the canvas element */
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /**
   * Lifecycle hook called after view initialization.
   * Emits the native canvas element via the canvasReady event.
   */
  ngAfterViewInit(): void {
    if (this.canvasRef?.nativeElement) {
      this.canvasReady.emit(this.canvasRef.nativeElement);
    }
  }
}
