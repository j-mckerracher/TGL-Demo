/**
 * Default configuration values
 *
 * Provides sensible defaults for performance parameters, feature flags,
 * and copy templates. Can be extended with environment-specific overrides.
 */

import {
  ConfigV1,
  FeatureFlagsV1,
  PerfDefaultsV1,
  CopyTemplatesV1,
} from './config.types';
import { DEFAULT_THEME_PALETTE, DEFAULT_THEME_MOTION } from './theme';

/**
 * Default feature flags
 *
 * Reduced motion is disabled by default; the app should check
 * the user's prefers-reduced-motion media query and override if needed.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlagsV1 = {
  reducedMotionDefault: false,
};

/**
 * Default performance parameters for simulations
 *
 * These values provide a good balance between:
 * - Visual clarity (enough nodes to see patterns)
 * - Performance (fast enough for interactive exploration)
 * - Statistical validity (enough samples for meaningful results)
 */
export const DEFAULT_PERF_DEFAULTS: PerfDefaultsV1 = {
  nodeCounts: {
    // 50 nodes for mechanism simulations (e.g., Deferred Acceptance)
    mechanism: 50,

    // 50 nodes for P2P network simulations
    p2p: 50,
  },

  // Degree 3 means each node connects to 3 others on average
  // (reasonable for visualizing network topology)
  p2pDegree: 3,

  // Epsilon 0.01 = 1% convergence threshold
  // (tighter tolerance = more accurate but slower convergence)
  epsilon: 0.01,
};

/**
 * Default copy templates for user-facing messages
 *
 * Placeholders:
 * - {percentFewerEdges}: percentage reduction in edge count
 * - {roundsDelta}: difference in number of rounds to convergence
 */
export const DEFAULT_COPY_TEMPLATES: CopyTemplatesV1 = {
  takeawayTemplate:
    '{percentFewerEdges}% fewer edges with {roundsDelta} more rounds',
};

/**
 * Get the full configuration object
 *
 * Currently returns defaults; can be extended to accept environment
 * overrides or load from external sources.
 *
 * @returns Complete configuration object with all defaults
 */
export function getConfig(): ConfigV1 {
  return {
    featureFlags: DEFAULT_FEATURE_FLAGS,
    perf: {
      defaults: DEFAULT_PERF_DEFAULTS,
    },
    theme: {
      palette: DEFAULT_THEME_PALETTE,
      motion: DEFAULT_THEME_MOTION,
    },
    copy: DEFAULT_COPY_TEMPLATES,
  };
}
