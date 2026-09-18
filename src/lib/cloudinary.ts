const CLOUD_NAME = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;

type ImageOptions = {
  width?: number;
  quality?: number | 'auto';
};

/**
 * Builds a Cloudinary delivery URL that auto-negotiates format (WebP/AVIF)
 * and compression based on the visitor's device.
 */
export function cloudinaryUrl(publicId: string, { width, quality = 'auto' }: ImageOptions = {}) {
  const transforms = ['f_auto', `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`;
}

/** A srcset covering common breakpoints for responsive gallery grids and lightboxes. */
export function cloudinarySrcSet(publicId: string, widths = [480, 768, 1080, 1600, 2400]) {
  return widths.map((w) => `${cloudinaryUrl(publicId, { width: w })} ${w}w`).join(', ');
}
