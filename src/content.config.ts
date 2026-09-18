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
      photos: z.array(
        z.object({
          src: image(),
          alt: z.string(),
          caption: z.string().optional(),
        })
      ),
    }),
});

export const collections = { galleries };
