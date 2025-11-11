/**
 * Theme configuration with color-blind-safe palette
 *
 * Color choices are designed to be distinguishable for users with
 * deuteranopia and protanopia (red-green color blindness).
 * Uses blue-orange-neutral palette with high contrast.
 */

import { ThemePaletteV1, ThemeMotionV1 } from './config.types';

/**
 * Default color palette
 *
 * Color accessibility notes:
 * - Primary (blue) and secondary (orange) are distinguishable in all color vision types
 * - Alert colors use distinct hues and brightness levels
 * - Neutral scale provides WCAG AA-compliant contrast ratios
 */
export const DEFAULT_THEME_PALETTE: ThemePaletteV1 = {
  // Primary brand color - accessible blue
  primary: '#0066CC',

  // Secondary accent - warm orange (distinct from blue in all color vision types)
  secondary: '#E67E22',

  // Neutral scale - grays with good contrast ratios
  neutral: {
    lightest: '#F8F9FA', // Near white background
    light: '#E9ECEF',    // Light gray for subtle backgrounds
    medium: '#6C757D',   // Medium gray for secondary text
    dark: '#343A40',     // Dark gray for primary text
    darkest: '#212529',  // Near black for high emphasis
  },

  // Alert colors - chosen for distinctness in color-blind vision
  alertError: '#C0392B',    // Deep red-orange (not pure red)
  alertWarning: '#F39C12',  // Amber/gold (distinct from orange secondary)
  alertSuccess: '#27AE60',  // Teal-green (blue-shifted to remain distinct)
  alertInfo: '#3498DB',     // Bright blue (lighter than primary)
};

/**
 * Default motion/animation settings
 *
 * Standard duration follows Material Design timing recommendations
 * (200-500ms for most UI transitions)
 */
export const DEFAULT_THEME_MOTION: ThemeMotionV1 = {
  // Standard animation duration for most transitions
  animationDuration: 300,

  // Fast animations for immediate feedback
  animationDurationFast: 150,

  // Slow animations for emphasis or complex transitions
  animationDurationSlow: 500,
};
