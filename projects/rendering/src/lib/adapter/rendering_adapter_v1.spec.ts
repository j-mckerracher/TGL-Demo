/**
 * Unit tests for RenderingAdapterV1.
 *
 * Tests verify:
 * - Capability detection for WebGL
 * - Safe no-op behavior before initialization
 * - Idempotent dispose
 * - Lifecycle management
 */

import { createRenderingAdapterV1 } from './rendering_adapter_v1';
import type { SimulationStateV1 } from 'simulation';
import type { ThemeV1 } from './types';

describe('RenderingAdapterV1', () => {
  const mockTheme: ThemeV1 = {
    palette: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#1e293b',
      accent: '#f59e0b',
    },
    motion: {
      animationDuration: 300,
      enableTransitions: true,
    },
  };

  const mockState: SimulationStateV1 = {
    roundIndex: 5,
    phase: 'run',
    randomState: { seed: 42 },
  };

  describe('capability detection', () => {
    it('should return capabilities object with webgl property', () => {
      const adapter = createRenderingAdapterV1();
      const capabilities = adapter.capabilities();

      expect(capabilities).toBeDefined();
      expect(typeof capabilities.webgl).toBe('boolean');
    });

    it('should detect WebGL as unavailable with mock canvas that returns null', () => {
      const adapter = createRenderingAdapterV1();

      // Create a mock canvas that doesn't support WebGL
      const mockCanvas = document.createElement('canvas');
      const originalGetContext = mockCanvas.getContext.bind(mockCanvas);

      // Mock getContext to return null for WebGL contexts
      mockCanvas.getContext = jasmine
        .createSpy('getContext')
        .and.returnValue(null);

      // Initialize with mock canvas (this should work even though WebGL isn't available)
      adapter.init(mockCanvas, mockTheme);

      // Now check capabilities - should report webgl as false
      // Note: capabilities() uses the adapter's canvas if available
      const capabilities = adapter.capabilities();

      // The implementation tries to get context, and our mock returns null
      expect(capabilities.webgl).toBe(false);

      adapter.dispose();
      mockCanvas.getContext = originalGetContext;
    });

    it('should detect WebGL as available with mock canvas that returns context', () => {
      const adapter = createRenderingAdapterV1();

      // Create a mock canvas with a fake WebGL context
      const mockCanvas = document.createElement('canvas');
      const originalGetContext = mockCanvas.getContext.bind(mockCanvas);

      const mockContext = {
        getExtension: jasmine.createSpy('getExtension').and.returnValue({
          loseContext: jasmine.createSpy('loseContext'),
        }),
      };

      // Mock getContext to return our fake context
      mockCanvas.getContext = jasmine
        .createSpy('getContext')
        .and.returnValue(mockContext);

      adapter.init(mockCanvas, mockTheme);
      const capabilities = adapter.capabilities();

      // Should detect WebGL as available
      expect(capabilities.webgl).toBe(true);

      adapter.dispose();
      mockCanvas.getContext = originalGetContext;
    });
  });

  describe('safe no-op behavior', () => {
    it('should allow renderDiscrete() before init without errors', () => {
      const adapter = createRenderingAdapterV1();

      // Should not throw
      expect(() => adapter.renderDiscrete()).not.toThrow();
    });

    it('should allow syncState() before init without errors', () => {
      const adapter = createRenderingAdapterV1();

      // Should not throw
      expect(() => adapter.syncState(mockState)).not.toThrow();
    });

    it('should allow renderFrame() before init without errors', () => {
      const adapter = createRenderingAdapterV1();

      // Should not throw
      expect(() => adapter.renderFrame()).not.toThrow();
    });

    it('should allow capabilities() before init without errors', () => {
      const adapter = createRenderingAdapterV1();

      // Should not throw
      expect(() => adapter.capabilities()).not.toThrow();
    });
  });

  describe('idempotent dispose', () => {
    it('should allow dispose() to be called multiple times without errors', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      adapter.init(canvas, mockTheme);

      // Call dispose multiple times - should not throw
      expect(() => adapter.dispose()).not.toThrow();
      expect(() => adapter.dispose()).not.toThrow();
      expect(() => adapter.dispose()).not.toThrow();
    });

    it('should allow dispose() without init', () => {
      const adapter = createRenderingAdapterV1();

      // Should not throw even if never initialized
      expect(() => adapter.dispose()).not.toThrow();
    });

    it('should be safe to call operations after dispose', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      adapter.init(canvas, mockTheme);
      adapter.dispose();

      // Operations should be safe (no-op) after dispose
      expect(() => adapter.syncState(mockState)).not.toThrow();
      expect(() => adapter.renderFrame()).not.toThrow();
      expect(() => adapter.renderDiscrete()).not.toThrow();
      expect(() => adapter.capabilities()).not.toThrow();
    });
  });

  describe('lifecycle management', () => {
    it('should initialize with canvas and theme', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      expect(() => adapter.init(canvas, mockTheme)).not.toThrow();

      adapter.dispose();
    });

    it('should throw error if initialized with invalid canvas', () => {
      const adapter = createRenderingAdapterV1();
      const notACanvas = document.createElement('div');

      expect(() =>
        adapter.init(notACanvas as any, mockTheme)
      ).toThrowError(/Invalid canvas/);
    });

    it('should accept syncState after initialization', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      adapter.init(canvas, mockTheme);

      expect(() => adapter.syncState(mockState)).not.toThrow();

      adapter.dispose();
    });

    it('should accept renderFrame after initialization', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      adapter.init(canvas, mockTheme);

      expect(() => adapter.renderFrame()).not.toThrow();

      adapter.dispose();
    });

    it('should accept renderDiscrete after initialization', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      adapter.init(canvas, mockTheme);

      expect(() => adapter.renderDiscrete()).not.toThrow();

      adapter.dispose();
    });

    it('should complete full lifecycle: init, sync, render, dispose', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      // Initialize
      adapter.init(canvas, mockTheme);

      // Sync state
      adapter.syncState(mockState);

      // Render both ways
      adapter.renderFrame();
      adapter.renderDiscrete();

      // Dispose
      adapter.dispose();

      // All operations should have completed without errors
      expect(true).toBe(true);
    });

    it('should allow re-initialization after dispose', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      // First lifecycle
      adapter.init(canvas, mockTheme);
      adapter.syncState(mockState);
      adapter.dispose();

      // Second lifecycle
      expect(() => adapter.init(canvas, mockTheme)).not.toThrow();
      expect(() => adapter.syncState(mockState)).not.toThrow();
      expect(() => adapter.dispose()).not.toThrow();
    });
  });

  describe('state synchronization', () => {
    it('should accept different simulation states', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      adapter.init(canvas, mockTheme);

      const state1: SimulationStateV1 = {
        roundIndex: 0,
        phase: 'setup',
        randomState: {},
      };
      const state2: SimulationStateV1 = {
        roundIndex: 10,
        phase: 'run',
        randomState: {},
      };
      const state3: SimulationStateV1 = {
        roundIndex: 25,
        phase: 'done',
        randomState: {},
      };

      expect(() => adapter.syncState(state1)).not.toThrow();
      expect(() => adapter.syncState(state2)).not.toThrow();
      expect(() => adapter.syncState(state3)).not.toThrow();

      adapter.dispose();
    });
  });

  describe('theme configuration', () => {
    it('should accept different theme configurations', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      const lightTheme: ThemeV1 = {
        palette: {
          primary: '#ffffff',
          secondary: '#000000',
          background: '#f5f5f5',
          accent: '#ff0000',
        },
        motion: {
          animationDuration: 0,
          enableTransitions: false,
        },
      };

      expect(() => adapter.init(canvas, lightTheme)).not.toThrow();

      adapter.dispose();
    });

    it('should accept reduced motion theme', () => {
      const adapter = createRenderingAdapterV1();
      const canvas = document.createElement('canvas');

      const reducedMotionTheme: ThemeV1 = {
        palette: mockTheme.palette,
        motion: {
          animationDuration: 0,
          enableTransitions: false,
        },
      };

      expect(() => adapter.init(canvas, reducedMotionTheme)).not.toThrow();

      adapter.dispose();
    });
  });

  describe('factory function', () => {
    it('should create new independent adapter instances', () => {
      const adapter1 = createRenderingAdapterV1();
      const adapter2 = createRenderingAdapterV1();

      expect(adapter1).toBeDefined();
      expect(adapter2).toBeDefined();
      expect(adapter1).not.toBe(adapter2);
    });

    it('should create adapters that work independently', () => {
      const adapter1 = createRenderingAdapterV1();
      const adapter2 = createRenderingAdapterV1();
      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');

      adapter1.init(canvas1, mockTheme);
      adapter2.init(canvas2, mockTheme);

      adapter1.dispose();

      // adapter2 should still work after adapter1 is disposed
      expect(() => adapter2.renderFrame()).not.toThrow();

      adapter2.dispose();
    });
  });
});
