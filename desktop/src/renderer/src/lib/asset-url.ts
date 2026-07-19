/** Resolve static assets for Electron file:// loads (hash routes break import.meta.url imports). */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = relativePath.replace(/^\//, "");
  return `${base}${normalized}`;
}
