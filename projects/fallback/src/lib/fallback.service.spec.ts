/**
 * Unit tests for FallbackService.
 *
 * Tests capability detection, fallback activation, placeholder generation,
 * and animation control disabling.
 */

import { TestBed } from '@angular/core/testing';
import { FallbackService } from './fallback.service';

describe('FallbackService', () => {
  let service: FallbackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FallbackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('detectCapabilities', () => {
    it('should return false when WebGL2 is available', () => {
      // Mock canvas getContext to return a WebGL2 context
      const mockContext = {
        getExtension: jasmine.createSpy('getExtension').and.returnValue({
          loseContext: jasmine.createSpy('loseContext'),
        }),
      };

      spyOn(document, 'createElement').and.returnValue({
        getContext: jasmine
          .createSpy('getContext')
          .and.returnValue(mockContext),
      } as any);

      const result = service.detectCapabilities();

      expect(result).toBe(false);
      expect(document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should return false when WebGL1 is available (fallback from WebGL2)', () => {
      // Mock canvas getContext to return null for webgl2 but a context for webgl
      const mockContext = {
        getExtension: jasmine.createSpy('getExtension').and.returnValue({
          loseContext: jasmine.createSpy('loseContext'),
        }),
      };

      spyOn(document, 'createElement').and.returnValue({
        getContext: jasmine.createSpy('getContext').and.callFake((type) => {
          return type === 'webgl' ? mockContext : null;
        }),
      } as any);

      const result = service.detectCapabilities();

      expect(result).toBe(false);
    });

    it('should return true when WebGL is not available', () => {
      // Mock canvas getContext to return null
      spyOn(document, 'createElement').and.returnValue({
        getContext: jasmine.createSpy('getContext').and.returnValue(null),
      } as any);

      const result = service.detectCapabilities();

      expect(result).toBe(true);
    });

    it('should return true when getContext throws an error', () => {
      // Mock canvas getContext to throw an error
      spyOn(document, 'createElement').and.returnValue({
        getContext: jasmine
          .createSpy('getContext')
          .and.throwError('WebGL error'),
      } as any);

      const result = service.detectCapabilities();

      expect(result).toBe(true);
    });

    it('should clean up WebGL context when available', () => {
      const loseContextSpy = jasmine.createSpy('loseContext');
      const mockContext = {
        getExtension: jasmine
          .createSpy('getExtension')
          .and.returnValue({ loseContext: loseContextSpy }),
      };

      spyOn(document, 'createElement').and.returnValue({
        getContext: jasmine
          .createSpy('getContext')
          .and.returnValue(mockContext),
      } as any);

      service.detectCapabilities();

      expect(mockContext.getExtension).toHaveBeenCalledWith(
        'WEBGL_lose_context'
      );
      expect(loseContextSpy).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should set isFallbackActive to true when WebGL is unavailable', () => {
      spyOn(service, 'detectCapabilities').and.returnValue(true);

      service.initialize();

      expect(service.isFallbackActive()).toBe(true);
    });

    it('should set isFallbackActive to false when WebGL is available', () => {
      spyOn(service, 'detectCapabilities').and.returnValue(false);

      service.initialize();

      expect(service.isFallbackActive()).toBe(false);
    });
  });

  describe('getStaticPlaceholder', () => {
    it('should return a non-empty string', () => {
      const placeholder = service.getStaticPlaceholder();

      expect(placeholder).toBeTruthy();
      expect(typeof placeholder).toBe('string');
    });

    it('should return a data URI', () => {
      const placeholder = service.getStaticPlaceholder();

      expect(placeholder).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should return valid base64-encoded SVG', () => {
      const placeholder = service.getStaticPlaceholder();
      const base64Part = placeholder.replace('data:image/svg+xml;base64,', '');

      // Should be able to decode without error
      expect(() => atob(base64Part)).not.toThrow();

      const decoded = atob(base64Part);
      expect(decoded).toContain('<svg');
      expect(decoded).toContain('Graphics Not Available');
    });
  });

  describe('shouldDisableAnimationControls', () => {
    it('should return true when fallback is active', () => {
      service.isFallbackActive.set(true);

      expect(service.shouldDisableAnimationControls()).toBe(true);
    });

    it('should return false when fallback is not active', () => {
      service.isFallbackActive.set(false);

      expect(service.shouldDisableAnimationControls()).toBe(false);
    });

    it('should reflect changes to isFallbackActive signal', () => {
      service.isFallbackActive.set(false);
      expect(service.shouldDisableAnimationControls()).toBe(false);

      service.isFallbackActive.set(true);
      expect(service.shouldDisableAnimationControls()).toBe(true);

      service.isFallbackActive.set(false);
      expect(service.shouldDisableAnimationControls()).toBe(false);
    });
  });
});
