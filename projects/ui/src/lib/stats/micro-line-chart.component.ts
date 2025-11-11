/**
 * MicroLineChart Component.
 *
 * Lightweight Canvas2D-based line chart for displaying simulation statistics.
 * Features:
 * - Custom rendering without external dependencies
 * - Throttled redraw (~15 fps) via aggregator
 * - Multiple series support
 * - Responsive canvas sizing
 *
 * Version: v1.0
 */

import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import type { ChartSeries } from './stats-aggregator.service';

@Component({
  selector: 'micro-line-chart',
  templateUrl: './micro-line-chart.component.html',
  styleUrls: ['./micro-line-chart.component.scss'],
  standalone: true,
})
export class MicroLineChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('chartCanvas', { static: false })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  @Input() series: ChartSeries[] = [];
  @Input() width: number = 400;
  @Input() height: number = 200;

  private ctx?: CanvasRenderingContext2D;

  ngAfterViewInit(): void {
    if (this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      const context = canvas.getContext('2d');
      if (context) {
        this.ctx = context;
        this.redrawChart();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series'] && this.ctx) {
      this.redrawChart();
    }
  }

  /**
   * Redraw the entire chart.
   *
   * Clears canvas, draws axes and grid, then renders all series.
   */
  redrawChart(): void {
    if (!this.ctx || !this.canvasRef) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Skip rendering if no series
    if (!this.series || this.series.length === 0) {
      this.drawPlaceholder(ctx, canvas);
      return;
    }

    // Calculate bounds
    const bounds = this.calculateBounds();
    if (!bounds) {
      return;
    }

    // Draw grid
    this.drawGrid(ctx, canvas, bounds);

    // Draw each series
    for (const s of this.series) {
      this.drawSeries(ctx, canvas, s, bounds);
    }

    // Draw legend
    this.drawLegend(ctx, canvas);
  }

  /**
   * Calculate data bounds for scaling.
   */
  private calculateBounds() {
    if (!this.series || this.series.length === 0) {
      return null;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const s of this.series) {
      for (const point of s.points) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    }

    // Add padding
    const yPadding = (maxY - minY) * 0.1 || 0.1;
    minY -= yPadding;
    maxY += yPadding;

    return { minX, maxX, minY, maxY };
  }

  /**
   * Draw grid lines.
   */
  private drawGrid(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): void {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines (5 lines)
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height - 40) * (i / 4) + 20;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(canvas.width - 10, y);
      ctx.stroke();
    }

    // Vertical grid lines (5 lines)
    for (let i = 0; i <= 4; i++) {
      const x = 40 + (canvas.width - 50) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, canvas.height - 20);
      ctx.stroke();
    }
  }

  /**
   * Draw a single series.
   */
  private drawSeries(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    series: ChartSeries,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): void {
    if (series.points.length === 0) {
      return;
    }

    ctx.strokeStyle = series.color || '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    for (const point of series.points) {
      const x = this.scaleX(point.x, bounds, canvas);
      const y = this.scaleY(point.y, bounds, canvas);

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  /**
   * Scale X coordinate to canvas.
   */
  private scaleX(
    x: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    canvas: HTMLCanvasElement
  ): number {
    const range = bounds.maxX - bounds.minX || 1;
    const normalized = (x - bounds.minX) / range;
    return 40 + normalized * (canvas.width - 50);
  }

  /**
   * Scale Y coordinate to canvas (inverted for canvas coordinates).
   */
  private scaleY(
    y: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    canvas: HTMLCanvasElement
  ): number {
    const range = bounds.maxY - bounds.minY || 1;
    const normalized = (y - bounds.minY) / range;
    return canvas.height - 20 - normalized * (canvas.height - 40);
  }

  /**
   * Draw legend.
   */
  private drawLegend(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ): void {
    let x = 50;
    const y = 12;

    ctx.font = '12px sans-serif';

    for (const s of this.series) {
      // Draw color box
      ctx.fillStyle = s.color || '#3b82f6';
      ctx.fillRect(x, y - 8, 10, 10);

      // Draw label
      ctx.fillStyle = '#374151';
      ctx.fillText(s.label, x + 15, y);

      x += ctx.measureText(s.label).width + 35;
    }
  }

  /**
   * Draw placeholder when no data.
   */
  private drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ): void {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
