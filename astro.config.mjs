import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// GitHub Pages builds set GITHUB_PAGES=true (and BASE_PATH to "/<repo-name>") in
// .github/workflows/deploy.yml. Netlify sets NETLIFY=true on its build machines.
// Everything else (local dev, Vercel) builds as before.
const onPages = process.env.GITHUB_PAGES === 'true';
const onNetlify = process.env.NETLIFY === 'true';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  ...(onPages
    ? {
        // Plain static output, no adapter
        site: process.env.SITE_URL,
        base: process.env.BASE_PATH,
      }
    : onNetlify
    ? {
        // Plain static output into dist/, served at the site root. Netlify resolves
        // /admin and /admin/ to public/admin/index.html by itself.
        site: process.env.URL,
      }
    : {
        adapter: vercel(),
        // public/admin/index.html isn't index-resolved by the dev server (or by
        // some static hosts) when requested without the filename. GitHub Pages
        // does resolve it, and a redirect there would collide with the file.
        redirects: {
          '/admin': '/admin/index.html',
          '/admin/': '/admin/index.html',
        },
      }),
});
