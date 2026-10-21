import { open } from 'node:fs/promises';
import type { ImageMetadata } from 'astro';
import exifr from 'exifr';

const FIELDS = ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO'];
// EXIF sits in the JPEG's first segments; no need to read a 20 MB original in full
const HEADER_BYTES = 128 * 1024;

// The same photo shows up on several pages (home grid, /darbai), so read each file once per build.
const cache = new Map<string, Promise<string | undefined>>();

/**
 * One-line camera settings for a photo, e.g. "FUJIFILM X-T30 · XF18-55mmF2.8-4 R LM OIS · 55 mm · f/5 · 1/125 s · ISO 2000".
 * Read from the source file, since the optimized webp output drops EXIF. Undefined when the file has none
 * (edited exports often don't), so a missing or unreadable header never breaks the build.
 */
export function getCameraInfo(image: ImageMetadata): Promise<string | undefined> {
  // Astro sets fsPath (non-enumerable) on every imported image
  const fsPath = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!fsPath) return Promise.resolve(undefined);
  let info = cache.get(fsPath);
  if (!info) {
    info = readHeader(fsPath)
      .then((header) => exifr.parse(header, FIELDS))
      .then(format, () => undefined);
    cache.set(fsPath, info);
  }
  return info;
}

// exifr's own file reader fails on current Node versions, so hand it a buffer instead
async function readHeader(fsPath: string): Promise<Buffer> {
  const file = await open(fsPath);
  try {
    const buffer = Buffer.alloc(HEADER_BYTES);
    const { bytesRead } = await file.read(buffer, 0, HEADER_BYTES, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}

function format(exif: Record<string, unknown> | undefined): string | undefined {
  if (!exif) return undefined;
  const make = typeof exif.Make === 'string' ? exif.Make.trim() : '';
  const model = typeof exif.Model === 'string' ? exif.Model.trim() : '';
  // Some makers repeat the brand in the model ("Canon EOS R5"); don't print it twice
  const camera = model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`.trim();
  const lens = typeof exif.LensModel === 'string' ? exif.LensModel.replace(/^Fujifilm Fujinon\s+/i, '').trim() : '';
  const { FocalLength: focal, FNumber: aperture, ExposureTime: exposure, ISO: iso } = exif;

  const parts = [
    camera,
    lens,
    typeof focal === 'number' && `${round(focal)} mm`,
    typeof aperture === 'number' && `f/${round(aperture)}`,
    typeof exposure === 'number' && formatExposure(exposure),
    typeof iso === 'number' && `ISO ${iso}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatExposure(seconds: number): string {
  return seconds >= 1 ? `${round(seconds)} s` : `1/${Math.round(1 / seconds)} s`;
}
