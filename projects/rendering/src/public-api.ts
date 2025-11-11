/*
 * Public API Surface of rendering
 */

export * from './lib/rendering';

// Rendering adapter exports
export type {
  ThemeV1,
  RenderingCapabilities,
  RenderingAdapterV1,
} from './lib/adapter/types';
export { createRenderingAdapterV1 } from './lib/adapter/rendering_adapter_v1';
