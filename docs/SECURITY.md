# Security and Privacy Controls

## Overview

The TGL Results Explorer is designed as an offline-only single-page application (SPA) with a strong security posture:

- **Offline-only SPA**: No backend server or external API calls
- **No telemetry**: Zero data transmission or analytics tracking
- **Static assets only**: All resources served from the same origin
- **CSP enforced**: Content Security Policy prevents injection attacks
- **PWA enabled**: Service worker provides offline capabilities

## Authentication & Authorization

**None required**

- No user accounts or authentication mechanisms
- All application content is public
- No secrets stored in code or configuration

## Data Protection

### Personal Information
- **No PII collected or stored**: The application does not collect, process, or store any personally identifiable information
- **No cookies**: No cookies are used for tracking or session management
- **No local storage of user data**: Local storage is not used to persist user information

### Simulation Data
- **Ephemeral data**: Simulation parameters and results exist only in memory during runtime
- **No persistence**: Results are not saved to disk, localStorage, or any external service
- **Client-side only**: All computations run in the browser with no data transmission

## Input Validation

### Simulation Parameters
- **Slider bounds**: All numeric inputs constrained by minimum/maximum values in UI
- **Type safety**: TypeScript enforces type constraints at compile time
- **Sanitization**: Angular's template binding automatically escapes dynamic content

### URL Parameters
- **Query string parsing**: URL parameters validated and sanitized before use
- **Default fallbacks**: Invalid parameters fall back to safe default values
- **Type coercion**: All inputs coerced to expected types with bounds checking

## Output Encoding

### XSS Prevention
- **Angular template binding**: All dynamic content rendered via Angular's template syntax, which automatically sanitizes output
- **No direct innerHTML**: Application avoids `innerHTML` assignments in production code (only used in test cleanup)
- **No unsafeHtml**: DomSanitizer bypass methods are not used

### Content Rendering
- **Declarative templates**: All UI updates through Angular's data binding
- **Safe DOM manipulation**: ElementRef and Renderer2 used for necessary DOM operations
- **Chart rendering**: D3.js/Canvas operations use numeric data only, no string interpolation in dynamic contexts

## Supply Chain Security

### Dependency Management
- **Lockfile commits**: `package-lock.json` committed for reproducible builds
- **Dependency scanning**: Run `npm audit` regularly to identify known vulnerabilities
- **Integrity checksums**: npm verifies package integrity automatically via lockfile
- **Minimal dependencies**: Small dependency footprint reduces attack surface

### Build Process
- **Reproducible builds**: Deterministic build output via locked dependencies
- **Source verification**: All dependencies sourced from npm registry
- **No build-time secrets**: No API keys or credentials required for building

### Recommended CI Checks
```bash
# Check for known vulnerabilities
npm audit --audit-level=moderate

# Verify lockfile integrity
npm ci

# Type checking
npx tsc --noEmit

# Linting (includes security rules)
npm run lint
```

## Content Security Policy

See [docs/CSP.md](./CSP.md) for detailed Content Security Policy documentation.

**Summary**: A locked-down CSP is enforced at the host level to prevent:
- Inline script execution
- External resource loading
- eval() and related dynamic code evaluation
- Unauthorized network requests

## Accessibility & Privacy

### WCAG Compliance
- **Text contrast**: WCAG AA standards met for all text/background combinations
- **Keyboard navigation**: Full keyboard accessibility without mouse
- **Screen reader support**: ARIA labels and landmarks for assistive technology
- **Motion preferences**: `prefers-reduced-motion` media query respected

### Privacy-First Design
- **No tracking**: No analytics, telemetry, or user behavior monitoring
- **No external fonts**: All fonts served from same origin (no Google Fonts, etc.)
- **No CDN resources**: All scripts and styles bundled locally
- **No third-party widgets**: No social media buttons, ads, or external embeds

## Security Best Practices for Developers

### Code Review Checklist
- [ ] No use of `eval()`, `Function()`, or `setTimeout(string)`
- [ ] No `innerHTML` assignments outside test cleanup
- [ ] All user inputs validated and bounded
- [ ] No secrets or API keys in source code
- [ ] Dependencies reviewed and up-to-date
- [ ] TypeScript strict mode enabled
- [ ] ESLint security rules passing

### Reporting Security Issues

If you discover a security vulnerability:
1. **Do not** open a public GitHub issue
2. Contact the maintainers directly via email
3. Provide detailed reproduction steps
4. Allow reasonable time for patching before public disclosure

---

**Last Updated**: 2025-11-12
**Next Review**: 2026-05-12
