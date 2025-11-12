# Tools and Utilities

This directory contains development tools and utilities for the TGL Results Explorer project.

## Available Tools

### FPS Harness

Performance measurement tool for validating simulation rendering performance.

- **Location**: `tools/fps-harness/`
- **Purpose**: Measures FPS and memory usage during simulation execution
- **Usage**: `npm run perf`
- **Documentation**: [FPS Harness README](./fps-harness/README.md)

## Adding New Tools

When adding new tools to this directory:

1. Create a subdirectory for the tool (e.g., `tools/my-tool/`)
2. Include a README.md with usage instructions
3. Add an npm script to package.json if applicable
4. Update this file with a brief description and link
