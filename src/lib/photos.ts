import type { ImageMetadata } from 'astro';
import type { CollectionEntry } from 'astro:content';

/** The gallery's cover first, then its other photos (in the order chosen in the CMS). */
export function getGalleryPhotos(gallery: CollectionEntry<'galleries'>): ImageMetadata[] {
  const seen = new Set<string>();
  return [gallery.data.coverImage, ...gallery.data.photos].filter((image) => {
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}
