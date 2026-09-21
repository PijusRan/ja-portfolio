# JA Photography Portfolio

Portfolio site for photographer Justas Andžius. **Astro** builds a static site
(home, work and about pages), **Decap CMS** at `/admin` edits the content, and
it deploys to **GitHub Pages** or **Vercel**. Photos are committed into the repo
next to their gallery entry and optimized (responsive sizes, WebP) at build time
by Astro's image pipeline, so no external image service is needed.

The design comes from the "JA Portfolio" Figma file (home `/pagrindinis`, work
`/darbai`, about `/apie`). See `tech_stack_documentation.md` for the original
architecture writeup (note: it is outdated and still mentions Cloudinary and
Sanity, which this project no longer uses).

## Pages

| Route        | What it shows                                                                  |
| :----------- | :----------------------------------------------------------------------------- |
| `/`          | Hero, "Darbai darbeliai" divider, thumbnail grid of gallery covers (max 21)     |
| `/darbai/`   | Work page: one row per gallery with number, brand, season and cover            |
| `/apie/`     | About page: portrait, bio and contact line                                     |
| `/gallery/<slug>/` | Gallery detail page with a photo grid and lightbox (not linked from the site UI) |

Clicking a thumbnail on the home or work page opens an in-page preview of that
gallery's photos (cover first, arrows and ← → keys to step through). It does not
navigate to another page.

Each page picks a colour theme: cream (home), white (work), black (about).

## Project structure

```text
/
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── public/
│   └── admin/                     # Decap CMS: index.html, config.yml, admin.css, admin.js (live preview)
├── src/
│   ├── assets/
│   │   ├── fonts/                 # NATS and Crimson Text (self-hosted)
│   │   └── site/                  # Hero images, about portrait, arrow icon
│   ├── components/
│   │   ├── Header.astro, Footer.astro
│   │   ├── Hero.astro, WorkGrid.astro, ProjectRow.astro
│   │   ├── Preview.astro          # Shared preview dialog (vanilla script)
│   │   └── Lightbox.tsx           # React lightbox for the gallery detail page
│   ├── content/galleries/<slug>/  # One folder per gallery
│   │   ├── index.md               # Frontmatter (see below) + optional story
│   │   └── *.jpg                  # Photos, co-located with their entry
│   ├── content.config.ts          # Schema for the `galleries` collection
│   ├── data/site.ts               # Name, email, Instagram, cities, nav links
│   ├── layouts/Layout.astro       # Shell: header, footer, page theme
│   ├── lib/
│   │   ├── preview.ts             # Builds the photo list for the preview dialog
│   │   └── url.ts                 # withBase(): prefixes links with the site's base path
│   ├── pages/                     # index, darbai, apie, gallery/[slug]
│   └── styles/global.css          # Fonts, tokens, type scale, page shell
└── package.json
```

## Commands

| Command                 | Action                                          |
| :---------------------- | :---------------------------------------------- |
| `npm install`           | Install dependencies                            |
| `npm run dev`           | Start local dev server at `localhost:4321`      |
| `npm run build`         | Build the production site to `./dist/`          |
| `npm run preview`       | Preview the build locally                       |
| `npx astro check`       | Type-check the project                          |
| `npx decap-server`      | Local CMS backend (run alongside `npm run dev`) |

## Content: galleries

Each gallery is a folder in `src/content/galleries/` with an `index.md`:

```yaml
---
title: acne studios 2024 autumn/fall # internal name
coverImage: ./runway-white-dress.jpg # home grid + work page
order: 2 # lower comes first on home and work pages
brand: acne studios # work page, first line (falls back to title)
season: 2024 autumn/fall # work page, second line
layout: image-left # image-right | image-left | full | narrow-left | narrow-right
focal: '50% 50%' # crop position of the cover, as CSS object-position
photos: # extra photos for the preview / gallery page
  - ./runway-white-dress.jpg
---
```

Alt text is generated from the title. Optional: `description` and a markdown
body (shown on the gallery detail page). The schema lives in
`src/content.config.ts`.

Other content is not in the CMS: the hero images and about portrait
(`src/assets/site/`, used in `Hero.astro` and `apie.astro`), the bio text
(placeholder in `src/pages/apie.astro`), and the email, Instagram link and city
names (`src/data/site.ts`).

## Setup

### 1. Decap CMS (content editing)

- **Local editing** (no accounts needed): run `npx decap-server` in one
  terminal and `npm run dev` in another, then open `/admin`. Changes,
  including uploaded photos, are written straight to
  `src/content/galleries/<slug>/` on disk.
- **Production editing**: the CMS uses the `github` backend, so the
  photographer logs in with GitHub to edit content on the live site. This needs
  an OAuth app and a small proxy (neither Vercel nor GitHub Pages provides one):
  1. Create a GitHub OAuth App (Settings → Developer settings) with callback
     URL `https://api.netlify.com/auth/done` (Netlify's OAuth proxy is free to
     use even when hosting elsewhere) or deploy a
     [self-hosted OAuth provider](https://decapcms.org/docs/external-oauth-clients/).
  2. Update `public/admin/config.yml`: replace the `YOUR_GITHUB_USERNAME/ja-portfolio`
     placeholder in `repo` with the real `owner/repo`, set `branch` to the
     deployed branch (currently `main`, while this repo's branch is `master`),
     and set `base_url` if self-hosting the OAuth provider.

**Uploading several photos at once:** in a gallery, open the *Photos* field and
choose *Choose images*. In the media library use *Upload* to add several files
at once, or tick several existing files and press *Choose selected*. The editor
shows a live preview of the work-page row next to the form.

Each gallery's `path: '{{slug}}/index'` + `media_folder: ''` in `config.yml`
tells Decap to save photos into the same folder as the gallery's `index.md`,
where `src/content.config.ts` expects them for the `image()` schema. The
dashboard's look is in `public/admin/admin.css` (it targets Decap's internal
class names, so a Decap upgrade may need small fixes).

### 2. GitHub Pages (hosting)

`.github/workflows/deploy.yml` builds and deploys on every push to `master`
(or manually from the Actions tab).

1. In the repo: Settings → Pages → Source: **GitHub Actions**.
2. Push. The site is served at `https://<owner>.github.io/<repo-name>/`.

The workflow sets `GITHUB_PAGES=true`, `SITE_URL` and `BASE_PATH` (the repo name)
for the build. In that mode `astro.config.mjs` uses plain static output with no
adapter and a base path. All internal links go through `withBase()`
(`src/lib/url.ts`), and fonts live in `src/assets/` so their URLs get the base
path too. If you add links to new pages, wrap them in `withBase()`.

### 3. Vercel (alternative hosting)

Import the GitHub repo at vercel.com. The `@astrojs/vercel` adapter is
configured for normal builds (when `GITHUB_PAGES` is not set), so no build
settings are needed. Every push (including CMS commits) triggers a rebuild.

## Fonts

NATS (Latin, Google Fonts, OFL) is the display font and Crimson Text is used for
the about-page bio. Both are self-hosted in `src/assets/fonts/`; a copy of NATS
for the CMS lives in `public/admin/`.

## Adding a gallery

Use `/admin` (*New Gallery*), or add a folder under `src/content/galleries/`
following the frontmatter above, with the image files next to `index.md`.
