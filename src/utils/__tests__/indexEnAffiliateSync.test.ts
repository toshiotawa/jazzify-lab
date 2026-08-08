import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('index-en.html affiliate tracking', () => {
  const html = readFileSync(resolve(process.cwd(), 'index-en.html'), 'utf8');

  it('configures the enjazzifyjp USD store for affiliate.js', () => {
    expect(html).toContain("window.lemonSqueezyAffiliateConfig = { store: 'enjazzifyjp' }");
    expect(html).toContain('https://lmsqueezy.com/affiliate.js');
  });

  it('loads affiliate.js conditionally so the DOM observer never runs in the app', () => {
    expect(html).toContain("new URLSearchParams(location.search).has('aff')");
    expect(html).toContain("document.cookie.indexOf('ls_aff_ref=')");
    expect(html).not.toContain('<script src="https://lmsqueezy.com/affiliate.js"');
  });
});
