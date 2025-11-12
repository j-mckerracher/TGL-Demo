/**
 * Unit tests for FallbackBannerComponent.
 *
 * Tests banner visibility, message rendering, ARIA attributes, and icon display.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FallbackBannerComponent } from './fallback-banner.component';
import { FallbackService } from './fallback.service';
import { signal } from '@angular/core';

describe('FallbackBannerComponent', () => {
  let component: FallbackBannerComponent;
  let fixture: ComponentFixture<FallbackBannerComponent>;
  let mockFallbackService: jasmine.SpyObj<FallbackService>;

  beforeEach(async () => {
    // Create a mock FallbackService with a writable signal
    const isFallbackActiveSignal = signal(false);
    mockFallbackService = jasmine.createSpyObj(
      'FallbackService',
      ['initialize', 'getStaticPlaceholder'],
      { isFallbackActive: isFallbackActiveSignal }
    );
    mockFallbackService.getStaticPlaceholder.and.returnValue(
      'data:image/svg+xml;base64,test'
    );

    await TestBed.configureTestingModule({
      imports: [FallbackBannerComponent],
      providers: [{ provide: FallbackService, useValue: mockFallbackService }],
    }).compileComponents();

    fixture = TestBed.createComponent(FallbackBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call initialize on ngOnInit', () => {
    component.ngOnInit();
    expect(mockFallbackService.initialize).toHaveBeenCalled();
  });

  describe('Banner visibility', () => {
    it('should display banner when fallback is active', () => {
      mockFallbackService.isFallbackActive.set(true);
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.fallback-banner');
      expect(banner).toBeTruthy();
    });

    it('should hide banner when fallback is not active', () => {
      mockFallbackService.isFallbackActive.set(false);
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.fallback-banner');
      expect(banner).toBeFalsy();
    });

    it('should reactively show/hide banner based on signal changes', () => {
      // Start inactive
      mockFallbackService.isFallbackActive.set(false);
      fixture.detectChanges();
      let banner = fixture.nativeElement.querySelector('.fallback-banner');
      expect(banner).toBeFalsy();

      // Activate fallback
      mockFallbackService.isFallbackActive.set(true);
      fixture.detectChanges();
      banner = fixture.nativeElement.querySelector('.fallback-banner');
      expect(banner).toBeTruthy();

      // Deactivate fallback
      mockFallbackService.isFallbackActive.set(false);
      fixture.detectChanges();
      banner = fixture.nativeElement.querySelector('.fallback-banner');
      expect(banner).toBeFalsy();
    });
  });

  describe('Message rendering', () => {
    beforeEach(() => {
      mockFallbackService.isFallbackActive.set(true);
      fixture.detectChanges();
    });

    it('should display the main message', () => {
      const messageElement =
        fixture.nativeElement.querySelector('.banner-message');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toContain(
        'Your browser does not support advanced graphics'
      );
    });

    it('should display the details message', () => {
      const detailsElement =
        fixture.nativeElement.querySelector('.banner-details');
      expect(detailsElement).toBeTruthy();
      expect(detailsElement.textContent).toContain(
        'Some interactive features are disabled'
      );
    });
  });

  describe('ARIA attributes', () => {
    beforeEach(() => {
      mockFallbackService.isFallbackActive.set(true);
      fixture.detectChanges();
    });

    it('should have role="status" attribute', () => {
      const banner = fixture.nativeElement.querySelector('.fallback-banner');
      expect(banner.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite" attribute', () => {
      const banner = fixture.nativeElement.querySelector('.fallback-banner');
      expect(banner.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Icon rendering', () => {
    beforeEach(() => {
      mockFallbackService.isFallbackActive.set(true);
      fixture.detectChanges();
    });

    it('should display warning icon', () => {
      const iconElement =
        fixture.nativeElement.querySelector('.banner-icon');
      expect(iconElement).toBeTruthy();
      expect(iconElement.textContent).toContain('⚠️');
    });
  });

  describe('getPlaceholder', () => {
    it('should call fallbackService.getStaticPlaceholder', () => {
      const result = component.getPlaceholder();

      expect(mockFallbackService.getStaticPlaceholder).toHaveBeenCalled();
      expect(result).toBe('data:image/svg+xml;base64,test');
    });
  });
});
