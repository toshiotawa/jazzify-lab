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

  it('returns main_quest trial-aware CTA with footnote', () => {
    const trialCopy = resolveWebPaywallCopy('main_quest', false, false);
    expect(trialCopy.ctaLabel).toBe('7日間無料で第2チャプターを始める');
    expect(trialCopy.ctaFootnote).toBe(
      '本日のお支払いはありません。7日後から年額¥34,800。いつでもキャンセルできます。',
    );
    expect(trialCopy.trialUsedNotice).toBeUndefined();

    const usedCopy = resolveWebPaywallCopy('main_quest', false, true);
    expect(usedCopy.ctaLabel).toBe('次のチャプターへ進む');
    expect(usedCopy.ctaFootnote).toBeUndefined();
    expect(usedCopy.trialUsedNotice).toBe(
      '無料トライアルは利用済みです。購入時に年額¥34,800が請求されます。',
    );
  });

  it('returns generic dashboard trial footnote and notice', () => {
    const trialCopy = resolveWebPaywallCopy('dashboard', false, false);
    expect(trialCopy.ctaLabel).toBe('7日間無料で始める');
    expect(trialCopy.ctaFootnote).toBe(
      '本日のお支払いはありません。7日後から年額¥34,800。いつでもキャンセルできます。',
    );
    expect(trialCopy.trialUsedNotice).toBeUndefined();

    const usedCopy = resolveWebPaywallCopy('dashboard', false, true);
    expect(usedCopy.ctaLabel).toBe('すべてのクエストを解放する');
    expect(usedCopy.ctaFootnote).toBeUndefined();
    expect(usedCopy.trialUsedNotice).toBe(
      '無料トライアルは利用済みです。購入時に年額¥34,800が請求されます。',
    );
  });

  it('returns english trial footnote for lesson_list', () => {
    const copy = resolveWebPaywallCopy('lesson_list', true, false);
    expect(copy.ctaLabel).toBe('Start 7-day free trial');
    expect(copy.ctaFootnote).toBe(
      'No charge today. ¥34,800/year after 7 days. Cancel anytime.',
    );
  });
});
