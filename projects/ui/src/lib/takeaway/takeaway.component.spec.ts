/**
 * Unit tests for TakeawayComponent.
 *
 * Tests verify:
 * - Component initialization with summaries
 * - Message rendering
 * - Absolute edges toggle
 * - Empty state handling
 * - Template customization
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TakeawayComponent } from './takeaway.component';
import { TakeawayService } from './takeaway.service';
import type { RunSummaryV1 } from 'simulation';

describe('TakeawayComponent', () => {
  let component: TakeawayComponent;
  let fixture: ComponentFixture<TakeawayComponent>;
  let service: TakeawayService;

  const createMockSummary = (
    totalRounds: number,
    totalEdges: number
  ): RunSummaryV1 => ({
    totalRounds,
    totalEdges,
    convergenceAchieved: true,
    convergenceRound: totalRounds - 1,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeawayComponent],
      providers: [TakeawayService],
    }).compileComponents();

    fixture = TestBed.createComponent(TakeawayComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TakeawayService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should compute takeaway when both summaries provided', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);

      component.ngOnInit();

      expect(component.takeaway).toBeDefined();
      expect(component.takeaway?.percentFewerEdges).toBeCloseTo(16.67, 2);
      expect(component.takeaway?.roundsDelta).toBe(2);
    });

    it('should format message using service', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);

      component.ngOnInit();

      expect(component.message).toBeDefined();
      expect(component.message?.length).toBeGreaterThan(0);
    });

    it('should not compute takeaway when summaryA missing', () => {
      component.summaryB = createMockSummary(12, 120);

      component.ngOnInit();

      expect(component.takeaway).toBeUndefined();
      expect(component.message).toBeUndefined();
    });

    it('should not compute takeaway when summaryB missing', () => {
      component.summaryA = createMockSummary(10, 100);

      component.ngOnInit();

      expect(component.takeaway).toBeUndefined();
      expect(component.message).toBeUndefined();
    });

    it('should not compute takeaway when both summaries missing', () => {
      component.ngOnInit();

      expect(component.takeaway).toBeUndefined();
      expect(component.message).toBeUndefined();
    });
  });

  describe('rendering', () => {
    it('should display takeaway section when data available', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const takeawaySection = element.querySelector('.takeaway');

      expect(takeawaySection).toBeTruthy();
    });

    it('should not display takeaway section when data unavailable', () => {
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const takeawaySection = element.querySelector('.takeaway');

      expect(takeawaySection).toBeNull();
    });

    it('should display formatted message', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const messageElement = element.querySelector('.takeaway-message');

      expect(messageElement).toBeTruthy();
      expect(messageElement?.textContent).toContain('16.67');
      expect(messageElement?.textContent).toContain('2');
    });

    it('should display title', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const titleElement = element.querySelector('.takeaway-title');

      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toContain('Key Takeaway');
    });
  });

  describe('absolute edges toggle', () => {
    it('should include absolutes when flag is true', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.includeAbsolutes = true;

      component.ngOnInit();

      expect(component.takeaway?.absEdgesA).toBe(100);
      expect(component.takeaway?.absEdgesB).toBe(120);
    });

    it('should not include absolutes when flag is false', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.includeAbsolutes = false;

      component.ngOnInit();

      expect(component.takeaway?.absEdgesA).toBeUndefined();
      expect(component.takeaway?.absEdgesB).toBeUndefined();
    });

    it('should display details when includeAbsolutes is true', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.includeAbsolutes = true;
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const detailsElement = element.querySelector('.takeaway-details');

      expect(detailsElement).toBeTruthy();
      expect(detailsElement?.textContent).toContain('100');
      expect(detailsElement?.textContent).toContain('120');
    });

    it('should not display details when includeAbsolutes is false', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.includeAbsolutes = false;
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const detailsElement = element.querySelector('.takeaway-details');

      expect(detailsElement).toBeNull();
    });

    it('should default to false when not specified', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      fixture.detectChanges();

      expect(component.includeAbsolutes).toBe(false);

      const element: HTMLElement = fixture.nativeElement;
      const detailsElement = element.querySelector('.takeaway-details');

      expect(detailsElement).toBeNull();
    });
  });

  describe('template customization', () => {
    it('should use custom template when provided', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.template = 'Custom: {percentFewerEdges}% in {roundsDelta}';

      component.ngOnInit();

      expect(component.message).toContain('Custom');
      expect(component.message).toContain('16.67');
      expect(component.message).toContain('2');
    });

    it('should use default template when not provided', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);

      component.ngOnInit();

      const defaultTemplate = service.getDefaultTemplate();
      const expectedMessage = service.formatMessage(component.takeaway!);

      expect(component.message).toBe(expectedMessage);
    });
  });

  describe('service integration', () => {
    it('should use TakeawayService for computation', () => {
      spyOn(service, 'compute').and.callThrough();

      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.ngOnInit();

      expect(service.compute).toHaveBeenCalledWith(
        component.summaryA,
        component.summaryB,
        false
      );
    });

    it('should use TakeawayService for message formatting', () => {
      spyOn(service, 'formatMessage').and.callThrough();

      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.ngOnInit();

      expect(service.formatMessage).toHaveBeenCalled();
    });
  });

  describe('data changes', () => {
    it('should handle summary updates', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      component.ngOnInit();

      const firstMessage = component.message;

      // Update summaries
      component.summaryA = createMockSummary(8, 80);
      component.summaryB = createMockSummary(12, 120);
      component.ngOnInit();

      expect(component.message).not.toBe(firstMessage);
    });
  });

  describe('visual regression safeguards', () => {
    it('should have consistent CSS classes', () => {
      component.summaryA = createMockSummary(10, 100);
      component.summaryB = createMockSummary(12, 120);
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;

      expect(element.querySelector('.takeaway')).toBeTruthy();
      expect(element.querySelector('.takeaway-title')).toBeTruthy();
      expect(element.querySelector('.takeaway-message')).toBeTruthy();
    });
  });
});
