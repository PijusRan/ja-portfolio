# JA Photography Portfolio

A serverless Jamstack portfolio: **Astro** (with **React** islands) for the site,
**Decap CMS** for content editing, and **Vercel** for hosting + CI/CD. Photos are
committed straight into the repo alongside their gallery entry and optimized
(responsive sizes, WebP) at build time by Astro's built-in image pipeline — no
external image/CDN service required. See `tech_stack_documentation.md` for the
original architecture writeup (note: that doc still mentions Cloudinary, which
this project has since dropped in favor of the git + `astro:assets` approach
below).

## Project structure

```text
/
├── public/
│   └── admin/                    # Decap CMS (visit /admin to edit content)
├── src/
│   ├── assets/
│   │   └── uploads/               # Fallback media folder (rarely used, see below)
│   ├── components/
│   │   └── Lightbox.tsx           # React island: photo grid + lightbox modal
│   ├── content/
│   │   └── galleries/
│   │       └── <slug>/            # One folder per gallery, edited via /admin
│   │           ├── index.md       # Title, description, photo list
│   │           └── *.jpg          # Photos, co-located with their entry
│   ├── content.config.ts          # Schema for the `galleries` collection
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── index.astro            # Homepage: gallery grid
│       └── gallery/[slug].astro   # One page per gallery
└── package.json
```

## Commands

| Command             | Action                                          |
| :------------------- | :----------------------------------------------- |
| `npm install`         | Install dependencies                            |
| `npm run dev`          | Start local dev server at `localhost:4321`      |
| `npm run build`         | Build the production site to `./dist/`          |
| `npm run preview`        | Preview the build locally                       |
| `npx decap-server`        | Local CMS backend (run alongside `npm run dev`) |

## Setup

### 1. Decap CMS (content editing)

- **Local editing** (no accounts needed): run `npx decap-server` in one
  terminal and `npm run dev` in another, then open `/admin`. Changes — including
  uploaded photos — are written straight to
  `src/content/galleries/<slug>/` on disk.
- **Production editing**: the CMS is configured with the `github` backend, so
  the photographer logs in with GitHub to edit content on the live site. This
  needs an OAuth app + a small proxy (Vercel has no built-in one, unlike
  Netlify):
  1. Create a GitHub OAuth App (Settings → Developer settings) with callback
     URL `https://api.netlify.com/auth/done` (Netlify's OAuth proxy is free to
     use even when hosting elsewhere) or deploy a
     [self-hosted OAuth provider](https://decapcms.org/docs/external-oauth-clients/).
  2. Update `public/admin/config.yml`: set `repo` to your real
     `owner/ja-portfolio`, and set `base_url` to the OAuth provider's URL
     if self-hosting.

Each gallery's `path: '{{slug}}/index'` + `media_folder: ''` setting in
`config.yml` tells Decap to save a new gallery's photos into the same folder
as its `index.md`, which is exactly where `src/content.config.ts` expects to
find them for the `image()` schema to pick up and optimize.

### 2. Vercel (hosting)

1. Import the GitHub repo at vercel.com — the `@astrojs/vercel` adapter is
   already configured, so no build settings are needed.
2. Every push to `main` (including CMS commits) triggers a rebuild, which
   regenerates optimized image variants for any new or changed photos.

## Adding a gallery

Either use `/admin` once the CMS is wired up, or add a folder to
`src/content/galleries/` — see `src/content/galleries/wedding-in-vilnius/`
for the expected shape (`index.md` with `title`, `coverImage`, `photos[]`,
etc., validated by `src/content.config.ts`, plus the image files it
references).
