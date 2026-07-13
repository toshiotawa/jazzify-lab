import { resolveWebPaywallCopy } from '@/utils/webPaywallCopy';

describe('resolveWebPaywallCopy', () => {
  it('returns chapter-complete copy with trial CTA when trial is unused', () => {
    const copy = resolveWebPaywallCopy('chapter_complete', false, false);
    expect(copy.headline).toBe('第1チャプタークリア！');
    expect(copy.features).toEqual([
      '使える音を増やす',
      'コードに合わせて弾く',
      '実践的なフレーズを身につける',
    ]);
    expect(copy.ctaLabel).toBe('7日間無料で第2チャプターを始める');
  });

  it('returns chapter-complete subscribe copy when trial is used', () => {
    const copy = resolveWebPaywallCopy('chapter_complete', false, true);
    expect(copy.subheadline).toContain('次のチャプター');
    expect(copy.ctaLabel).toBe('次のチャプターへ進む');
  });

  it('returns main_quest trial-aware CTA', () => {
    expect(resolveWebPaywallCopy('main_quest', false, false).ctaLabel).toBe(
      '7日間無料で第2チャプターを始める',
    );
    expect(resolveWebPaywallCopy('main_quest', false, true).ctaLabel).toBe(
      '次のチャプターへ進む',
    );
  });

  it('returns generic dashboard copy', () => {
    expect(resolveWebPaywallCopy('dashboard', false, false).ctaLabel).toBe(
      '7日間無料で始める',
    );
    expect(resolveWebPaywallCopy('dashboard', false, true).ctaLabel).toBe(
      'すべてのクエストを解放する',
    );
  });
});
