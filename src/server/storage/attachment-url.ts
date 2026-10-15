/**
 * The only link an attachment ever has: Pulse's own download route, which
 * checks the viewer may see it. Older uploads stored a public R2 address;
 * mapping every attachment through here keeps those addresses out of the API.
 */
export function attachmentUrl(uploadId: string): string {
  return `/api/uploads/${uploadId}/file`;
}
