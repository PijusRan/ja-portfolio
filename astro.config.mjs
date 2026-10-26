import { defineConfig } from 'astro/config';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import sitemap from '@astrojs/sitemap';

// Fails the build if an original photo ends up in the output. Originals are copied as name.<hash>.ext,
// while generated variants get an extra _suffix (name.<hash>_<suffix>.ext).
function noOriginals() {
  return {
    name: 'no-original-photos',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const assets = fileURLToPath(new URL('_astro/', dir));
        let files = [];
        try {
          files = readdirSync(assets);
        } catch {}
        const leaked = files.filter((f) => /\.[\w-]{8}\.(jpe?g|png|heic|heif|tiff?)$/i.test(f));
        if (leaked.length) throw new Error(`Original photos in the build output: ${leaked.join(', ')}`);
      },
    },
  };
}

// Deployed on Netlify (NETLIFY=true on its build machines) as plain static output.
// https://astro.build/config
export default defineConfig({
  site: process.env.URL ?? 'https://andzius.lt',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/atsiliepimai/') && !page.includes('/admin'),
    }),
    noOriginals(),
  ],
  security: {
    csp: {
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  // public/admin/index.html isn't index-resolved by the dev server when requested without the filename.
  redirects: {
    '/admin': '/admin/index.html',
    '/admin/': '/admin/index.html',
  },
});
