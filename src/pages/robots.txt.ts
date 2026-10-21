import type { APIRoute } from 'astro';

// Generated rather than a static file so the sitemap URL follows `site` and `base` per host
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const lines = ['User-agent: *', `Disallow: ${base}/admin/`, `Disallow: ${base}/atsiliepimai/`];
  if (site) lines.push('', `Sitemap: ${new URL(`${base}/sitemap-index.xml`, site).href}`);
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
