/**
 * StatusBannerComponent unit tests.
 *
 * Tests rendering, styling, reset button functionality, and idempotent behavior.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBannerComponent } from './status-banner.component';
import { ErrorService, ErrorCode } from './error.service';
import { EngineController } from '../state/engine.controller';

describe('StatusBannerComponent', () => {
  let component: StatusBannerComponent;
  let fixture: ComponentFixture<StatusBannerComponent>;
  let errorService: ErrorService;
  let engineController: jasmine.SpyObj<EngineController>;

  beforeEach(async () => {
    // Create spy for EngineController
    const engineControllerSpy = jasmine.createSpyObj('EngineController', [
      'reset',
      'initialize',
      'start',
      'stop',
    ]);

    await TestBed.configureTestingModule({
      imports: [StatusBannerComponent],
      providers: [
        ErrorService,
        { provide: EngineController, useValue: engineControllerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBannerComponent);
    component = fixture.componentInstance;
    errorService = TestBed.inject(ErrorService);
    engineController = TestBed.inject(
      EngineController
    ) as jasmine.SpyObj<EngineController>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('rendering', () => {
    it('should not render banner when status is idle', () => {
      errorService.reset();
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner).toBeNull();
    });

    it('should render banner with error message when status is error', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner).toBeTruthy();

      const message =
        fixture.nativeElement.querySelector('.status-message')?.textContent;
      expect(message).toContain(
        'Invalid simulation parameters. Please check values and try again.'
      );
    });

    it('should render banner with warning message when status is warning', () => {
      const warningMessage = 'This is a warning';
      errorService.setWarning(warningMessage);
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner).toBeTruthy();

      const message =
        fixture.nativeElement.querySelector('.status-message')?.textContent;
      expect(message).toContain(warningMessage);
    });

    it('should render banner with success message when status is success', () => {
      const successMessage = 'Operation completed';
      errorService.setSuccess(successMessage);
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner).toBeTruthy();

      const message =
        fixture.nativeElement.querySelector('.status-message')?.textContent;
      expect(message).toContain(successMessage);
    });
  });

  describe('styling', () => {
    it('should apply error CSS class when status is error', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner?.classList.contains('status-error')).toBe(true);
    });

    it('should apply warning CSS class when status is warning', () => {
      errorService.setWarning('Warning message');
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner?.classList.contains('status-warning')).toBe(true);
    });

    it('should apply success CSS class when status is success', () => {
      errorService.setSuccess('Success message');
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner?.classList.contains('status-success')).toBe(true);
    });

    it('should update CSS class when status changes', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      let banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner?.classList.contains('status-error')).toBe(true);

      errorService.setSuccess('Success message');
      fixture.detectChanges();

      banner = fixture.nativeElement.querySelector('.status-banner');
      expect(banner?.classList.contains('status-success')).toBe(true);
      expect(banner?.classList.contains('status-error')).toBe(false);
    });
  });

  describe('icon rendering', () => {
    it('should render error icon (✕) for error status', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.status-icon');
      expect(icon?.textContent?.trim()).toContain('✕');
    });

    it('should render success icon (✓) for success status', () => {
      errorService.setSuccess('Success message');
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.status-icon');
      expect(icon?.textContent?.trim()).toContain('✓');
    });

    it('should render info icon (ℹ) for warning status', () => {
      errorService.setWarning('Warning message');
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.status-icon');
      expect(icon?.textContent?.trim()).toContain('ℹ');
    });
  });

  describe('reset button', () => {
    it('should display reset button when status is error', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      expect(resetButton).toBeTruthy();
    });

    it('should not display reset button when status is warning', () => {
      errorService.setWarning('Warning message');
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      expect(resetButton).toBeNull();
    });

    it('should not display reset button when status is success', () => {
      errorService.setSuccess('Success message');
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      expect(resetButton).toBeNull();
    });

    it('should call engineController.reset() when reset button is clicked', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      resetButton?.click();

      expect(engineController.reset).toHaveBeenCalled();
    });

    it('should call errorService.reset() when reset button is clicked', () => {
      spyOn(errorService, 'reset');
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      resetButton?.click();

      expect(errorService.reset).toHaveBeenCalled();
    });

    it('should reset both services when reset button is clicked', () => {
      spyOn(errorService, 'reset');
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      resetButton?.click();

      expect(engineController.reset).toHaveBeenCalled();
      expect(errorService.reset).toHaveBeenCalled();
    });
  });

  describe('idempotent behavior', () => {
    it('should handle multiple reset button clicks without errors', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');

      // Click reset multiple times
      expect(() => {
        resetButton?.click();
        fixture.detectChanges();
        resetButton?.click();
        fixture.detectChanges();
        resetButton?.click();
        fixture.detectChanges();
      }).not.toThrow();

      // Verify reset was called multiple times
      expect(engineController.reset).toHaveBeenCalledTimes(3);
    });

    it('should maintain stable state after multiple resets', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      // Reset multiple times
      component.onReset();
      const status1 = errorService.statusSignal();

      component.onReset();
      const status2 = errorService.statusSignal();

      component.onReset();
      const status3 = errorService.statusSignal();

      // All should be identical
      expect(status1).toEqual(status2);
      expect(status2).toEqual(status3);
      expect(status1.status).toBe('idle');
    });
  });

  describe('statusClass computed signal', () => {
    it('should return correct class for error status', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      expect(component.statusClass()).toBe('status-error');
    });

    it('should return correct class for warning status', () => {
      errorService.setWarning('Warning');
      fixture.detectChanges();

      expect(component.statusClass()).toBe('status-warning');
    });

    it('should return correct class for success status', () => {
      errorService.setSuccess('Success');
      fixture.detectChanges();

      expect(component.statusClass()).toBe('status-success');
    });

    it('should return correct class for idle status', () => {
      errorService.reset();
      fixture.detectChanges();

      expect(component.statusClass()).toBe('status-idle');
    });
  });

  describe('accessibility', () => {
    it('should have aria-hidden on status icon', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.status-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-label on reset button', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      expect(resetButton?.getAttribute('aria-label')).toBe(
        'Reset application'
      );
    });

    it('should have type="button" on reset button', () => {
      errorService.setError(ErrorCode.SIM_INVALID_PARAMS);
      fixture.detectChanges();

      const resetButton =
        fixture.nativeElement.querySelector('.reset-button');
      expect(resetButton?.getAttribute('type')).toBe('button');
    });
  });
});
