import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLandingCopy } from '@/components/landing/landingCopy';

describe('index-en.html SEO sync', () => {
  it('COPY_EN.seo の title/description が index-en.html に含まれる', () => {
    const copy = getLandingCopy(true);
    const htmlPath = resolve(process.cwd(), 'index-en.html');
    const html = readFileSync(htmlPath, 'utf8');

    expect(html).toContain(copy.seo.title);
    expect(html).toContain(copy.seo.description);
  });
});
