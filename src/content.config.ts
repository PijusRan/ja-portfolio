import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Only "x% y%" is allowed: the value ends up in a style attribute
const focal = z.string().regex(/^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/, 'Use the form "50% 50%"').default('50% 50%');

const galleries = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/galleries',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      coverImage: image(),
      order: z.number().default(0),
      // Shown on the /darbai (work) page. Falls back to `title` when brand is empty.
      brand: z.string().optional(),
      season: z.string().optional(),
      // Which side the cover image sits on in the /darbai row layout
      layout: z.enum(['image-right', 'image-left', 'full', 'narrow-left', 'narrow-right']).default('image-right'),
      // CSS object-position for the cover crop, e.g. "50% 87%"
      focal,
      // Extra photos, picked from the shared library (cover is added automatically).
      // `.nullable()` + the filter below tolerate a stray null the admin's photo-list
      // widget can occasionally leave behind (see the `hero.images` comment for why).
      photos: z
        .array(image().nullable())
        .default([])
        .transform((items) => items.filter((item): item is NonNullable<typeof item> => item != null)),
    }),
});

const hero = defineCollection({
  // A single-entry collection: always one file, so the id is fixed.
  loader: glob({
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
      images: z
        .array(
          z
            .object({
              image: image(),
              // CSS object-position for this image's crop, e.g. "50% 87%"
              focal,
              alt: z.string().default(''),
            })
            .nullable()
        )
        .transform((items) => items.filter((item): item is NonNullable<typeof item> => item != null))
        .refine((items) => items.length >= 2, { message: 'The hero needs at least 2 images.' }),
      rotate: z.boolean().default(false),
      // Seconds between rotations; only used when `rotate` is on
      interval: z.number().min(3).default(6),
    }),
});

const about = defineCollection({
  // Single entry like `hero`: the portrait in the frontmatter, the bio as the markdown body.
  loader: glob({
    pattern: 'index.md',
    base: './src/content/about',
    generateId: () => 'index',
  }),
  schema: ({ image }) =>
    z.object({
      image: image(),
      // CSS object-position for the portrait's crop, e.g. "50% 87%"
      focal,
      alt: z.string().default(''),
    }),
});

export const collections = { galleries, hero, about };
