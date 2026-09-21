import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

export type PreviewPhoto = { src: string; alt: string; caption?: string };

/** Cover first, then the gallery's photos, as ready-to-use URLs for the preview dialog. */
export async function getPreviewPhotos(gallery: CollectionEntry<'galleries'>): Promise<PreviewPhoto[]> {
  const sources = [{ src: gallery.data.coverImage, alt: gallery.data.title, caption: undefined }, ...gallery.data.photos];

  // The cover is often also the first photo; don't show it twice
  const seen = new Set<string>();
  const unique = sources.filter((photo) => {
    if (seen.has(photo.src.src)) return false;
    seen.add(photo.src.src);
    return true;
  });

  return Promise.all(
    unique.map(async (photo) => ({
      src: (await getImage({ src: photo.src, width: 2000, format: 'webp' })).src,
      alt: photo.alt,
      caption: photo.caption,
    }))
  );
}
