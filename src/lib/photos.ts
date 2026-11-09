import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { withBase } from './url';

/**
 * A gallery with at least one photo left (see the galleries schema in content.config.ts),
 * plus `slug`: the ASCII name its album page lives under, /darbai/<slug>/.
 */
export type Gallery = CollectionEntry<'galleries'> & { data: { coverImage: ImageMetadata }; slug: string };

// Same rules as the CMS uses for file names (fileBase in public/admin/admin.js): Lithuanian letters
// lose their accents (š → s), anything else becomes "-", so "krikštynos" lives at /darbai/krikstynos/.
function toSlug(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'albumas';
}

/** Galleries in display order. Ones whose photos have all been deleted have nothing to show and are left out. */
export async function getGalleries(): Promise<Gallery[]> {
  const galleries = await getCollection(
    'galleries',
    (gallery): gallery is Omit<Gallery, 'slug'> => gallery.data.coverImage != null
  );
  const taken = new Set<string>();
  return galleries
    .sort((a, b) => a.data.order - b.data.order)
    .map((gallery) => {
      // Two folders can end up with the same slug ("kalėdos" and "kaledos"); the later one gets "-2"
      // (with a warning) rather than failing the build, which would stop the site from deploying.
      const base = toSlug(gallery.id);
      let slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      if (slug !== base) console.warn(`[content] Gallery "${gallery.id}" shares its address with another; using /darbai/${slug}/.`);
      taken.add(slug);
      return { ...gallery, slug };
    });
}

/** The gallery's album page. */
export function galleryUrl(gallery: Gallery): string {
  return withBase(`/darbai/${gallery.slug}/`);
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
