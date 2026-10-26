// Recompresses every photo in src/assets/uploads to at most 3000px on the long edge and drops all
// metadata except the four camera settings the lightbox shows. Idempotent: clean files are skipped.
// Needs exiftool on PATH. Usage: npm run clean-photos
import { readdir, rename, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'src/assets/uploads';
const MAX = 3000;
const KEEP = ['FocalLength', 'FNumber', 'ExposureTime', 'ISO'];
const BAD = ['SerialNumber', 'LensSerialNumber', 'BodySerialNumber', 'InternalSerialNumber', 'OwnerName', 'Artist', 'DateTimeOriginal', 'Software', 'GPSLatitude'];

const exif = (file, tags) =>
  JSON.parse(execFileSync('exiftool', ['-json', ...tags.map((t) => `-${t}`), file]).toString())[0];

for (const name of await readdir(DIR)) {
  if (!/\.(jpe?g|png)$/i.test(name)) continue;
  const file = path.join(DIR, name);
  const { width = 0, height = 0 } = await sharp(file).metadata();
  const dirty = BAD.some((t) => exif(file, [t])[t] !== undefined);
  if (Math.max(width, height) <= MAX && !dirty) continue;

  const tmp = `${file}.tmp.jpg`;
  await sharp(file)
    .rotate()
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(tmp);
  execFileSync('exiftool', ['-overwrite_original', '-TagsFromFile', file, ...KEEP.map((t) => `-${t}`), tmp]);
  const final = file.replace(/\.[^.]+$/, '.jpg');
  await rename(tmp, final);
  if (final !== file) await unlink(file);
  console.log(`cleaned ${name}${final !== file ? ` -> ${path.basename(final)}` : ''}`);
}
