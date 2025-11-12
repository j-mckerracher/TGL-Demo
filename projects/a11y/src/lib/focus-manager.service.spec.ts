/**
 * Unit tests for FocusManagerService
 */

import { TestBed } from '@angular/core/testing';
import { FocusManagerService } from './focus-manager.service';

describe('FocusManagerService', () => {
  let service: FocusManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FocusManagerService);
  });

  afterEach(() => {
    // Clean up any DOM elements created during tests
    document.body.innerHTML = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setInitialFocus', () => {
    it('should set focus to the first focusable element', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      service.setInitialFocus(container);

      expect(document.activeElement).toBe(button1);
    });

    it('should not throw error if no focusable elements exist', () => {
      const container = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'Not focusable';
      container.appendChild(span);
      document.body.appendChild(container);

      expect(() => service.setInitialFocus(container)).not.toThrow();
    });
  });

  describe('getFirstFocusableElement', () => {
    it('should return the first focusable element', () => {
      const container = document.createElement('div');
      const link = document.createElement('a');
      link.href = '#';
      const button = document.createElement('button');
      container.appendChild(link);
      container.appendChild(button);
      document.body.appendChild(container);

      const result = service.getFirstFocusableElement(container);

      expect(result).toBe(link);
    });

    it('should return null if no focusable elements exist', () => {
      const container = document.createElement('div');
      const span = document.createElement('span');
      container.appendChild(span);
      document.body.appendChild(container);

      const result = service.getFirstFocusableElement(container);

      expect(result).toBeNull();
    });

    it('should skip disabled elements', () => {
      const container = document.createElement('div');
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;
      const enabledButton = document.createElement('button');
      container.appendChild(disabledButton);
      container.appendChild(enabledButton);
      document.body.appendChild(container);

      const result = service.getFirstFocusableElement(container);

      expect(result).toBe(enabledButton);
    });
  });

  describe('getLastFocusableElement', () => {
    it('should return the last focusable element', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);

      const result = service.getLastFocusableElement(container);

      expect(result).toBe(button3);
    });

    it('should return null if no focusable elements exist', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const result = service.getLastFocusableElement(container);

      expect(result).toBeNull();
    });
  });

  describe('trapFocus', () => {
    it('should trap Tab key within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);

      const cleanup = service.trapFocus(container);

      // Focus last element and press Tab
      button3.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = spyOn(tabEvent, 'preventDefault');
      container.dispatchEvent(tabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();

      cleanup();
    });

    it('should trap Shift+Tab key within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const cleanup = service.trapFocus(container);

      // Focus first element and press Shift+Tab
      button1.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = spyOn(shiftTabEvent, 'preventDefault');
      container.dispatchEvent(shiftTabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();

      cleanup();
    });

    it('should allow non-Tab keys to pass through', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      container.appendChild(button);
      document.body.appendChild(container);

      const cleanup = service.trapFocus(container);

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = spyOn(enterEvent, 'preventDefault');
      container.dispatchEvent(enterEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('should cleanup event listener when cleanup function is called', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      container.appendChild(button);
      document.body.appendChild(container);

      const cleanup = service.trapFocus(container);
      cleanup();

      // After cleanup, Tab should not be trapped
      button.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = spyOn(tabEvent, 'preventDefault');
      container.dispatchEvent(tabEvent);

      // preventDefault should not be called after cleanup
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('returnFocus', () => {
    it('should return focus to the specified element', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      service.returnFocus(button);

      expect(document.activeElement).toBe(button);
    });

    it('should handle null element gracefully', () => {
      expect(() => service.returnFocus(null as any)).not.toThrow();
    });
  });

  describe('announceRegion', () => {
    it('should set aria-live to polite by default', () => {
      const region = document.createElement('div');
      document.body.appendChild(region);

      service.announceRegion(region);

      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('aria-atomic')).toBe('true');
    });

    it('should set aria-live to assertive when specified', () => {
      const region = document.createElement('div');
      document.body.appendChild(region);

      service.announceRegion(region, 'assertive');

      expect(region.getAttribute('aria-live')).toBe('assertive');
      expect(region.getAttribute('aria-atomic')).toBe('true');
    });
  });
});
