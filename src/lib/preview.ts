import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { getCameraInfo } from './exif';
import { getGalleryPhotos } from './photos';

export type PreviewPhoto = { src: string; srcset: string; alt: string; camera?: string };

// Widths for the preview dialog's srcset, so phones don't download the 2000px version
const WIDTHS = [768, 1200, 1600, 2000];

/** Cover first, then the gallery's other photos (alt text is derived from the gallery title), as ready-to-use URLs for the preview dialog. */
export async function getPreviewPhotos(gallery: CollectionEntry<'galleries'>): Promise<PreviewPhoto[]> {
  return Promise.all(
    getGalleryPhotos(gallery).map(async (photo, i) => {
      const [image, camera] = await Promise.all([
        getImage({ src: photo, width: 2000, widths: WIDTHS, format: 'webp' }),
        getCameraInfo(photo),
      ]);
      return {
        src: image.src,
        srcset: image.srcSet.attribute,
        alt: i === 0 ? gallery.data.title : `${gallery.data.title}, ${i + 1}`,
        camera,
      };
    })
  );
}
