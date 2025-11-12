/**
 * Unit tests for KeyboardShortcutsDirective
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  KeyboardShortcutsDirective,
  KeyboardShortcut,
} from './keyboard-shortcuts.directive';

@Component({
  template: `
    <div [appKeyboardShortcuts]="shortcuts" data-testid="shortcut-host">
      Test Element
    </div>
  `,
  standalone: true,
  imports: [KeyboardShortcutsDirective],
})
class TestHostComponent {
  shortcuts: KeyboardShortcut[] = [];
  actionCalled = false;
  lastActionKey = '';

  testAction(key: string): void {
    this.actionCalled = true;
    this.lastActionKey = key;
  }

  resetActions(): void {
    this.actionCalled = false;
    this.lastActionKey = '';
  }
}

describe('KeyboardShortcutsDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let hostElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    hostElement = fixture.nativeElement.querySelector(
      '[data-testid="shortcut-host"]'
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('keyboard shortcut handling', () => {
    it('should execute action when matching key is pressed', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
        },
      ];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(event);

      expect(component.actionCalled).toBe(true);
      expect(component.lastActionKey).toBe('Enter');
    });

    it('should not execute action when non-matching key is pressed', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
        },
      ];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(event);

      expect(component.actionCalled).toBe(false);
    });

    it('should handle multiple shortcuts', () => {
      let enterCalled = false;
      let escapeCalled = false;

      component.shortcuts = [
        {
          key: 'Enter',
          action: () => {
            enterCalled = true;
          },
        },
        {
          key: 'Escape',
          action: () => {
            escapeCalled = true;
          },
        },
      ];
      fixture.detectChanges();

      // Press Enter
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(enterEvent);

      expect(enterCalled).toBe(true);
      expect(escapeCalled).toBe(false);

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(escapeEvent);

      expect(escapeCalled).toBe(true);
    });

    it('should support arrow keys', () => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const calledKeys: string[] = [];

      component.shortcuts = keys.map((key) => ({
        key,
        action: () => calledKeys.push(key),
      }));
      fixture.detectChanges();

      keys.forEach((key) => {
        const event = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        });
        hostElement.dispatchEvent(event);
      });

      expect(calledKeys).toEqual(keys);
    });
  });

  describe('preventDefault behavior', () => {
    it('should prevent default by default', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
        },
      ];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = spyOn(event, 'preventDefault');

      hostElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default when preventDefault is false', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
          preventDefault: false,
        },
      ];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = spyOn(event, 'preventDefault');

      hostElement.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should prevent default when preventDefault is explicitly true', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
          preventDefault: true,
        },
      ];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = spyOn(event, 'preventDefault');

      hostElement.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('lifecycle and cleanup', () => {
    it('should attach listener on init', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
        },
      ];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(event);

      expect(component.actionCalled).toBe(true);
    });

    it('should remove listener on destroy', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
        },
      ];
      fixture.detectChanges();

      // Destroy the component
      fixture.destroy();

      // Try to trigger shortcut after destruction
      component.resetActions();
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(event);

      // Action should not be called after cleanup
      expect(component.actionCalled).toBe(false);
    });

    it('should handle empty shortcuts array', () => {
      component.shortcuts = [];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });

      expect(() => hostElement.dispatchEvent(event)).not.toThrow();
    });

    it('should handle shortcuts array changes', () => {
      // Start with one shortcut
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => component.testAction('Enter'),
        },
      ];
      fixture.detectChanges();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(enterEvent);
      expect(component.actionCalled).toBe(true);

      // Change to different shortcut
      component.resetActions();
      component.shortcuts = [
        {
          key: 'Escape',
          action: () => component.testAction('Escape'),
        },
      ];
      fixture.detectChanges();

      // Old shortcut should not work
      component.resetActions();
      hostElement.dispatchEvent(enterEvent);
      expect(component.actionCalled).toBe(false);

      // New shortcut should work
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      hostElement.dispatchEvent(escapeEvent);
      expect(component.actionCalled).toBe(true);
      expect(component.lastActionKey).toBe('Escape');
    });
  });

  describe('edge cases', () => {
    it('should handle action that throws error gracefully', () => {
      component.shortcuts = [
        {
          key: 'Enter',
          action: () => {
            throw new Error('Test error');
          },
        },
      ];
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });

      expect(() => hostElement.dispatchEvent(event)).toThrow();
    });

    it('should handle special keys', () => {
      const specialKeys = [' ', 'Tab', 'Backspace', 'Delete'];
      const calledKeys: string[] = [];

      component.shortcuts = specialKeys.map((key) => ({
        key,
        action: () => calledKeys.push(key),
      }));
      fixture.detectChanges();

      specialKeys.forEach((key) => {
        const event = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        });
        hostElement.dispatchEvent(event);
      });

      expect(calledKeys).toEqual(specialKeys);
    });
  });
});
