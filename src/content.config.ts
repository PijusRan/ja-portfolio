import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCollection, type ImageFunction } from 'astro:content';
import { z } from 'astro/zod';
import { glob, type Loader } from 'astro/loaders';

// Only "x% y%" is allowed: the value ends up in a style attribute. Anything else (an emptied or
// mistyped crop field in the admin) falls back to the centre with a warning instead of failing
// the build, which would stop the site from deploying.
const FOCAL = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/;
const focal = z.preprocess((value) => {
  if (value === undefined || (typeof value === 'string' && FOCAL.test(value))) return value;
  console.warn(`[content] Crop ${JSON.stringify(value)} isn't in the form "50% 50%"; using the centre.`);
  return '50% 50%';
}, z.string().regex(FOCAL).default('50% 50%'));

// The CMS lets editors delete a photo from the library that a page still uses. Astro would then
// fail the whole build (and the site would stop deploying), so a path to a deleted photo becomes
// null instead, with a warning in the build log. Paths look like `~/assets/uploads/photo.jpg`
// (`~` is src/, see tsconfig.json); anything else is left for Astro to resolve and report.
const srcDir = fileURLToPath(new URL('./', import.meta.url));
const isDeleted = (path: unknown): path is string =>
  typeof path === 'string' && path.startsWith('~/') && !existsSync(join(srcDir, path.slice(2)));

const photo = (image: ImageFunction) =>
  z.preprocess((value) => {
    if (!isDeleted(value)) return value;
    console.warn(`[content] ${value} was deleted but is still used; leaving it out. Pick another photo in the admin.`);
    return null;
  }, image().nullable());

// The glob loader only re-parses a file when its text changes, so an unchanged page would come
// straight from the build cache and skip the check above. That goes wrong both ways: a photo
// deleted since the last build would still be used (and fail the build), and a photo that was
// missing then but has been uploaded again since would stay left out. Dropping those cached
// entries first makes the loader parse them again.
const photoPaths = (filePath: string | undefined, root: URL): string[] => {
  if (!filePath) return [];
  try {
    return readFileSync(new URL(filePath, root), 'utf8').match(/~\/[^\s'"\],}]+/g) ?? [];
  } catch {
    return [];
  }
};

const content = (options: Parameters<typeof glob>[0]): Loader => {
  const loader = glob(options);
  return {
    ...loader,
    load: (context) => {
      for (const [id, entry] of context.store.entries()) {
        const used = entry.assetImports ?? [];
        const restored = photoPaths(entry.filePath, context.config.root).some(
          (path) => !used.includes(path) && !isDeleted(path)
        );
        if (restored || used.some(isDeleted)) context.store.delete(id);
      }
      return loader.load(context);
    },
  };
};

const galleries = defineCollection({
  loader: content({
    pattern: '**/index.md',
    base: './src/content/galleries',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      // A deleted cover is replaced by the first remaining photo (see the transform below)
      coverImage: photo(image),
      order: z.number().default(0),
      // Shown on the /darbai (work) page. Falls back to `title` when brand is empty.
      brand: z.string().optional(),
      season: z.string().optional(),
      // Which side the cover image sits on in the /darbai row layout
      layout: z.enum(['image-right', 'image-left', 'full', 'narrow-left', 'narrow-right']).default('image-right'),
      // CSS object-position for the cover crop, e.g. "50% 87%"
      focal,
      // Extra photos, picked from the shared library (cover is added automatically).
      // The filter drops deleted photos, and a stray null the admin's photo-list widget
      // can occasionally leave behind (see the `hero.images` comment for why).
      photos: z
        .array(photo(image))
        .default([])
        .transform((items) => items.filter((item): item is NonNullable<typeof item> => item != null)),
    })
    // With every photo deleted, coverImage stays null and the gallery is hidden (see getGalleries)
    .transform((data) => {
      const coverImage = data.coverImage ?? data.photos[0] ?? null;
      if (!coverImage) console.warn(`[content] Gallery "${data.title}" has no photos left; hiding it.`);
      return { ...data, coverImage };
    }),
});

const hero = defineCollection({
  // A single-entry collection: always one file, so the id is fixed.
  loader: content({
    pattern: 'index.md',
    base: './src/content/hero',
    generateId: () => 'index',
  }),
  schema: ({ image }) =>
    z.object({
      // Picked and ordered in the admin. #1 fills the large top-right slot, #2 the
      // small bottom-left slot; with rotation on, extra images take over in the same pairing.
      // `.nullable()` + the filter below tolerate a stray null the admin's image-list widget
      // can occasionally leave behind when a reorder/remove click races a save; without this,
      // one bad entry would fail the whole collection instead of just being dropped.
      // Entries whose photo was deleted are dropped the same way. The admin asks for at least
      // 2 images, but fewer only warns: the hero copes, and failing would stop deploys.
      images: z
        .array(
          z
            .object({
              image: photo(image),
              // CSS object-position for this image's crop, e.g. "50% 87%"
              focal,
              alt: z.string().default(''),
            })
            .nullable()
        )
        .transform((items) => {
          const kept = items.filter(
            (item): item is NonNullable<typeof item> & { image: NonNullable<NonNullable<typeof item>['image']> } =>
              item?.image != null
          );
          if (kept.length < 2) console.warn(`[content] The hero has ${kept.length} image(s); it needs at least 2.`);
          return kept;
        }),
      rotate: z.boolean().default(false),
      // Seconds between rotations; only used when `rotate` is on
      interval: z.number().min(3).default(6),
    }),
});

const about = defineCollection({
  // Single entry like `hero`: the portrait in the frontmatter, the bio as the markdown body.
  loader: content({
    pattern: 'index.md',
    base: './src/content/about',
    generateId: () => 'index',
  }),
  schema: ({ image }) =>
    z.object({
      // null if the portrait was deleted; the page then shows the bio alone
      image: photo(image),
      // CSS object-position for the portrait's crop, e.g. "50% 87%"
      focal,
      alt: z.string().default(''),
    }),
});

export const collections = { galleries, hero, about };
