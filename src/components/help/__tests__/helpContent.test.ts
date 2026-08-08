import {
  buildAmazonSearchUrl,
  getHelpIosMidiCopy,
  getHelpMidiKeyboardChoiceCopy,
} from '@/components/help/helpContent';

describe('helpContent', () => {
  it('returns non-empty English copy for HelpIosMidi', () => {
    const copy = getHelpIosMidiCopy('en');
    expect(copy.pageTitle.length).toBeGreaterThan(0);
    expect(copy.lightningExamples).toHaveLength(2);
    expect(copy.usbcExamples).toHaveLength(4);
    expect(copy.tips.length).toBeGreaterThan(0);
    expect(copy.midiChoiceLinkLabel.length).toBeGreaterThan(0);
    expect(copy.usbcBody).toContain('iPhone 15');
    expect(copy.lightningBody).toContain('iPhone 14');
  });

  it('returns non-empty English copy for HelpMidiKeyboardChoice', () => {
    const copy = getHelpMidiKeyboardChoiceCopy('en');
    expect(copy.pageTitle.length).toBeGreaterThan(0);
    expect(copy.models).toHaveLength(3);
    expect(copy.sizeTable.length).toBeGreaterThan(0);
    expect(copy.models[0].amazonSearch.keyword.length).toBeGreaterThan(0);
  });

  it('uses different page titles for ja and en', () => {
    const ja = getHelpIosMidiCopy('ja');
    const en = getHelpIosMidiCopy('en');
    expect(ja.pageTitle).not.toBe(en.pageTitle);

    const jaChoice = getHelpMidiKeyboardChoiceCopy('ja');
    const enChoice = getHelpMidiKeyboardChoiceCopy('en');
    expect(jaChoice.pageTitle).not.toBe(enChoice.pageTitle);
  });

  it('builds Amazon search URLs for ja and en', () => {
    expect(buildAmazonSearchUrl('ja', 'USB Type-C ハブ')).toBe(
      'https://www.amazon.co.jp/s?k=USB+Type-C+%E3%83%8F%E3%83%96',
    );
    expect(buildAmazonSearchUrl('en', 'USB-C hub')).toBe(
      'https://www.amazon.com/s?k=USB-C+hub',
    );
  });

  it('includes iPhone generation notes in Japanese ios-midi copy', () => {
    const ja = getHelpIosMidiCopy('ja');
    expect(ja.usbcBody).toContain('iPhone 15');
    expect(ja.lightningBody).toContain('iPhone 14');
    expect(ja.usbcExamples[0].amazonLinks?.length).toBeGreaterThan(0);
  });
});
