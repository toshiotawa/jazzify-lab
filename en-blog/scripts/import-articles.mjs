import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EXPECTED_ARTICLE_COUNT = 42;
const PUBLISHED_AT = process.env.BLOG_PUBLISHED_AT || '2026-07-15';
const AUTHOR = 'Toshio Nagayoshi';
const CDN_BASE = 'https://jazzify-cdn.com/blog';
const DEFAULT_OG_IMAGE = 'https://en.jazzify.jp/newLP/hero-poster.webp';

const CATEGORY_GROUPS = [
  {
    slug: 'album-guides',
    label: 'Album Guides',
    articles: [
      'album-blue-train',
      'album-kind-of-blue',
      'album-maiden-voyage',
      'album-moanin-art-blakey',
      'album-portrait-in-jazz',
      'album-saxophone-colossus',
      'album-somethin-else',
      'album-speak-no-evil',
      'album-waltz-for-debby',
    ],
  },
  {
    slug: 'artists-listening',
    label: 'Artists & Listening',
    articles: [
      'best-bill-evans-albums',
      'best-bud-powell-albums',
      'best-cannonball-adderley-albums',
      'best-chick-corea-albums',
      'best-herbie-hancock-albums',
      'best-jazz-pianists',
      'best-john-coltrane-albums',
      'best-mccoy-tyner-albums',
      'best-miles-davis-albums',
      'best-oscar-peterson-albums',
      'best-sonny-rollins-albums',
      'best-thelonious-monk-albums',
      'best-wayne-shorter-albums',
      'best-wes-montgomery-albums',
      'best-wynton-kelly-albums',
      'red-garland-biography-and-piano-style',
    ],
  },
  {
    slug: 'practice-guides',
    label: 'Practice Guides',
    articles: [
      'best-apps-for-jazz-practice',
      'first-jazz-jam-session',
      'how-to-learn-jazz-piano-by-yourself',
      'how-to-transcribe-jazz-piano',
      'jazz-piano-technique-for-beginners',
    ],
  },
  {
    slug: 'theory-voicings',
    label: 'Theory & Voicings',
    articles: [
      'altered-scale',
      'how-to-build-jazz-piano-voicings',
      'jazz-chord-tensions',
      'jazz-ii-v-i-progression',
      'jazz-modes-for-piano',
      'jazz-piano-chords-for-beginners',
      'jazz-piano-left-hand-voicings',
      'jazzpiano-block-chords',
      'music-intervals-for-piano',
      'secondary-dominant-chords',
      'two-handed-voicings-tension-resolution',
      'type-a-type-b-rootless-voicings',
    ],
  },
];

const metadataKeys = [
  'TITLE',
  'SLUG',
  'META DESCRIPTION',
  'PRIMARY KEYWORD',
  'SECONDARY KEYWORDS',
  'ORIGINAL URL',
  'IMAGE URL BASE',
];

const args = process.argv.slice(2);
const sourceFlagIndex = args.indexOf('--source');
if (sourceFlagIndex < 0 || !args[sourceFlagIndex + 1]) {
  throw new Error('Usage: npm run import:en-blog -- --source /absolute/path/to/english-articles');
}

const sourceRoot = resolve(args[sourceFlagIndex + 1]);
const outputRoot = resolve(import.meta.dirname, '../src/data/blog');
const categoryBySlug = new Map();

for (const category of CATEGORY_GROUPS) {
  for (const slug of category.articles) {
    if (categoryBySlug.has(slug)) {
      throw new Error(`Duplicate category assignment: ${slug}`);
    }
    categoryBySlug.set(slug, category);
  }
}

if (categoryBySlug.size !== EXPECTED_ARTICLE_COUNT) {
  throw new Error(`Expected ${EXPECTED_ARTICLE_COUNT} category assignments, got ${categoryBySlug.size}`);
}

const parseMetadata = (source, filePath) => {
  const values = new Map();
  const metadataLines = source.split(/\r?\n/, metadataKeys.length);
  const allMetadataComments = [...source.matchAll(/^<!-- ([A-Z ]+): (.*) -->$/gm)].filter(
    (match) => metadataKeys.includes(match[1]),
  );
  if (allMetadataComments.length !== metadataKeys.length) {
    throw new Error(`${filePath}: expected exactly ${metadataKeys.length} metadata comments`);
  }
  for (const [index, key] of metadataKeys.entries()) {
    const match = metadataLines[index]?.match(new RegExp(`^<!-- ${key}: (.+) -->$`));
    if (!match) throw new Error(`${filePath}: metadata line ${index + 1} must be ${key}`);
    values.set(key, match[1]);
  }
  return values;
};

const stripDeliveryComments = (source) => {
  const withoutMetadata = source.replace(
    /^(?:<!-- (?:TITLE|SLUG|META DESCRIPTION|PRIMARY KEYWORD|SECONDARY KEYWORDS|ORIGINAL URL|IMAGE URL BASE): .* -->\s*)+/,
    '',
  );
  return withoutMetadata
    .replace(/\s*<!-- (?:IMAGE MANIFEST|AUDIO MANIFEST|SOURCE NOTES)[\s\S]*?-->\s*/g, '\n')
    .trim();
};

const addImageLoadingAttributes = (html) =>
  html.replace(/<img\b([^>]*)>/g, (_match, attributes) => {
    const loading = /\bloading=/.test(attributes) ? '' : ' loading="lazy"';
    const decoding = /\bdecoding=/.test(attributes) ? '' : ' decoding="async"';
    return `<img${attributes}${loading}${decoding}>`;
  });

const plainHeading = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();

const headingId = (heading, seen) => {
  const base = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
  const count = seen.get(base) || 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
};

const addTableOfContents = (html) => {
  const headings = [];
  const seen = new Map();
  const withIds = html.replace(/<h2(?:\s[^>]*)?>([\s\S]*?)<\/h2>/g, (_match, content) => {
    const text = plainHeading(content);
    const id = headingId(text, seen);
    headings.push({ id, text });
    return `<h2 id="${id}">${content}</h2>`;
  });
  const links = headings.map(({ id, text }) => `<li><a href="#${id}">${text}</a></li>`).join('');
  const toc = `<nav class="article-toc" aria-label="Table of contents"><strong>Table of contents</strong><ol>${links}</ol></nav>`;
  const topCtaParagraph = /(<p>\s*<a class="blog-cta"[^>]*data-blog-cta="top"[\s\S]*?<\/a>\s*<\/p>)/;
  if (!topCtaParagraph.test(withIds)) throw new Error('Top CTA paragraph not found for TOC insertion');
  return withIds.replace(topCtaParagraph, `$1\n${toc}`);
};

const ctaUrl = (category, slug, position) => {
  const url = new URL('https://en.jazzify.jp/');
  url.searchParams.set('utm_source', 'en_blog');
  url.searchParams.set('utm_medium', 'organic');
  url.searchParams.set('utm_campaign', category.replaceAll('-', '_'));
  url.searchParams.set('utm_content', `${slug}_${position}`);
  return url.toString().replaceAll('&', '&amp;');
};

const normalizeBody = (body, slug, category) => {
  let normalized = body
    .replace(
      /https:\/\/example\.com\/wp-content\/uploads\/jazzify-en\/[^/]+\/images\/([^"'\s>]+)/g,
      (_match, filename) =>
        filename === 'jazzify-cta-top-en.png' || filename === 'jazzify-cta-bottom-en.png'
          ? `${CDN_BASE}/_shared/cta/${filename}`
          : `${CDN_BASE}/${slug}/images/${filename}`,
    )
    .replace(
      /https:\/\/example\.com\/wp-content\/uploads\/jazzify-en\/[^/]+\/audio\/([^"'\s>]+)/g,
      (_match, filename) => `${CDN_BASE}/${slug}/audio/${filename}`,
    );

  normalized = addImageLoadingAttributes(normalized);
  normalized = normalized.replace(
    /<a href="https:\/\/example\.com\/jazzify">\s*(<img[^>]*jazzify-cta-(top|bottom)-en\.png[^>]*>)\s*<\/a>/g,
    (_match, image, position) => {
      const ariaLabel =
        position === 'top'
          ? 'Try Jazzify free — practice what you learned'
          : 'Try Jazzify free — continue learning by playing';
      return `<a class="blog-cta" href="${ctaUrl(category, slug, position)}" aria-label="${ariaLabel}" data-blog-cta="${position}" data-article-slug="${slug}" data-article-category="${category}" data-cta-asset="jazzify-cta-${position}-en.png">${image}</a>`;
    },
  );
  normalized = normalized.replace(/<audio\b(?![^>]*\bpreload=)([^>]*)>/g, '<audio preload="none"$1>');

  if (normalized.includes('example.com')) throw new Error(`${slug}: placeholder URL remains`);
  if ((normalized.match(/data-blog-cta="top"/g) || []).length !== 1) {
    throw new Error(`${slug}: expected one top CTA`);
  }
  if ((normalized.match(/data-blog-cta="bottom"/g) || []).length !== 1) {
    throw new Error(`${slug}: expected one bottom CTA`);
  }

  return addTableOfContents(normalized);
};

const relatedSlugs = (category, slug) => {
  const index = category.articles.indexOf(slug);
  if (index < 0) throw new Error(`${slug}: missing from category group`);
  return [1, 2, 3].map((offset) => category.articles[(index + offset) % category.articles.length]);
};

const yamlLine = (key, value) => `${key}: ${JSON.stringify(value)}`;

const buildMarkdown = (metadata, body, category) => {
  const slug = metadata.get('SLUG');
  const secondaryKeywords = metadata
    .get('SECONDARY KEYWORDS')
    .split(/[;,]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const primaryKeyword = metadata.get('PRIMARY KEYWORD');
  const frontmatter = [
    yamlLine('title', metadata.get('TITLE')),
    yamlLine('slug', slug),
    yamlLine('description', metadata.get('META DESCRIPTION')),
    yamlLine('primaryKeyword', primaryKeyword),
    yamlLine('secondaryKeywords', secondaryKeywords),
    yamlLine('originalUrl', metadata.get('ORIGINAL URL')),
    yamlLine('author', AUTHOR),
    yamlLine('publishedAt', PUBLISHED_AT),
    yamlLine('updatedAt', PUBLISHED_AT),
    ...(slug === 'best-apps-for-jazz-practice' ? [yamlLine('lastReviewedAt', PUBLISHED_AT)] : []),
    yamlLine('category', category.slug),
    yamlLine('categoryLabel', category.label),
    yamlLine('tags', [primaryKeyword, ...secondaryKeywords]),
    yamlLine('relatedSlugs', relatedSlugs(category, slug)),
    yamlLine('ogImage', DEFAULT_OG_IMAGE),
  ].join('\n');
  return `---\n${frontmatter}\n---\n\n${normalizeBody(body, slug, category.slug)}\n`;
};

await mkdir(outputRoot, { recursive: true });
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const [slug, category] of categoryBySlug) {
  const filePath = resolve(sourceRoot, slug, `${slug}-en.txt`);
  const source = await readFile(filePath, 'utf8');
  const metadata = parseMetadata(source, filePath);
  if (metadata.get('SLUG') !== slug) throw new Error(`${filePath}: slug mismatch`);
  const markdown = buildMarkdown(metadata, stripDeliveryComments(source), category);
  await writeFile(resolve(outputRoot, `${slug}.md`), markdown, 'utf8');
}

process.stdout.write(`Imported ${categoryBySlug.size} English articles into ${outputRoot}\n`);
