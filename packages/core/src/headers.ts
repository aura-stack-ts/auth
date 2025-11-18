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
