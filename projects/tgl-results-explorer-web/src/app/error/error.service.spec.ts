/**
 * ErrorService unit tests.
 *
 * Tests error state management, message mapping, and idempotent reset behavior.
 */

import { TestBed } from '@angular/core/testing';
import { ErrorService, ErrorCode } from './error.service';

describe('ErrorService', () => {
  let service: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with idle status', () => {
    const status = service.statusSignal();
    expect(status.status).toBe('idle');
    expect(status.message).toBe('');
    expect(status.errorCode).toBeUndefined();
  });

  describe('setError', () => {
    it('should set error status with mapped message', () => {
      service.setError(ErrorCode.SIM_INVALID_PARAMS);
      const status = service.statusSignal();

      expect(status.status).toBe('error');
      expect(status.errorCode).toBe(ErrorCode.SIM_INVALID_PARAMS);
      expect(status.message).toBe(
        'Invalid simulation parameters. Please check values and try again.'
      );
    });

    it('should set error status with custom message', () => {
      const customMessage = 'Custom error message';
      service.setError(ErrorCode.SIM_INVALID_PARAMS, customMessage);
      const status = service.statusSignal();

      expect(status.status).toBe('error');
      expect(status.errorCode).toBe(ErrorCode.SIM_INVALID_PARAMS);
      expect(status.message).toBe(customMessage);
    });

    it('should handle SIM_NON_CONVERGENCE error', () => {
      service.setError(ErrorCode.SIM_NON_CONVERGENCE);
      const status = service.statusSignal();

      expect(status.status).toBe('error');
      expect(status.errorCode).toBe(ErrorCode.SIM_NON_CONVERGENCE);
      expect(status.message).toBe(
        'Simulation did not converge within budget. Try adjusting parameters.'
      );
    });

    it('should handle RENDER_INIT_FAILED error', () => {
      service.setError(ErrorCode.RENDER_INIT_FAILED);
      const status = service.statusSignal();

      expect(status.status).toBe('error');
      expect(status.errorCode).toBe(ErrorCode.RENDER_INIT_FAILED);
      expect(status.message).toBe(
        'Graphics initialization failed. Please refresh and try again.'
      );
    });

    it('should handle FALLBACK_ACTIVE error', () => {
      service.setError(ErrorCode.FALLBACK_ACTIVE);
      const status = service.statusSignal();

      expect(status.status).toBe('error');
      expect(status.errorCode).toBe(ErrorCode.FALLBACK_ACTIVE);
      expect(status.message).toBe(
        'WebGL not available; displaying simplified preview.'
      );
    });
  });

  describe('setWarning', () => {
    it('should set warning status with message', () => {
      const warningMessage = 'This is a warning';
      service.setWarning(warningMessage);
      const status = service.statusSignal();

      expect(status.status).toBe('warning');
      expect(status.message).toBe(warningMessage);
      expect(status.errorCode).toBeUndefined();
    });
  });

  describe('setSuccess', () => {
    it('should set success status with message', () => {
      const successMessage = 'Operation completed successfully';
      service.setSuccess(successMessage);
      const status = service.statusSignal();

      expect(status.status).toBe('success');
      expect(status.message).toBe(successMessage);
      expect(status.errorCode).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should reset status to idle', () => {
      service.setError(ErrorCode.SIM_INVALID_PARAMS);
      service.reset();
      const status = service.statusSignal();

      expect(status.status).toBe('idle');
      expect(status.message).toBe('');
      expect(status.errorCode).toBeUndefined();
    });

    it('should be idempotent - multiple resets have consistent state', () => {
      service.setError(ErrorCode.SIM_INVALID_PARAMS);

      // Reset multiple times
      service.reset();
      const status1 = service.statusSignal();

      service.reset();
      const status2 = service.statusSignal();

      service.reset();
      const status3 = service.statusSignal();

      // All should be identical
      expect(status1).toEqual(status2);
      expect(status2).toEqual(status3);
      expect(status1.status).toBe('idle');
      expect(status1.message).toBe('');
      expect(status1.errorCode).toBeUndefined();
    });

    it('should not error when called on idle state', () => {
      // Already idle, reset should be safe
      expect(() => service.reset()).not.toThrow();
      const status = service.statusSignal();

      expect(status.status).toBe('idle');
      expect(status.message).toBe('');
    });
  });

  describe('getErrorMessage', () => {
    it('should return non-empty message for all error codes', () => {
      const codes = [
        ErrorCode.SIM_INVALID_PARAMS,
        ErrorCode.SIM_NON_CONVERGENCE,
        ErrorCode.RENDER_INIT_FAILED,
        ErrorCode.FALLBACK_ACTIVE,
      ];

      codes.forEach((code) => {
        const message = service.getErrorMessage(code);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should return specific message for SIM_INVALID_PARAMS', () => {
      const message = service.getErrorMessage(ErrorCode.SIM_INVALID_PARAMS);
      expect(message).toBe(
        'Invalid simulation parameters. Please check values and try again.'
      );
    });

    it('should return specific message for SIM_NON_CONVERGENCE', () => {
      const message = service.getErrorMessage(ErrorCode.SIM_NON_CONVERGENCE);
      expect(message).toBe(
        'Simulation did not converge within budget. Try adjusting parameters.'
      );
    });

    it('should return specific message for RENDER_INIT_FAILED', () => {
      const message = service.getErrorMessage(ErrorCode.RENDER_INIT_FAILED);
      expect(message).toBe(
        'Graphics initialization failed. Please refresh and try again.'
      );
    });

    it('should return specific message for FALLBACK_ACTIVE', () => {
      const message = service.getErrorMessage(ErrorCode.FALLBACK_ACTIVE);
      expect(message).toBe(
        'WebGL not available; displaying simplified preview.'
      );
    });
  });

  describe('state transitions', () => {
    it('should transition from idle to error to idle', () => {
      expect(service.statusSignal().status).toBe('idle');

      service.setError(ErrorCode.SIM_INVALID_PARAMS);
      expect(service.statusSignal().status).toBe('error');

      service.reset();
      expect(service.statusSignal().status).toBe('idle');
    });

    it('should transition from error to warning to success', () => {
      service.setError(ErrorCode.SIM_INVALID_PARAMS);
      expect(service.statusSignal().status).toBe('error');

      service.setWarning('Warning message');
      expect(service.statusSignal().status).toBe('warning');

      service.setSuccess('Success message');
      expect(service.statusSignal().status).toBe('success');
    });
  });
});
