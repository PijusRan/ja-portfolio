import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { getGalleryPhotos } from './photos';

export type PreviewPhoto = { src: string; alt: string };

/** Cover first, then the gallery's other photos (alt text is derived from the gallery title), as ready-to-use URLs for the preview dialog. */
export async function getPreviewPhotos(gallery: CollectionEntry<'galleries'>): Promise<PreviewPhoto[]> {
  return Promise.all(
    getGalleryPhotos(gallery).map(async (photo, i) => ({
      src: (await getImage({ src: photo, width: 2000, format: 'webp' })).src,
      alt: i === 0 ? gallery.data.title : `${gallery.data.title}, ${i + 1}`,
    }))
  );
}
