import type { ImageMetadata } from 'astro';
import type { CollectionEntry } from 'astro:content';

/** The gallery's cover first, then its other photos (in the order chosen in the CMS). */
export function getGalleryPhotos(gallery: CollectionEntry<'galleries'>): ImageMetadata[] {
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
