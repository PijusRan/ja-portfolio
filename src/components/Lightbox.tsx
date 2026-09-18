import { useEffect, useState } from 'react';

type ResponsiveImage = {
  src: string;
  srcset: string;
};

type Photo = {
  alt: string;
  caption?: string;
  thumb: ResponsiveImage;
  full: ResponsiveImage;
};

export default function Lightbox({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openIndex, photos.length]);

  const current = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, i) => (
          <button
            key={photo.thumb.src}
            type="button"
            className="photo-grid__item"
            onClick={() => setOpenIndex(i)}
            aria-label={`Open photo: ${photo.alt}`}
          >
            <img
              src={photo.thumb.src}
              srcSet={photo.thumb.srcset}
              sizes="(min-width: 900px) 25vw, 50vw"
              alt={photo.alt}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {current && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpenIndex(null)}>
          <button
            type="button"
            className="lightbox__close"
            aria-label="Close"
            onClick={() => setOpenIndex(null)}
          >
            ×
          </button>
          <img
            className="lightbox__image"
            src={current.full.src}
            srcSet={current.full.srcset}
            sizes="90vw"
            alt={current.alt}
            onClick={(e) => e.stopPropagation()}
          />
          {current.caption && <p className="lightbox__caption">{current.caption}</p>}
        </div>
      )}
    </>
  );
}
