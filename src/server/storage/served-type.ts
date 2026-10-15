/**
 * How an uploaded file may be served.
 *
 * The type comes from the uploader's browser, so it is only a claim. Served
 * as given, a file claiming text/html (or SVG, which can carry script) would
 * run as a page on whatever origin serves it. Only plain raster images are
 * shown inline; everything else is a download the browser won't render.
 */
const INLINE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export function isInlineImage(mime: string): boolean {
  return INLINE_IMAGE_TYPES.has(mime.toLowerCase());
}

export function servedContentType(mime: string): string {
  return isInlineImage(mime) ? mime.toLowerCase() : "application/octet-stream";
}

/** Headers for serving an upload's bytes from this app's origin. */
export function uploadResponseHeaders(mime: string, filename: string): Record<string, string> {
  const inline = isInlineImage(mime);
  return {
    "content-type": servedContentType(mime),
    "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "x-content-type-options": "nosniff",
    // Even if a browser did render it, nothing in it can run or load.
    "content-security-policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    "cache-control": "private, max-age=3600",
  };
}
