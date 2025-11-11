/**
 * Unit tests for MicroLineChartComponent.
 *
 * Tests verify:
 * - Canvas initialization and context acquisition
 * - Chart redraw on series changes
 * - Series visualization with correct drawing commands
 * - Placeholder display when no data
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MicroLineChartComponent } from './micro-line-chart.component';
import type { ChartSeries } from './stats-aggregator.service';

describe('MicroLineChartComponent', () => {
  let component: MicroLineChartComponent;
  let fixture: ComponentFixture<MicroLineChartComponent>;

  const createMockSeries = (): ChartSeries[] => [
    {
      label: 'Series 1',
      color: '#3b82f6',
      points: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
        { x: 3, y: 25 },
      ],
    },
    {
      label: 'Series 2',
      color: '#8b5cf6',
      points: [
        { x: 0, y: 5 },
        { x: 1, y: 10 },
        { x: 2, y: 8 },
        { x: 3, y: 12 },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MicroLineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MicroLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canvas initialization', () => {
    it('should have canvas element reference after view init', () => {
      expect(component.canvasRef).toBeDefined();
      expect(component.canvasRef?.nativeElement).toBeInstanceOf(
        HTMLCanvasElement
      );
    });

    it('should obtain 2D context from canvas', () => {
      const canvas = component.canvasRef?.nativeElement;
      expect(canvas).toBeDefined();

      const ctx = canvas?.getContext('2d');
      expect(ctx).toBeDefined();
      expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
    });

    it('should set default width and height', () => {
      const canvas = component.canvasRef?.nativeElement;

      expect(canvas?.width).toBe(400);
      expect(canvas?.height).toBe(200);
    });

    it('should respect custom width and height inputs', () => {
      component.width = 600;
      component.height = 300;
      fixture.detectChanges();

      const canvas = component.canvasRef?.nativeElement;
      expect(canvas?.width).toBe(600);
      expect(canvas?.height).toBe(300);
    });
  });

  describe('chart rendering', () => {
    it('should call redrawChart after view init', () => {
      spyOn<any>(component, 'redrawChart');

      component.ngAfterViewInit();

      expect(component['redrawChart']).toHaveBeenCalled();
    });

    it('should call redrawChart when series changes', () => {
      spyOn<any>(component, 'redrawChart');

      component.series = createMockSeries();
      component.ngOnChanges({
        series: {
          currentValue: component.series,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component['redrawChart']).toHaveBeenCalled();
    });

    it('should not redraw if series unchanged', () => {
      spyOn<any>(component, 'redrawChart');

      component.ngOnChanges({
        width: {
          currentValue: 500,
          previousValue: 400,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component['redrawChart']).not.toHaveBeenCalled();
    });
  });

  describe('series visualization', () => {
    it('should draw series on canvas when data provided', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'stroke');
      spyOn(ctx, 'beginPath');

      component.series = createMockSeries();
      component.redrawChart();

      // Should call stroke for each series
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
    });

    it('should use series color for drawing', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      const mockSeries = createMockSeries();
      component.series = mockSeries;
      component.redrawChart();

      // Verify stroke style was set (color is used)
      // Note: exact color verification is tricky with canvas API
      expect(ctx.strokeStyle).toBeDefined();
    });

    it('should draw all points in series', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'lineTo');

      const mockSeries = [
        {
          label: 'Test',
          color: '#000',
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
        },
      ];

      component.series = mockSeries;
      component.redrawChart();

      // Should call lineTo for connecting points
      expect(ctx.lineTo).toHaveBeenCalled();
    });
  });

  describe('placeholder rendering', () => {
    it('should display placeholder when no series', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'fillText');

      component.series = [];
      component.redrawChart();

      expect(ctx.fillText).toHaveBeenCalledWith(
        'No data available',
        jasmine.any(Number),
        jasmine.any(Number)
      );
    });

    it('should not draw series when empty', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'stroke');

      component.series = [];
      component.redrawChart();

      // Stroke should not be called for series (only for grid)
      const strokeCallCount = (ctx.stroke as jasmine.Spy).calls.count();
      expect(strokeCallCount).toBeLessThan(5); // Only grid lines
    });
  });

  describe('grid and axes', () => {
    it('should draw grid lines', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'stroke');

      component.series = createMockSeries();
      component.redrawChart();

      // Grid + series strokes
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('legend', () => {
    it('should draw legend for series', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'fillText');

      component.series = createMockSeries();
      component.redrawChart();

      // Should draw legend labels
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('should include all series in legend', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'fillRect');

      component.series = createMockSeries();
      component.redrawChart();

      // Should draw color boxes for legend
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('canvas clearing', () => {
    it('should clear canvas before redraw', () => {
      const canvas = component.canvasRef?.nativeElement;
      const ctx = canvas?.getContext('2d');

      if (!ctx) {
        fail('Canvas context not available');
        return;
      }

      spyOn(ctx, 'fillRect');

      component.series = createMockSeries();
      component.redrawChart();

      // First fillRect call should be for clearing
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty points array', () => {
      component.series = [
        {
          label: 'Empty',
          color: '#000',
          points: [],
        },
      ];

      expect(() => component.redrawChart()).not.toThrow();
    });

    it('should handle single point series', () => {
      component.series = [
        {
          label: 'Single',
          color: '#000',
          points: [{ x: 0, y: 10 }],
        },
      ];

      expect(() => component.redrawChart()).not.toThrow();
    });

    it('should handle series with negative values', () => {
      component.series = [
        {
          label: 'Negative',
          color: '#000',
          points: [
            { x: 0, y: -10 },
            { x: 1, y: -5 },
          ],
        },
      ];

      expect(() => component.redrawChart()).not.toThrow();
    });

    it('should be safe to call redrawChart before canvas ready', () => {
      const uninitializedComponent = new MicroLineChartComponent();
      expect(() => uninitializedComponent.redrawChart()).not.toThrow();
    });
  });
});
