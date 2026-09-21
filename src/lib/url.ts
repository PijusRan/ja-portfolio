/** Prefix an absolute site path with the configured `base` (e.g. /ad-portfolio on GitHub Pages). */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path; // mailto:, https:, etc.
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path;
}
