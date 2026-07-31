import { describe, expect, it } from 'vitest';
import { resolveLpHeroCtaVariant } from '@/components/landing/lpHeroCtaVariant';

describe('resolveLpHeroCtaVariant', () => {
  it('returns desktop when width is desktop regardless of OS', () => {
    expect(resolveLpHeroCtaVariant(true, 'ios')).toBe('desktop');
    expect(resolveLpHeroCtaVariant(true, 'android')).toBe('desktop');
  });

  it('returns ios for Apple mobile/tablet widths', () => {
    expect(resolveLpHeroCtaVariant(false, 'ios')).toBe('ios');
  });

  it('returns mobileWeb for non-iOS narrow viewports', () => {
    expect(resolveLpHeroCtaVariant(false, 'android')).toBe('mobileWeb');
    expect(resolveLpHeroCtaVariant(false, 'other')).toBe('mobileWeb');
  });
});
