/*
 * Public API Surface of config
 */

// Type definitions
export type {
  ConfigV1,
  FeatureFlagsV1,
  PerfDefaultsV1,
  ThemePaletteV1,
  ThemeMotionV1,
  CopyTemplatesV1,
} from './lib/config.types';

// Default constants
export {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_PERF_DEFAULTS,
  DEFAULT_COPY_TEMPLATES,
  getConfig,
} from './lib/defaults';

export {
  DEFAULT_THEME_PALETTE,
  DEFAULT_THEME_MOTION,
} from './lib/theme';
