import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const EXPECTED_ARTICLE_COUNT = 42;
const EXPECTED_CTA_COUNT = 84;
const EXPECTED_MEDIA_URL_COUNT = 93;
const EXPECTED_CATEGORY_COUNTS = new Map([
  ['album-guides', 9],
  ['artists-listening', 16],
  ['practice-guides', 5],
  ['theory-voicings', 12],
]);
const contentRoot = resolve(import.meta.dirname, '../src/data/blog');
const outputRoot = resolve(import.meta.dirname, '../../dist/blog');
const verifyRemoteMedia = process.argv.includes('--remote');
const expectedMeasurementId = process.env.VITE_GA_MEASUREMENT_ID || '';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const occurrences = (source, pattern) => source.match(pattern)?.length || 0;
const frontmatterValue = (source, key) => {
  const match = source.match(new RegExp(`^${key}: (.+)$`, 'm'));
  if (!match) throw new Error(`Missing frontmatter field: ${key}`);
  return JSON.parse(match[1]);
};

const articleFiles = (await readdir(contentRoot)).filter((name) => name.endsWith('.md')).sort();
assert(
  articleFiles.length === EXPECTED_ARTICLE_COUNT,
  `Expected ${EXPECTED_ARTICLE_COUNT} Markdown articles, got ${articleFiles.length}`,
);

const slugs = new Set();
const titles = new Set();
const descriptions = new Set();
const mediaUrls = new Set();
const categoryCounts = new Map();
let ctaCount = 0;

for (const filename of articleFiles) {
  const source = await readFile(resolve(contentRoot, filename), 'utf8');
  const slug = frontmatterValue(source, 'slug');
  const title = frontmatterValue(source, 'title');
  const description = frontmatterValue(source, 'description');
  const category = frontmatterValue(source, 'category');
  const relatedSlugs = frontmatterValue(source, 'relatedSlugs');
  const expectedCampaign = category.replaceAll('-', '_');
  const expectedTopUrl = `https://en.jazzify.jp/?utm_source=en_blog&amp;utm_medium=organic&amp;utm_campaign=${expectedCampaign}&amp;utm_content=${slug}_top`;
  const expectedBottomUrl = `https://en.jazzify.jp/?utm_source=en_blog&amp;utm_medium=organic&amp;utm_campaign=${expectedCampaign}&amp;utm_content=${slug}_bottom`;

  assert(!slugs.has(slug), `Duplicate slug: ${slug}`);
  assert(!titles.has(title), `Duplicate title: ${title}`);
  assert(!descriptions.has(description), `Duplicate description: ${description}`);
  assert(!source.includes('example.com'), `${slug}: placeholder URL remains`);
  assert(occurrences(source, /data-blog-cta="top"/g) === 1, `${slug}: top CTA count is not 1`);
  assert(occurrences(source, /data-blog-cta="bottom"/g) === 1, `${slug}: bottom CTA count is not 1`);
  assert(source.includes(expectedTopUrl), `${slug}: top CTA UTM parameters are incorrect`);
  assert(source.includes(expectedBottomUrl), `${slug}: bottom CTA UTM parameters are incorrect`);
  assert(occurrences(source, /class="article-toc"/g) === 1, `${slug}: TOC count is not 1`);
  assert(Array.isArray(relatedSlugs) && relatedSlugs.length === 3, `${slug}: relatedSlugs must have 3 values`);
  assert(!relatedSlugs.includes(slug), `${slug}: relatedSlugs contains itself`);
  assert(new Set(relatedSlugs).size === 3, `${slug}: relatedSlugs contains duplicates`);

  for (const match of source.matchAll(/https:\/\/jazzify-cdn\.com\/blog\/[^"'\s)]+/g)) {
    mediaUrls.add(match[0]);
  }
  slugs.add(slug);
  titles.add(title);
  descriptions.add(description);
  categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  ctaCount += occurrences(source, /data-blog-cta="(?:top|bottom)"/g);
}

for (const filename of articleFiles) {
  const slug = filename.replace(/\.md$/, '');
  const source = await readFile(resolve(contentRoot, filename), 'utf8');
  const relatedSlugs = frontmatterValue(source, 'relatedSlugs');
  for (const relatedSlug of relatedSlugs) {
    assert(slugs.has(relatedSlug), `${slug}: unknown related slug ${relatedSlug}`);
  }
}

for (const [category, expectedCount] of EXPECTED_CATEGORY_COUNTS) {
  assert(categoryCounts.get(category) === expectedCount, `${category}: expected ${expectedCount} articles`);
}
assert(ctaCount === EXPECTED_CTA_COUNT, `Expected ${EXPECTED_CTA_COUNT} CTAs, got ${ctaCount}`);
assert(
  mediaUrls.size === EXPECTED_MEDIA_URL_COUNT,
  `Expected ${EXPECTED_MEDIA_URL_COUNT} unique media URLs, got ${mediaUrls.size}`,
);

await access(resolve(outputRoot, 'index.html'));
await access(resolve(outputRoot, '404.html'));
const redirects = await readFile(resolve(outputRoot, '../_redirects'), 'utf8');
assert(
  redirects.includes('https://en.jazzify.jp/blog/*  /blog/404.html  404'),
  'Netlify blog 404 rule is missing from dist/_redirects',
);
assert(
  redirects.includes('https://en.jazzify.jp/       /index-en.html  200'),
  'Netlify English root rule is missing from dist/_redirects',
);
assert(
  redirects.includes('https://en.jazzify.jp/*      /index-en.html  200'),
  'Netlify English SPA fallback is missing from dist/_redirects',
);

const canonicals = new Set();
for (const slug of slugs) {
  const htmlPath = resolve(outputRoot, slug, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const canonical = `https://en.jazzify.jp/blog/${slug}/`;
  assert(!html.includes('example.com'), `${slug}: built HTML contains placeholder URL`);
  assert(occurrences(html, /<h1(?:\s[^>]*)?>/g) === 1, `${slug}: built HTML must contain one h1`);
  assert(occurrences(html, /data-blog-cta="top"/g) === 1, `${slug}: built top CTA count is not 1`);
  assert(occurrences(html, /data-blog-cta="bottom"/g) === 1, `${slug}: built bottom CTA count is not 1`);
  assert(html.includes(`<link rel="canonical" href="${canonical}"`), `${slug}: canonical is missing`);
  assert(html.includes('application/ld+json'), `${slug}: JSON-LD is missing`);
  canonicals.add(canonical);
}
assert(canonicals.size === EXPECTED_ARTICLE_COUNT, 'Article canonicals are not unique');

const sitemapNames = (await readdir(outputRoot)).filter((name) => /^sitemap.*\.xml$/.test(name));
assert(sitemapNames.length > 0, 'Sitemap output is missing');
const sitemapXml = (
  await Promise.all(sitemapNames.map((name) => readFile(resolve(outputRoot, name), 'utf8')))
).join('\n');
assert(!sitemapXml.includes('/blog/404/'), 'Sitemap must not include the 404 page');
for (const canonical of canonicals) {
  assert(sitemapXml.includes(canonical), `Sitemap is missing ${canonical}`);
}

const analyticsSource = await readFile(
  resolve(import.meta.dirname, '../src/components/BlogAnalytics.astro'),
  'utf8',
);
assert(analyticsSource.includes("window.gtag('event', 'blog_cta_click'"), 'CTA analytics event is missing');
if (expectedMeasurementId) {
  const indexHtml = await readFile(resolve(outputRoot, 'index.html'), 'utf8');
  assert(indexHtml.includes(expectedMeasurementId), 'Built blog is missing VITE_GA_MEASUREMENT_ID');
  assert(indexHtml.includes('blog_cta_click'), 'Built blog is missing CTA analytics');
}

if (verifyRemoteMedia) {
  const urls = [...mediaUrls].sort();
  for (let index = 0; index < urls.length; index += 8) {
    const batch = urls.slice(index, index + 8);
    const results = await Promise.all(
      batch.map(async (url) => {
        const response = await fetch(url, { method: 'HEAD' });
        return { url, status: response.status, contentType: response.headers.get('content-type') || '' };
      }),
    );
    for (const result of results) {
      assert(result.status === 200, `${result.url}: expected HTTP 200, got ${result.status}`);
      const expectedPrefix = /\.(?:mp3|wav)$/.test(result.url) ? 'audio/' : 'image/';
      assert(
        result.contentType.startsWith(expectedPrefix),
        `${result.url}: unexpected Content-Type ${result.contentType}`,
      );
    }
  }

  const audioUrls = urls.filter((url) => /\.(?:mp3|wav)$/.test(url));
  assert(audioUrls.length > 0, 'No audio URL found for Range request verification');
  for (let index = 0; index < audioUrls.length; index += 8) {
    const batch = audioUrls.slice(index, index + 8);
    const results = await Promise.all(
      batch.map(async (url) => {
        const response = await fetch(url, { headers: { Range: 'bytes=0-1' } });
        return { url, status: response.status };
      }),
    );
    for (const result of results) {
      assert(result.status === 206, `${result.url}: expected HTTP 206 for Range request`);
    }
  }
  process.stdout.write(
    `Verified ${urls.length} remote media objects and Range support for ${audioUrls.length} audio objects.\n`,
  );
}

process.stdout.write(
  `Verified ${articleFiles.length} articles, ${ctaCount} CTAs, ${mediaUrls.size} media URLs, and ${sitemapNames.length} sitemap file(s).\n`,
);
