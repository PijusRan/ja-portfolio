// Recompresses every photo in src/assets/uploads to at most 3000px on the long edge and drops all
// metadata except the four camera settings the lightbox shows. Idempotent: clean files are skipped.
// Renamed files (.png/.jpeg -> .jpg) have their references in src/content updated to match.
// Needs exiftool on PATH. Usage: npm run clean-photos
import { readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'src/assets/uploads';
const MAX = 3000;
const KEEP = ['FocalLength', 'FNumber', 'ExposureTime', 'ISO'];
const BAD = ['SerialNumber', 'LensSerialNumber', 'BodySerialNumber', 'InternalSerialNumber', 'OwnerName', 'Artist', 'DateTimeOriginal', 'Software', 'GPSLatitude'];

const CONTENT = 'src/content';

// Points every content file that mentions uploads/<from> at uploads/<to> instead
async function renameRefs(from, to) {
  for (const entry of await readdir(CONTENT, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(md|mdx|ya?ml|json)$/i.test(entry.name)) continue;
    const file = path.join(entry.parentPath, entry.name);
    const text = await readFile(file, 'utf8');
    const next = text.split(`uploads/${from}`).join(`uploads/${to}`);
    if (next !== text) {
      await writeFile(file, next);
      console.log(`  updated ${file}`);
    }
  }
}

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
    // JPEG has no transparency: put transparent parts of a PNG on white, not the default black
    .flatten({ background: '#fff' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(tmp);
  execFileSync('exiftool', ['-overwrite_original', '-TagsFromFile', file, ...KEEP.map((t) => `-${t}`), tmp]);
  let final = file.replace(/\.[^.]+$/, '.jpg');
  // Never overwrite a different photo that already has the .jpg name; keep the original name instead
  if (final !== file && (await readdir(DIR)).includes(path.basename(final))) final = file.replace(/\.png$/i, '.png.jpg');
  await rename(tmp, final);
  if (final !== file) {
    await unlink(file);
    await renameRefs(name, path.basename(final));
  }
  console.log(`cleaned ${name}${final !== file ? ` -> ${path.basename(final)}` : ''}`);
}
