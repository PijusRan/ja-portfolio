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

export const collections = { galleries };
