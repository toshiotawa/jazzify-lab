import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { r2S3CredentialsFrom } from './r2-env-helpers.mjs';

const EXPECTED_ARTICLES = 42;
const EXPECTED_OBJECTS = 93;
const ROOT = resolve(import.meta.dirname, '..');
const envR2 = loadEnvR2Map(ROOT);
const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
const apply = args.includes('--apply');

if (sourceIndex < 0 || !args[sourceIndex + 1]) {
  throw new Error('Usage: npm run upload:en-blog-media -- --source /path/to/english-articles [--apply]');
}

const sourceRoot = resolve(args[sourceIndex + 1]);
const bucket =
  process.env.R2_BUCKET || envR2.R2_BUCKET || envR2.VITE_R2_BUCKET_NAME || 'jazzify-assets';

const contentTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav'],
]);

const articleEntries = await readdir(sourceRoot, { withFileTypes: true });
const articleSlugs = [];
for (const entry of articleEntries) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  try {
    const articleFile = resolve(sourceRoot, entry.name, `${entry.name}-en.txt`);
    if ((await stat(articleFile)).isFile()) articleSlugs.push(entry.name);
  } catch {
    // Non-article delivery folders are ignored.
  }
}
articleSlugs.sort();
if (articleSlugs.length !== EXPECTED_ARTICLES) {
  throw new Error(`Expected ${EXPECTED_ARTICLES} article folders, got ${articleSlugs.length}`);
}

const objects = [];
const addFiles = async (directory, keyPrefix, include) => {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !include(entry.name)) continue;
    const contentType = contentTypes.get(extname(entry.name).toLowerCase());
    if (!contentType) throw new Error(`Unsupported media type: ${entry.name}`);
    objects.push({
      localPath: resolve(directory, entry.name),
      key: `${keyPrefix}/${entry.name}`,
      contentType,
    });
  }
};

for (const slug of articleSlugs) {
  await addFiles(
    resolve(sourceRoot, slug, 'images'),
    `blog/${slug}/images`,
    (name) => !name.startsWith('.') && !name.startsWith('jazzify-cta-'),
  );
  await addFiles(
    resolve(sourceRoot, slug, 'audio'),
    `blog/${slug}/audio`,
    (name) => !name.startsWith('.'),
  );
}

await addFiles(
  resolve(sourceRoot, '_shared', 'cta'),
  'blog/_shared/cta',
  (name) => name === 'jazzify-cta-top-en.png' || name === 'jazzify-cta-bottom-en.png',
);
objects.sort((left, right) => left.key.localeCompare(right.key));

if (objects.length !== EXPECTED_OBJECTS) {
  throw new Error(`Expected ${EXPECTED_OBJECTS} upload objects, got ${objects.length}`);
}

let totalBytes = 0;
for (const object of objects) totalBytes += (await stat(object.localPath)).size;

if (!apply) {
  process.stdout.write(
    `[dry-run] ${objects.length} objects (${(totalBytes / 1024 / 1024).toFixed(1)} MiB) -> ${bucket}/blog\n`,
  );
  for (const object of objects) process.stdout.write(`${object.key}\n`);
  process.exit(0);
}

const { accountId, accessKey, secretKey } = r2S3CredentialsFrom(envR2);
if (!accountId || !accessKey || !secretKey) {
  throw new Error('R2 S3 credentials are required for --apply');
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

for (const object of objects) {
  const body = await readFile(object.localPath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: object.key,
      Body: body,
      ContentType: object.contentType,
      CacheControl: 'public,max-age=31536000,immutable',
    }),
  );
  process.stdout.write(`Uploaded ${object.key}\n`);
}

process.stdout.write(`Uploaded ${objects.length} English blog media objects to R2.\n`);
