import { describe, expect, it } from "vitest";
import { isInlineImage, servedContentType, uploadResponseHeaders } from "@/src/server/storage/served-type";

describe("served upload types", () => {
  it("shows plain images inline", () => {
    for (const mime of ["image/png", "image/jpeg", "image/gif", "image/webp", "IMAGE/PNG"]) {
      expect(isInlineImage(mime)).toBe(true);
      expect(uploadResponseHeaders(mime, "a.png")["content-disposition"]).toMatch(/^inline;/);
    }
  });

  it("never serves an uploader's claimed HTML, SVG or script as such", () => {
    for (const mime of ["text/html", "image/svg+xml", "application/xhtml+xml", "text/javascript", "application/pdf", ""]) {
      expect(servedContentType(mime)).toBe("application/octet-stream");
      const headers = uploadResponseHeaders(mime, "evil.html");
      expect(headers["content-type"]).toBe("application/octet-stream");
      expect(headers["content-disposition"]).toMatch(/^attachment;/);
    }
  });

  it("always sends nosniff and a sandbox policy, and encodes the file name", () => {
    const headers = uploadResponseHeaders("image/png", 'a"; x=".png');
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("sandbox");
    expect(headers["content-disposition"]).not.toContain('"; x="');
  });
});
