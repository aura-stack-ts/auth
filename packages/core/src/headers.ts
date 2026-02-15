/**
 * Headers to prevent caching of responses. It includes Pragma header for HTTP/1.0 compatibility.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Pragma
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
 */
export const cacheControl: HeadersInit = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
}

/**
 * Content Security Policy headers optimized for JSON API endpoints.
 * Provides protection against XSS, clickjacking, and code injection attacks.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
 */
export const contentSecurityPolicy: HeadersInit = {
    "Content-Security-Policy": [
        "default-src 'none'",
        "script-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
    ].join("; "),
}

/**
 * X-Frame-Options is overridden by the frame-ancestors directive in CSP.
 * However, it's included here for compatibility with older browsers that do not support CSP.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
 * @see https://developer.mozilla.org/es/docs/Web/HTTP/Reference/Headers/Referrer-Policy
 */
export const secureHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}

/**
 * Combined security headers for JSON API responses.
 * Includes cache control, CSP, and other security headers.
 */
export const secureApiHeaders: HeadersInit = {
    ...cacheControl,
    ...contentSecurityPolicy,
    ...secureHeaders,
}
