import { resolveWebPaywallCopy } from '@/utils/webPaywallCopy';

describe('resolveWebPaywallCopy', () => {
  it('returns chapter-complete copy with trial CTA when trial is unused', () => {
    const copy = resolveWebPaywallCopy('chapter_complete', false, false);
    expect(copy.headline).toBe('メインクエストの続きを開放');
    expect(copy.features).toEqual([
      'メインクエストの全チャプター',
      'ブルースで使える音・リズム・コードを段階的に習得',
      'サバイバルで繰り返し実践',
      '学習記録を保存',
    ]);
    expect(copy.ctaLabel).toBe('7日間無料で次のチャプターを始める');
    expect(copy.ctaFootnote).toBe(
      '本日のお支払いはありません。7日後から年額¥34,800。いつでもキャンセルできます。',
    );
    expect(copy.trialUsedNotice).toBeUndefined();
  });

  it('returns chapter-complete subscribe copy when trial is used', () => {
    const copy = resolveWebPaywallCopy('chapter_complete', false, true);
    expect(copy.subheadline).toContain('Cブルースのコードをつかむ');
    expect(copy.ctaLabel).toBe('次のチャプターへ進む');
    expect(copy.trialUsedNotice).toBe(
      '無料トライアルは利用済みです。購入時に年額¥34,800が請求されます。',
    );
    expect(copy.ctaFootnote).toBeUndefined();
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
