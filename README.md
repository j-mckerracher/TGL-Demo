# p2p-tgl-demo

An Angular-based peer-to-peer Three.js Graphics Library demonstration project, showcasing efficient canvas-based 3D rendering and WebRTC-driven simulation sharing.

## Overview

This project demonstrates:
- Custom Three.js integration with Angular 17
- Efficient 2D/3D rendering pipelines
- Performance-optimized bundle configuration
- Modern TypeScript development practices

## Prerequisites

- Node.js >= 18.x
- npm >= 10.x

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload when source files change.

## Build

Build the project for production:

```bash
npm run build:prod
```

Production build artifacts will be stored in `dist/p2p-tgl-demo/browser/`.

## Code Quality

Run ESLint:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

## Deployment

This project is configured for deployment on Vercel using the `vercel.json` configuration file. The build command, output directory, SPA rewrites, and security headers are pre-configured.

To deploy:

```bash
npx vercel
```

## Bundle Budgets

Production builds enforce bundle size limits:
- Main bundle: warning at 500KB, error at 800KB
- Component styles: warning at 4KB, error at 8KB

## Tech Stack

- **Framework**: Angular 17
- **3D Graphics**: Three.js v0.128.0
- **Language**: TypeScript 5.2
- **Linting**: ESLint with Angular and TypeScript plugins
- **Formatting**: Prettier
- **Deployment**: Vercel
