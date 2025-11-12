# Content Security Policy

## Overview

This document describes the Content Security Policy (CSP) recommended for the TGL Results Explorer application. The policy is designed to prevent code injection attacks, disable dynamic script evaluation, and lock all resources to the application origin.

## Recommended Policy

The following CSP should be enforced via HTTP headers at the host/deployment level:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none';
```

### Directive Breakdown

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Restrict all resource types to same origin by default |
| `script-src` | `'self'` | Scripts only from application origin; no inline scripts, no eval() |
| `style-src` | `'self' 'unsafe-inline'` | Styles from origin plus inline CSS (required for Angular component styles) |
| `img-src` | `'self' data:` | Images from origin and data URIs (for placeholders, base64-encoded assets) |
| `font-src` | `'self'` | Web fonts from application origin only |
| `connect-src` | `'none'` | No external API calls, XHR, WebSocket, or fetch requests allowed |

### Directive Details

#### `default-src 'self'`
- Serves as fallback for all resource types not explicitly defined
- Restricts everything to same-origin by default
- Prevents loading of any external resources

#### `script-src 'self'`
- **Allows**: JavaScript files served from the application's origin
- **Blocks**:
  - Inline `<script>` tags (prevents XSS)
  - `eval()` and related functions (prevents code injection)
  - External scripts from CDNs or third-party domains
  - `data:` or `blob:` URLs for scripts
- **Angular compatibility**: Angular's AOT (Ahead-of-Time) compilation produces CSP-compliant code

#### `style-src 'self' 'unsafe-inline'`
- **Allows**:
  - CSS files from application origin
  - Inline styles (required for Angular component styles)
- **Why 'unsafe-inline'**: Angular component styles are often inlined by the build process
- **Risk mitigation**: While 'unsafe-inline' reduces CSP protection for styles, the risk is lower than for scripts since CSS cannot execute code

#### `img-src 'self' data:`
- **Allows**:
  - Images from application origin
  - Data URIs (e.g., `data:image/png;base64,...`)
- **Use cases**:
  - Static assets bundled with the application
  - Base64-encoded placeholders or fallback images
  - Canvas-generated images exported as data URLs

#### `font-src 'self'`
- Fonts must be served from application origin
- Prevents loading fonts from external CDNs (e.g., Google Fonts)
- All web fonts bundled with the application

#### `connect-src 'none'`
- **Blocks all network requests**:
  - XMLHttpRequest (AJAX)
  - fetch() API
  - WebSocket connections
  - EventSource (Server-Sent Events)
- **Rationale**: Application is offline-only with no backend API
- **Note**: Service worker fetch events are not blocked by this directive

## Enforcement Location

### Production Deployment
CSP must be enforced at the **host level** via HTTP response headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none';
```

**Implementation examples**:

- **Nginx**:
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none';" always;
  ```

- **Apache**:
  ```apache
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none';"
  ```

- **Node.js (Express)**:
  ```javascript
  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none';");
    next();
  });
  ```

### Development Environment
- CSP is **not enforced** during local development (`ng serve`)
- Developers should test CSP compliance before deployment
- Use browser DevTools to monitor CSP violations

## Violations and Debugging

### Detecting Violations
When CSP blocks a resource, the browser logs a violation to the console:

```
Refused to load the script 'https://cdn.example.com/script.js'
because it violates the following Content Security Policy directive:
"script-src 'self'".
```

### Common Violation Causes

| Violation Type | Cause | Solution |
|----------------|-------|----------|
| Inline script blocked | `<script>alert('hi')</script>` | Move script to external file or use Angular event binding |
| Inline event handler | `<button onclick="...">` | Use Angular `(click)="method()"` binding |
| eval() usage | `eval(userInput)` | Refactor to avoid dynamic code evaluation |
| External script | `<script src="https://cdn...">` | Bundle script locally via npm and import |
| External font | Google Fonts, etc. | Download and serve fonts from `assets/fonts/` |
| API call blocked | `fetch('https://api...')` | Application should not make external calls (offline-only) |

### Testing CSP Before Enforcement

Use **report-only mode** to test without blocking resources:

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none';
```

This logs violations to the console without blocking them, allowing you to identify issues before enforcement.

## Rationale

### Security Benefits
1. **XSS Prevention**: Blocks inline scripts and event handlers that are common XSS vectors
2. **Code Injection Defense**: Disables `eval()`, `Function()`, and string-to-code execution
3. **Resource Isolation**: Prevents unauthorized external resource loading
4. **Data Exfiltration Prevention**: `connect-src 'none'` blocks network requests that could leak data
5. **Third-Party Risk Mitigation**: No external CDNs or services reduces supply chain risk

### Privacy Benefits
1. **No Telemetry**: `connect-src 'none'` prevents analytics or tracking beacons
2. **No Third-Party Cookies**: External resources blocked, so no third-party cookies can be set
3. **No External Fonts**: Prevents font-based tracking (e.g., Google Fonts tracking)
4. **Offline Capability**: CSP aligns with offline-first PWA architecture

### Compliance
- Aligns with OWASP security best practices
- Supports data protection requirements (no data transmission)
- Enables auditable security posture for sensitive deployments

## Maintenance

### When to Update CSP
- **New resource types**: If application adds new media types (video, audio), update directives
- **Build process changes**: If Angular build output changes (e.g., inline styles → external), adjust `style-src`
- **External dependencies**: If legitimate external resource is required, carefully scope the allowlist (avoid 'unsafe-inline', 'unsafe-eval')

### Review Schedule
- Review CSP policy every 6 months
- Audit CSP compliance after major Angular version upgrades
- Test CSP in staging environment before production deployment

## Migration Path

If existing deployments use a more permissive CSP:

1. **Audit current policy**: Identify gaps between current and recommended policy
2. **Deploy in report-only mode**: Monitor violations without blocking
3. **Fix violations**: Refactor code to eliminate CSP violations
4. **Gradual enforcement**: Tighten one directive at a time
5. **Full enforcement**: Deploy recommended policy

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Angular Security Guide](https://angular.dev/best-practices/security)

---

**Last Updated**: 2025-11-12
**Next Review**: 2026-05-12
