/**
 * LoggerService unit tests.
 *
 * Tests dev-only logging behavior, runId generation, context preservation,
 * and Performance API span measurement.
 */

import { TestBed } from '@angular/core/testing';
import { LoggerService, LogContext } from './logger.service';
import { environment } from '../../environments/environment';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleLogSpy: jasmine.Spy;
  let performanceMarkSpy: jasmine.Spy;
  let performanceMeasureSpy: jasmine.Spy;
  let originalProduction: boolean;

  beforeEach(() => {
    // Save original production flag
    originalProduction = environment.production;

    // Set up spies
    consoleLogSpy = spyOn(console, 'log');
    performanceMarkSpy = spyOn(performance, 'mark');
    performanceMeasureSpy = spyOn(performance, 'measure');

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    // Restore original production flag
    (environment as { production: boolean }).production = originalProduction;
  });

  describe('Service creation', () => {
    it('should be created', () => {
      service = TestBed.inject(LoggerService);
      expect(service).toBeTruthy();
    });
  });

  describe('runId generation', () => {
    it('should generate a non-empty runId on initialization', () => {
      service = TestBed.inject(LoggerService);
      expect(service.runId).toBeTruthy();
      expect(service.runId.length).toBeGreaterThan(0);
    });

    it('should generate a runId in UUID format', () => {
      service = TestBed.inject(LoggerService);
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(service.runId).toMatch(uuidRegex);
    });

    it('should persist the same runId across multiple calls', () => {
      service = TestBed.inject(LoggerService);
      const runId1 = service.runId;
      const runId2 = service.runId;
      const runId3 = service.runId;

      expect(runId1).toBe(runId2);
      expect(runId2).toBe(runId3);
    });

    it('should generate different runIds for different service instances', () => {
      const service1 = new LoggerService();
      const service2 = new LoggerService();

      expect(service1.runId).not.toBe(service2.runId);
    });
  });

  describe('log() - production mode', () => {
    beforeEach(() => {
      // Set production mode
      (environment as { production: boolean }).production = true;
      service = TestBed.inject(LoggerService);
    });

    it('should not log when in production mode', () => {
      const context: LogContext = {
        module: 'test',
        event: 'test-event',
        runId: service.runId,
      };

      service.log(context, 'Test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log with data when in production mode', () => {
      const context: LogContext = {
        module: 'test',
        event: 'test-event',
        runId: service.runId,
      };

      service.log(context, 'Test message', { key: 'value' });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('log() - dev mode', () => {
    beforeEach(() => {
      // Set dev mode
      (environment as { production: boolean }).production = false;
      service = TestBed.inject(LoggerService);
    });

    it('should log in dev mode', () => {
      const context: LogContext = {
        module: 'engine',
        event: 'stepRound',
        runId: service.runId,
        roundIndex: 5,
      };

      service.log(context, 'Step complete');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include all context fields in log output', () => {
      const context: LogContext = {
        module: 'engine',
        event: 'stepRound',
        runId: service.runId,
        roundIndex: 5,
        metadata: { stepDuration: 16.5 },
      };

      service.log(context, 'Step complete');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[engine:stepRound] Step complete',
        jasmine.objectContaining({
          module: 'engine',
          event: 'stepRound',
          runId: service.runId,
          roundIndex: 5,
          message: 'Step complete',
          metadata: { stepDuration: 16.5 },
          timestamp: jasmine.any(String),
        })
      );
    });

    it('should include optional data in log output', () => {
      const context: LogContext = {
        module: 'render',
        event: 'renderFrame',
        runId: service.runId,
      };
      const data = { fps: 60, frameTime: 16.67 };

      service.log(context, 'Frame rendered', data);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[render:renderFrame] Frame rendered',
        jasmine.objectContaining({
          module: 'render',
          event: 'renderFrame',
          runId: service.runId,
          message: 'Frame rendered',
          data: { fps: 60, frameTime: 16.67 },
          timestamp: jasmine.any(String),
        })
      );
    });

    it('should not include data field when data is undefined', () => {
      const context: LogContext = {
        module: 'ui',
        event: 'buttonClick',
        runId: service.runId,
      };

      service.log(context, 'Button clicked');

      const callArgs = consoleLogSpy.calls.mostRecent().args;
      const logEntry = callArgs[1];

      expect(logEntry.data).toBeUndefined();
    });

    it('should include ISO 8601 timestamp', () => {
      const context: LogContext = {
        module: 'test',
        event: 'test-event',
        runId: service.runId,
      };

      service.log(context, 'Test message');

      const callArgs = consoleLogSpy.calls.mostRecent().args;
      const logEntry = callArgs[1];

      // Verify timestamp is valid ISO 8601 format
      expect(logEntry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should use the same runId across multiple log calls', () => {
      const context1: LogContext = {
        module: 'engine',
        event: 'initialize',
        runId: service.runId,
      };
      const context2: LogContext = {
        module: 'engine',
        event: 'start',
        runId: service.runId,
      };

      service.log(context1, 'Engine initialized');
      service.log(context2, 'Engine started');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      const call1Args = consoleLogSpy.calls.argsFor(0);
      const call2Args = consoleLogSpy.calls.argsFor(1);

      expect(call1Args[1].runId).toBe(call2Args[1].runId);
    });
  });

  describe('measureSpan() - production mode', () => {
    beforeEach(() => {
      // Set production mode
      (environment as { production: boolean }).production = true;
      service = TestBed.inject(LoggerService);
    });

    it('should execute function without performance measurement in production', () => {
      let executed = false;
      const fn = () => {
        executed = true;
      };

      service.measureSpan('test-span', fn);

      expect(executed).toBe(true);
      expect(performanceMarkSpy).not.toHaveBeenCalled();
      expect(performanceMeasureSpy).not.toHaveBeenCalled();
    });
  });

  describe('measureSpan() - dev mode', () => {
    beforeEach(() => {
      // Set dev mode
      (environment as { production: boolean }).production = false;
      service = TestBed.inject(LoggerService);
    });

    it('should execute function with performance measurement in dev', () => {
      let executed = false;
      const fn = () => {
        executed = true;
      };

      service.measureSpan('renderFrame', fn);

      expect(executed).toBe(true);
      expect(performanceMarkSpy).toHaveBeenCalledWith('renderFrame-start');
      expect(performanceMarkSpy).toHaveBeenCalledWith('renderFrame-end');
      expect(performanceMeasureSpy).toHaveBeenCalledWith(
        'renderFrame',
        'renderFrame-start',
        'renderFrame-end'
      );
    });

    it('should create marks and measure in correct order', () => {
      const fn = () => {
        // Empty function
      };

      service.measureSpan('test-span', fn);

      // Verify marks were called before measure
      expect(performanceMarkSpy).toHaveBeenCalledBefore(performanceMeasureSpy);

      // Verify correct number of calls
      expect(performanceMarkSpy).toHaveBeenCalledTimes(2);
      expect(performanceMeasureSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('measureAsync() - production mode', () => {
    beforeEach(() => {
      // Set production mode
      (environment as { production: boolean }).production = true;
      service = TestBed.inject(LoggerService);
    });

    it('should execute async function without performance measurement in production', async () => {
      let executed = false;
      const fn = async () => {
        executed = true;
      };

      await service.measureAsync('test-span', fn);

      expect(executed).toBe(true);
      expect(performanceMarkSpy).not.toHaveBeenCalled();
      expect(performanceMeasureSpy).not.toHaveBeenCalled();
    });
  });

  describe('measureAsync() - dev mode', () => {
    beforeEach(() => {
      // Set dev mode
      (environment as { production: boolean }).production = false;
      service = TestBed.inject(LoggerService);
    });

    it('should execute async function with performance measurement in dev', async () => {
      let executed = false;
      const fn = async () => {
        executed = true;
      };

      await service.measureAsync('asyncOperation', fn);

      expect(executed).toBe(true);
      expect(performanceMarkSpy).toHaveBeenCalledWith('asyncOperation-start');
      expect(performanceMarkSpy).toHaveBeenCalledWith('asyncOperation-end');
      expect(performanceMeasureSpy).toHaveBeenCalledWith(
        'asyncOperation',
        'asyncOperation-start',
        'asyncOperation-end'
      );
    });

    it('should handle async function with delay', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      await service.measureAsync('delayedOperation', fn);

      expect(performanceMarkSpy).toHaveBeenCalledWith('delayedOperation-start');
      expect(performanceMarkSpy).toHaveBeenCalledWith('delayedOperation-end');
      expect(performanceMeasureSpy).toHaveBeenCalledWith(
        'delayedOperation',
        'delayedOperation-start',
        'delayedOperation-end'
      );
    });
  });

  describe('Context preservation', () => {
    beforeEach(() => {
      // Set dev mode
      (environment as { production: boolean }).production = false;
      service = TestBed.inject(LoggerService);
    });

    it('should preserve all context fields including optional ones', () => {
      const context: LogContext = {
        module: 'engine',
        event: 'stepRound',
        runId: service.runId,
        roundIndex: 42,
        metadata: {
          convergenceRate: 0.95,
          iterationsRemaining: 58,
          customData: 'test',
        },
      };

      service.log(context, 'Complex context test');

      const callArgs = consoleLogSpy.calls.mostRecent().args;
      const logEntry = callArgs[1];

      expect(logEntry.module).toBe('engine');
      expect(logEntry.event).toBe('stepRound');
      expect(logEntry.runId).toBe(service.runId);
      expect(logEntry.roundIndex).toBe(42);
      expect(logEntry.metadata).toEqual({
        convergenceRate: 0.95,
        iterationsRemaining: 58,
        customData: 'test',
      });
    });

    it('should work without optional roundIndex', () => {
      const context: LogContext = {
        module: 'ui',
        event: 'init',
        runId: service.runId,
      };

      service.log(context, 'Init without round index');

      const callArgs = consoleLogSpy.calls.mostRecent().args;
      const logEntry = callArgs[1];

      expect(logEntry.roundIndex).toBeUndefined();
      expect(logEntry.module).toBe('ui');
      expect(logEntry.event).toBe('init');
    });

    it('should work without optional metadata', () => {
      const context: LogContext = {
        module: 'render',
        event: 'paint',
        runId: service.runId,
        roundIndex: 10,
      };

      service.log(context, 'Paint without metadata');

      const callArgs = consoleLogSpy.calls.mostRecent().args;
      const logEntry = callArgs[1];

      expect(logEntry.metadata).toBeUndefined();
      expect(logEntry.roundIndex).toBe(10);
    });
  });
});
