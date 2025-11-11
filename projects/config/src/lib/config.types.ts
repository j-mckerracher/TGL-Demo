/**
 * Configuration type definitions for TGL Results Explorer
 *
 * Defines the shape of all configuration objects including feature flags,
 * performance defaults, theme settings, and copy templates.
 */

/**
 * Feature flags for enabling/disabling application features
 */
export interface FeatureFlagsV1 {
  /**
   * Whether reduced motion should be enabled by default
   * (respects user's prefers-reduced-motion setting)
   */
  reducedMotionDefault: boolean;
}

/**
 * Default performance parameters for simulations
 */
export interface PerfDefaultsV1 {
  /**
   * Default node counts for different simulation types
   */
  nodeCounts: {
    /** Default number of nodes for mechanism simulations */
    mechanism: number;
    /** Default number of nodes for P2P simulations */
    p2p: number;
  };

  /**
   * Default degree (number of connections per node) for P2P networks
   */
  p2pDegree: number;

  /**
   * Epsilon value for simulation convergence threshold
   */
  epsilon: number;
}

/**
 * Color palette for application theme
 * Uses color-blind-safe values (accessible for deuteranopia/protanopia)
 */
export interface ThemePaletteV1 {
  /** Primary brand color */
  primary: string;

  /** Secondary accent color */
  secondary: string;

  /** Neutral colors for backgrounds and borders */
  neutral: {
    lightest: string;
    light: string;
    medium: string;
    dark: string;
    darkest: string;
  };

  /** Alert/error state color */
  alertError: string;

  /** Warning state color */
  alertWarning: string;

  /** Success state color */
  alertSuccess: string;

  /** Informational state color */
  alertInfo: string;
}

/**
 * Animation and motion settings for the theme
 */
export interface ThemeMotionV1 {
  /**
   * Standard animation duration in milliseconds
   */
  animationDuration: number;

  /**
   * Fast animation duration for quick transitions
   */
  animationDurationFast: number;

  /**
   * Slow animation duration for emphasis
   */
  animationDurationSlow: number;
}

/**
 * Template strings for user-facing copy
 */
export interface CopyTemplatesV1 {
  /**
   * Template for takeaway messages comparing two simulations
   * Placeholders: {percentFewerEdges}, {roundsDelta}
   */
  takeawayTemplate: string;
}

/**
 * Root configuration object combining all config sections
 */
export interface ConfigV1 {
  /** Feature flags */
  featureFlags: FeatureFlagsV1;

  /** Performance defaults */
  perf: {
    defaults: PerfDefaultsV1;
  };

  /** Theme configuration */
  theme: {
    palette: ThemePaletteV1;
    motion: ThemeMotionV1;
  };

  /** Copy templates */
  copy: CopyTemplatesV1;
}
