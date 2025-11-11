/**
 * Unit tests for configuration library
 *
 * Validates type safety, default values, and config structure
 */

import {
  getConfig,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_PERF_DEFAULTS,
  DEFAULT_THEME_PALETTE,
  DEFAULT_THEME_MOTION,
  DEFAULT_COPY_TEMPLATES,
} from '../public-api';

describe('Config Library', () => {
  describe('getConfig()', () => {
    it('should return a valid ConfigV1 object', () => {
      const config = getConfig();

      expect(config).toBeTruthy();
      expect(config.featureFlags).toBeDefined();
      expect(config.perf).toBeDefined();
      expect(config.perf.defaults).toBeDefined();
      expect(config.theme).toBeDefined();
      expect(config.theme.palette).toBeDefined();
      expect(config.theme.motion).toBeDefined();
      expect(config.copy).toBeDefined();
    });

    it('should include all required top-level config sections', () => {
      const config = getConfig();

      expect(config).toEqual(
        jasmine.objectContaining({
          featureFlags: jasmine.any(Object),
          perf: jasmine.objectContaining({
            defaults: jasmine.any(Object),
          }),
          theme: jasmine.objectContaining({
            palette: jasmine.any(Object),
            motion: jasmine.any(Object),
          }),
          copy: jasmine.any(Object),
        })
      );
    });
  });

  describe('DEFAULT_FEATURE_FLAGS', () => {
    it('should have reducedMotionDefault as a boolean', () => {
      expect(typeof DEFAULT_FEATURE_FLAGS.reducedMotionDefault).toBe(
        'boolean'
      );
    });

    it('should default reducedMotionDefault to false', () => {
      expect(DEFAULT_FEATURE_FLAGS.reducedMotionDefault).toBe(false);
    });
  });

  describe('DEFAULT_PERF_DEFAULTS', () => {
    it('should have all required nested fields', () => {
      expect(DEFAULT_PERF_DEFAULTS.nodeCounts).toBeDefined();
      expect(DEFAULT_PERF_DEFAULTS.nodeCounts.mechanism).toBeDefined();
      expect(DEFAULT_PERF_DEFAULTS.nodeCounts.p2p).toBeDefined();
      expect(DEFAULT_PERF_DEFAULTS.p2pDegree).toBeDefined();
      expect(DEFAULT_PERF_DEFAULTS.epsilon).toBeDefined();
    });

    it('should have numeric values for all perf parameters', () => {
      expect(typeof DEFAULT_PERF_DEFAULTS.nodeCounts.mechanism).toBe('number');
      expect(typeof DEFAULT_PERF_DEFAULTS.nodeCounts.p2p).toBe('number');
      expect(typeof DEFAULT_PERF_DEFAULTS.p2pDegree).toBe('number');
      expect(typeof DEFAULT_PERF_DEFAULTS.epsilon).toBe('number');
    });

    it('should have positive values for node counts and degree', () => {
      expect(DEFAULT_PERF_DEFAULTS.nodeCounts.mechanism).toBeGreaterThan(0);
      expect(DEFAULT_PERF_DEFAULTS.nodeCounts.p2p).toBeGreaterThan(0);
      expect(DEFAULT_PERF_DEFAULTS.p2pDegree).toBeGreaterThan(0);
    });

    it('should have epsilon between 0 and 1', () => {
      expect(DEFAULT_PERF_DEFAULTS.epsilon).toBeGreaterThan(0);
      expect(DEFAULT_PERF_DEFAULTS.epsilon).toBeLessThanOrEqual(1);
    });
  });

  describe('DEFAULT_THEME_PALETTE', () => {
    it('should have all required color properties', () => {
      expect(DEFAULT_THEME_PALETTE.primary).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.secondary).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.neutral).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.alertError).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.alertWarning).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.alertSuccess).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.alertInfo).toBeDefined();
    });

    it('should have all neutral color variants', () => {
      expect(DEFAULT_THEME_PALETTE.neutral.lightest).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.neutral.light).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.neutral.medium).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.neutral.dark).toBeDefined();
      expect(DEFAULT_THEME_PALETTE.neutral.darkest).toBeDefined();
    });

    it('should have non-empty hex color strings', () => {
      expect(DEFAULT_THEME_PALETTE.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DEFAULT_THEME_PALETTE.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DEFAULT_THEME_PALETTE.alertError).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should have distinct primary and secondary colors', () => {
      expect(DEFAULT_THEME_PALETTE.primary).not.toBe(
        DEFAULT_THEME_PALETTE.secondary
      );
    });
  });

  describe('DEFAULT_THEME_MOTION', () => {
    it('should have all required animation duration properties', () => {
      expect(DEFAULT_THEME_MOTION.animationDuration).toBeDefined();
      expect(DEFAULT_THEME_MOTION.animationDurationFast).toBeDefined();
      expect(DEFAULT_THEME_MOTION.animationDurationSlow).toBeDefined();
    });

    it('should have numeric values for all animation durations', () => {
      expect(typeof DEFAULT_THEME_MOTION.animationDuration).toBe('number');
      expect(typeof DEFAULT_THEME_MOTION.animationDurationFast).toBe('number');
      expect(typeof DEFAULT_THEME_MOTION.animationDurationSlow).toBe('number');
    });

    it('should have positive animation durations', () => {
      expect(DEFAULT_THEME_MOTION.animationDuration).toBeGreaterThan(0);
      expect(DEFAULT_THEME_MOTION.animationDurationFast).toBeGreaterThan(0);
      expect(DEFAULT_THEME_MOTION.animationDurationSlow).toBeGreaterThan(0);
    });

    it('should have fast < standard < slow durations', () => {
      expect(DEFAULT_THEME_MOTION.animationDurationFast).toBeLessThan(
        DEFAULT_THEME_MOTION.animationDuration
      );
      expect(DEFAULT_THEME_MOTION.animationDuration).toBeLessThan(
        DEFAULT_THEME_MOTION.animationDurationSlow
      );
    });
  });

  describe('DEFAULT_COPY_TEMPLATES', () => {
    it('should have takeawayTemplate defined', () => {
      expect(DEFAULT_COPY_TEMPLATES.takeawayTemplate).toBeDefined();
    });

    it('should have non-empty takeawayTemplate string', () => {
      expect(typeof DEFAULT_COPY_TEMPLATES.takeawayTemplate).toBe('string');
      expect(DEFAULT_COPY_TEMPLATES.takeawayTemplate.length).toBeGreaterThan(
        0
      );
    });

    it('should have placeholders in takeawayTemplate', () => {
      const template = DEFAULT_COPY_TEMPLATES.takeawayTemplate;
      expect(template).toContain('{');
      expect(template).toContain('}');
    });
  });

  describe('Type safety', () => {
    it('should allow assignment of getConfig result to ConfigV1 type', () => {
      // This test verifies compile-time type safety
      // If types are incorrect, TypeScript compilation will fail
      const config = getConfig();

      // Access nested properties to verify structure
      const _featureFlags = config.featureFlags;
      const _perfDefaults = config.perf.defaults;
      const _themePalette = config.theme.palette;
      const _themeMotion = config.theme.motion;
      const _copyTemplates = config.copy;

      expect(_featureFlags).toBeDefined();
      expect(_perfDefaults).toBeDefined();
      expect(_themePalette).toBeDefined();
      expect(_themeMotion).toBeDefined();
      expect(_copyTemplates).toBeDefined();
    });
  });
});
