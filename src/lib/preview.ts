import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

export type PreviewPhoto = { src: string; alt: string };

/** Cover first, then the gallery's photos (alt text is derived from the gallery title), as ready-to-use URLs for the preview dialog. */
export async function getPreviewPhotos(gallery: CollectionEntry<'galleries'>): Promise<PreviewPhoto[]> {
  const sources = [gallery.data.coverImage, ...gallery.data.photos];

  // The cover is often also the first photo; don't show it twice
  const seen = new Set<string>();
  const unique = sources.filter((photo) => {
    if (seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });

  return Promise.all(
    unique.map(async (photo, i) => ({
      src: (await getImage({ src: photo, width: 2000, format: 'webp' })).src,
      alt: i === 0 ? gallery.data.title : `${gallery.data.title}, ${i + 1}`,
    }))
  );
}
