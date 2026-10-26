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
│   │   ├── uploads/               # Shared photo library (Media tab + all galleries)
│   │   ├── fonts/                 # Montserrat and Crimson Text (self-hosted)
│   │   └── site/                  # Hero images, about portrait, arrow icon
│   ├── components/
│   │   ├── Header.astro, Footer.astro
│   │   ├── Hero.astro, WorkGrid.astro, ProjectRow.astro
│   │   ├── Preview.astro          # Shared preview dialog (vanilla script)
│   │   └── Lightbox.tsx           # React lightbox for the gallery detail page
│   ├── content/galleries/<slug>/  # One folder per gallery
│   │   ├── index.md               # Frontmatter (see below) + optional story
│   ├── content.config.ts          # Schema for the `galleries` collection
│   ├── data/site.ts               # Name, email, Instagram, cities, nav links
│   ├── layouts/Layout.astro       # Shell: header, footer, page theme
│   ├── lib/
│   │   ├── photos.ts              # A gallery's cover + photos, de-duplicated
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

Each gallery is a folder in `src/content/galleries/` with an `index.md`. The images
themselves live in one shared library, `src/assets/uploads/`, and galleries refer to
them with `~/assets/uploads/…` paths (the `~` alias is set in `tsconfig.json`). The
same photo can be used by several galleries.

```yaml
---
title: acne studios 2024 autumn/fall # internal name
coverImage: ~/assets/uploads/runway-white-dress.jpg # home grid + work page
order: 2 # lower comes first on home and work pages
brand: acne studios # work page, first line (falls back to title)
season: 2024 autumn/fall # work page, second line
layout: image-left # image-right | image-left | full | narrow-left | narrow-right
focal: '50% 50%' # crop position of the cover, as CSS object-position
photos: # shown after the cover in the preview and on the gallery page
  - ~/assets/uploads/chair.jpg
---
```

Alt text is generated from the title (there are no per-photo captions). Optional: `description` and a markdown
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
  including uploaded photos, are written straight to disk (entries to
  `src/content/galleries/<slug>/`, photos to `src/assets/uploads/`).
- **Production editing**: logins go through [DecapBridge](https://decapbridge.com),
  so editors sign in with email/password or Google/Microsoft and don't need a
  GitHub account. Edits are committed to `master`, which redeploys the site.
  Free plan: 3 sites, 10 collaborators.
  1. Create a DecapBridge account and add a site: provider GitHub, repo
     `PijusRan/ad-portfolio`.
  2. Create a GitHub fine-grained token limited to that repo with *Contents:
     read & write*, and paste it into the site form. It expires, so renew it
     before then or saving will stop working.
  3. Enter the admin URL (`https://<site>/admin/index.html`) and choose the PKCE
     auth type (enables Google/Microsoft login).
  4. Click *Create site*, then paste the `backend:` block DecapBridge generates
     into `public/admin/config.yml`, replacing the current one. Push to `master`.
  5. Invite editors under the site's *Manage collaborators* tab; they follow the
     emailed link. Google/Microsoft login needs Decap above v3.8.3 (pinned in
     `public/admin/index.html`).

**Photos workflow.** There is one photo library, used by the *Media* tab, the
*Cover image* picker and the *Photos* picker, so an upload from any of them is
available everywhere.

- *Upload* in the library accepts several files at once. Decap normally takes one,
  so `public/admin/admin.js` feeds them to it one at a time.
- *Cover image*: pick one photo from the library (or upload it there).
- *Photos*: click *Add photos*, click as many photos as you like to tick them (or
  *Select all*), then *Add N selected* in the bar at the bottom. Reorder with ‹ ›
  and remove with ×. This field is a custom widget (`photo-list` in `admin.js`),
  because Decap's own picker only selects one image at a time.
- The editor shows a live preview of the work-page row next to the form.

Large originals bloat the repo, so resize photos to about 2500px on the long edge
before uploading. Astro makes the smaller web versions at build time.

The dashboard's look is in `public/admin/admin.css`, and the custom widget and
upload helper are in `public/admin/admin.js`. Both depend on Decap's internal class
names, so a Decap upgrade may need small fixes.

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

Montserrat SemiBold (Google Fonts, OFL) is the display font and Crimson Text is used
for the about-page bio. Both are self-hosted in `src/assets/fonts/` with Latin and
Latin-ext files, so Lithuanian letters (ą č ę ė į š ų ū ž) work; a copy of Montserrat
for the CMS lives in `public/admin/`. Montserrat replaced NATS, which is missing most
Lithuanian letters; the `size-adjust`/`*-override` descriptors in `global.css` keep
NATS's sizing so the layout didn't change.

## Adding a gallery

Use `/admin` (*New Gallery*), or add a folder under `src/content/galleries/`
following the frontmatter above, with the image files next to `index.md`.

## Branch naming

Branches are named after the date they were started: `yyyymmdd`, for example
`20261026`. If another branch is started on the same day, add a letter to tell
them apart: `20261026a`, then `20261026b`, and so on. The first branch of the day
has no letter. `master` is the production branch, and every push to it deploys.
