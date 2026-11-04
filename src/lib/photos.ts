import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

/** A gallery with at least one photo left (see the galleries schema in content.config.ts). */
export type Gallery = CollectionEntry<'galleries'> & { data: { coverImage: ImageMetadata } };

/** Galleries in display order. Ones whose photos have all been deleted have nothing to show and are left out. */
export async function getGalleries(): Promise<Gallery[]> {
  const galleries = await getCollection('galleries', (gallery): gallery is Gallery => gallery.data.coverImage != null);
  return galleries.sort((a, b) => a.data.order - b.data.order);
}

/** The gallery's cover first, then its other photos (in the order chosen in the CMS). */
export function getGalleryPhotos(gallery: Gallery): ImageMetadata[] {
  const seen = new Set<string>();
  return [gallery.data.coverImage, ...gallery.data.photos].filter((image) => {
    // Compare by source path: reading `image.src` would make Astro copy the original file into the build
    const key = (image as ImageMetadata & { fsPath?: string }).fsPath;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
