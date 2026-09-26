import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
      focal: z.string().default('50% 50%'),
      // Extra photos, picked from the shared library (cover is added automatically)
      photos: z.array(image()).default([]),
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
      images: z
        .array(
          z.object({
            image: image(),
            // CSS object-position for this image's crop, e.g. "50% 87%"
            focal: z.string().default('50% 50%'),
            alt: z.string().default(''),
          })
        )
        .min(2),
      rotate: z.boolean().default(false),
      // Seconds between rotations; only used when `rotate` is on
      interval: z.number().min(3).default(6),
    }),
});

export const collections = { galleries, hero };
