/**
 * Unit tests for LiveRegionService
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LiveRegionService } from './live-region.service';

describe('LiveRegionService', () => {
  let service: LiveRegionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveRegionService);
  });

  afterEach(() => {
    // Clean up all live regions after each test
    service.removeAllLiveRegions();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createLiveRegion', () => {
    it('should create a live region with role="status"', () => {
      const element = service.createLiveRegion('test');

      expect(element.getAttribute('role')).toBe('status');
      expect(element.getAttribute('aria-live')).toBe('polite');
      expect(element.getAttribute('aria-atomic')).toBe('true');
    });

    it('should create a live region with aria-live="polite" by default', () => {
      const element = service.createLiveRegion('test');

      expect(element.getAttribute('aria-live')).toBe('polite');
    });

    it('should create a live region with aria-live="assertive" when specified', () => {
      const element = service.createLiveRegion('test', 'assertive');

      expect(element.getAttribute('aria-live')).toBe('assertive');
    });

    it('should append the live region to document.body', () => {
      const element = service.createLiveRegion('test');

      expect(element.parentNode).toBe(document.body);
    });

    it('should return the same element if called with the same ID', () => {
      const element1 = service.createLiveRegion('test');
      const element2 = service.createLiveRegion('test');

      expect(element1).toBe(element2);
    });

    it('should create visually hidden element', () => {
      const element = service.createLiveRegion('test');

      expect(element.style.position).toBe('absolute');
      expect(element.style.left).toBe('-10000px');
      expect(element.style.width).toBe('1px');
      expect(element.style.height).toBe('1px');
      expect(element.style.overflow).toBe('hidden');
    });

    it('should set unique ID for each region', () => {
      const element = service.createLiveRegion('my-region');

      expect(element.id).toBe('live-region-my-region');
    });
  });

  describe('announce', () => {
    it('should set textContent on the live region', () => {
      service.createLiveRegion('test');
      service.announce('Test announcement', 'test');

      const element = document.getElementById('live-region-test');
      expect(element?.textContent).toBe('Test announcement');
    });

    it('should create live region if it does not exist', () => {
      service.announce('Test announcement', 'new-region');

      const element = document.getElementById('live-region-new-region');
      expect(element).toBeTruthy();
      expect(element?.textContent).toBe('Test announcement');
    });

    it('should use "default" region ID if not specified', () => {
      service.announce('Default announcement');

      const element = document.getElementById('live-region-default');
      expect(element).toBeTruthy();
      expect(element?.textContent).toBe('Default announcement');
    });

    it('should clear announcement after delay', fakeAsync(() => {
      service.announce('Test announcement', 'test');

      const element = document.getElementById('live-region-test');
      expect(element?.textContent).toBe('Test announcement');

      tick(1000);

      expect(element?.textContent).toBe('');
    }));

    it('should cancel previous auto-clear timeout when new announcement is made', fakeAsync(() => {
      service.announce('First announcement', 'test');
      tick(500);
      service.announce('Second announcement', 'test');

      const element = document.getElementById('live-region-test');
      expect(element?.textContent).toBe('Second announcement');

      tick(500);
      // Should still have second announcement (first timeout was canceled)
      expect(element?.textContent).toBe('Second announcement');

      tick(500);
      // Now the second timeout completes
      expect(element?.textContent).toBe('');
    }));
  });

  describe('clearAnnouncements', () => {
    it('should clear the textContent of the live region', () => {
      service.announce('Test announcement', 'test');
      service.clearAnnouncements('test');

      const element = document.getElementById('live-region-test');
      expect(element?.textContent).toBe('');
    });

    it('should cancel pending auto-clear timeout', fakeAsync(() => {
      service.announce('Test announcement', 'test');
      service.clearAnnouncements('test');

      const element = document.getElementById('live-region-test');
      expect(element?.textContent).toBe('');

      // Wait for original auto-clear timeout
      tick(1000);

      // Should still be empty (manual clear already happened)
      expect(element?.textContent).toBe('');
    }));

    it('should not throw error if region does not exist', () => {
      expect(() => service.clearAnnouncements('nonexistent')).not.toThrow();
    });

    it('should use "default" region ID if not specified', () => {
      service.announce('Default announcement');
      service.clearAnnouncements();

      const element = document.getElementById('live-region-default');
      expect(element?.textContent).toBe('');
    });
  });

  describe('removeLiveRegion', () => {
    it('should remove the live region from the DOM', () => {
      service.createLiveRegion('test');
      service.removeLiveRegion('test');

      const element = document.getElementById('live-region-test');
      expect(element).toBeNull();
    });

    it('should cancel pending auto-clear timeout', fakeAsync(() => {
      service.announce('Test announcement', 'test');
      service.removeLiveRegion('test');

      // Should not throw error when timeout fires
      expect(() => tick(1000)).not.toThrow();
    }));

    it('should not throw error if region does not exist', () => {
      expect(() => service.removeLiveRegion('nonexistent')).not.toThrow();
    });
  });

  describe('removeAllLiveRegions', () => {
    it('should remove all live regions from the DOM', () => {
      service.createLiveRegion('region1');
      service.createLiveRegion('region2');
      service.createLiveRegion('region3');

      service.removeAllLiveRegions();

      expect(document.getElementById('live-region-region1')).toBeNull();
      expect(document.getElementById('live-region-region2')).toBeNull();
      expect(document.getElementById('live-region-region3')).toBeNull();
    });

    it('should cancel all pending auto-clear timeouts', fakeAsync(() => {
      service.announce('Announcement 1', 'region1');
      service.announce('Announcement 2', 'region2');

      service.removeAllLiveRegions();

      // Should not throw error when timeouts fire
      expect(() => tick(1000)).not.toThrow();
    }));
  });

  describe('multiple regions', () => {
    it('should maintain independent regions', () => {
      service.announce('Announcement 1', 'region1');
      service.announce('Announcement 2', 'region2');

      const element1 = document.getElementById('live-region-region1');
      const element2 = document.getElementById('live-region-region2');

      expect(element1?.textContent).toBe('Announcement 1');
      expect(element2?.textContent).toBe('Announcement 2');
    });

    it('should clear regions independently', () => {
      service.announce('Announcement 1', 'region1');
      service.announce('Announcement 2', 'region2');

      service.clearAnnouncements('region1');

      const element1 = document.getElementById('live-region-region1');
      const element2 = document.getElementById('live-region-region2');

      expect(element1?.textContent).toBe('');
      expect(element2?.textContent).toBe('Announcement 2');
    });

    it('should remove regions independently', () => {
      service.createLiveRegion('region1');
      service.createLiveRegion('region2');

      service.removeLiveRegion('region1');

      expect(document.getElementById('live-region-region1')).toBeNull();
      expect(document.getElementById('live-region-region2')).toBeTruthy();
    });
  });
});
