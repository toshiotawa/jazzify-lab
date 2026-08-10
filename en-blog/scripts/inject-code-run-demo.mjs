#!/usr/bin/env node
/**
 * Insert a bottom-of-article Code Run demo CTA into every en-blog markdown file.
 * 名盤系 (album/artists) → demo_2
 * ジャズ系 (theory-voicings) → demo_4
 * 初心者系 (beginner slug / practice / gear) → demo_2
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/data/blog');

const APP_STORE_URL =
  'https://apps.apple.com/app/apple-store/id6761457001?pt=128644431&ct=en_blog_code_run_demo&mt=8';

const EXISTING_EMBED_RE =
  /<figure class="code-run-demo-embed">[\s\S]*?<\/figure>\s*/g;
const BOTTOM_SECTION_RE =
  /<section class="code-run-demo-section"[\s\S]*?<\/section>\s*/g;
const BOTTOM_CTA_RE =
  /<p><a class="blog-cta"[^>]*data-blog-cta="bottom"[^>]*>[\s\S]*?<\/a><\/p>\s*$/;

const resolveDemoId = (category, slug) => {
  if (slug.includes('beginner')) return 'demo_2';
  if (category === 'album-guides' || category === 'artists-listening') return 'demo_2';
  if (category === 'theory-voicings') return 'demo_4';
  return 'demo_2';
};

const buildSection = (demoId) => {
  const isChord = demoId === 'demo_4';
  const title = isChord
    ? 'Jazzify Chord Run demo — ii–V–I voicings'
    : 'Jazzify Chord Run demo — single notes C through G';
  const caption = isChord
    ? 'Play Dm7(9)–G7(9.13)–CM7(9) to jump. MIDI keyboard or on-screen piano both work.'
    : 'Play C–G notes to jump. MIDI keyboard or on-screen piano both work.';

  return `<section class="code-run-demo-section" aria-labelledby="code-run-demo-heading">
  <h2 id="code-run-demo-heading" class="code-run-demo-section__title"><span>Play the Jazzify demo right now</span></h2>
  <p class="code-run-demo-section__lead">Connect a MIDI keyboard and play this interactive demo in your browser.</p>
  <p class="code-run-demo-section__note">On iPhone and iPad, browsers cannot use a MIDI keyboard. Please use the <a href="${APP_STORE_URL}" rel="noopener noreferrer" target="_blank">Jazzify app</a> instead.</p>
  <figure class="code-run-demo-embed">
    <iframe
      src="https://en.jazzify.jp/embed/code-run?id=${demoId}&from=en_blog"
      title="${title}"
      allow="midi; autoplay; fullscreen"
      allowfullscreen
      loading="lazy"
      style="width:100%;height:min(78vh,760px);min-height:520px;border:0;border-radius:12px;background:#000"
    ></iframe>
    <figcaption>${caption}</figcaption>
  </figure>
</section>

`;
};

/** Clean one-off mid-article demo intros that no longer apply. */
const cleanArticleSpecificCopy = (slug, content) => {
  if (slug === 'jazz-ii-v-i-progression') {
    return content.replace(
      / Practice it with a steady pulse, transpose it, and listen to how each chord changes the sense of tension\. Try the interactive Chord Run demo below — play Dm7\(9\)–G7\(9\.13\)–CM7\(9\) to jump and reach the goal\./,
      ' Practice it with a steady pulse, transpose it, and listen to how each chord changes the sense of tension.',
    );
  }
  return content;
};

const readCategory = (content) => {
  const match = content.match(/^category:\s*"([^"]+)"/m);
  return match?.[1] ?? '';
};

const files = fs.readdirSync(blogDir).filter((name) => name.endsWith('.md'));
let updated = 0;
const summary = { demo_2: 0, demo_4: 0 };

for (const name of files) {
  const slug = name.replace(/\.md$/, '');
  const filePath = path.join(blogDir, name);
  let content = fs.readFileSync(filePath, 'utf8');
  const beforeLen = content.length;
  const category = readCategory(content);
  const demoId = resolveDemoId(category, slug);

  content = content.replace(EXISTING_EMBED_RE, '');
  content = content.replace(BOTTOM_SECTION_RE, '');
  content = cleanArticleSpecificCopy(slug, content);

  if (!BOTTOM_CTA_RE.test(content)) {
    console.warn(`skip (no bottom blog-cta): ${name}`);
    continue;
  }

  const section = buildSection(demoId);
  content = content.replace(BOTTOM_CTA_RE, `${section}$&`);

  // Safety: never allow a large unexpected shrink (previous buggy regex ate article bodies).
  if (content.length + 500 < beforeLen) {
    console.error(`ABORT size shrink on ${name}: ${beforeLen} → ${content.length}`);
    process.exit(1);
  }

  fs.writeFileSync(filePath, content);
  updated += 1;
  summary[demoId] += 1;
}

console.log(`Updated ${updated} / ${files.length} articles`);
console.log(summary);
