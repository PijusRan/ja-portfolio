# Andzius Photography Portfolio

A serverless Jamstack portfolio: **Astro** (with **React** islands) for the site,
**Decap CMS** for content editing, **Cloudinary** for image hosting/optimization,
and **Vercel** for hosting + CI/CD. See `tech_stack_documentation.md` for the
full architecture writeup.

## Project structure

```text
/
├── public/
│   └── admin/            # Decap CMS (visit /admin to edit content)
├── src/
│   ├── components/
│   │   └── Lightbox.tsx  # React island: photo grid + lightbox modal
│   ├── content/
│   │   └── galleries/    # One markdown file per gallery (edited via /admin)
│   ├── content.config.ts # Schema for the `galleries` collection
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   └── cloudinary.ts # Builds responsive Cloudinary image URLs
│   └── pages/
│       ├── index.astro           # Homepage: gallery grid
│       └── gallery/[slug].astro  # One page per gallery
└── package.json
```

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`        | Start local dev server at `localhost:4321`  |
| `npm run build`       | Build the production site to `./dist/`      |
| `npm run preview`      | Preview the build locally                   |
| `npx decap-server`      | Local CMS backend (run alongside `npm run dev`) |

## Setup

### 1. Cloudinary (image hosting)

1. Create a free account at cloudinary.com and note your **cloud name**.
2. Copy `.env.example` to `.env` and set `PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. In the Cloudinary dashboard, create an **unsigned upload preset** (Settings
   → Upload) so the CMS can upload images from the browser without a backend.
4. In `public/admin/config.yml`, replace `YOUR_CLOUDINARY_CLOUD_NAME` and
   `YOUR_CLOUDINARY_API_KEY` under `media_library`.

### 2. Decap CMS (content editing)

- **Local editing** (no accounts needed): run `npx decap-server` in one
  terminal and `npm run dev` in another, then open `/admin`. Changes are
  written straight to `src/content/galleries/*.md` on disk.
- **Production editing**: the CMS is configured with the `github` backend, so
  the photographer logs in with GitHub to edit content on the live site. This
  needs an OAuth app + a small proxy (Vercel has no built-in one, unlike
  Netlify):
  1. Create a GitHub OAuth App (Settings → Developer settings) with callback
     URL `https://api.netlify.com/auth/done` (Netlify's OAuth proxy is free to
     use even when hosting elsewhere) or deploy a
     [self-hosted OAuth provider](https://decapcms.org/docs/external-oauth-clients/).
  2. Update `public/admin/config.yml`: set `repo` to your real
     `owner/andzius-portfolio`, and set `base_url` to the OAuth provider's URL
     if self-hosting.

### 3. Vercel (hosting)

1. Import the GitHub repo at vercel.com — the `@astrojs/vercel` adapter is
   already configured, so no build settings are needed.
2. Add `PUBLIC_CLOUDINARY_CLOUD_NAME` as an environment variable in the Vercel
   project settings.
3. Every push to `main` (including CMS commits) triggers a rebuild.

## Adding a gallery

Either use `/admin` once the CMS is wired up, or add a markdown file to
`src/content/galleries/` — see `src/content/galleries/wedding-in-vilnius.md`
for the expected shape (`title`, `coverImage`, `photos[]`, etc., validated by
`src/content.config.ts`).
