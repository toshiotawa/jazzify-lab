import {
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
  });

  it('returns non-empty English copy for HelpMidiKeyboardChoice', () => {
    const copy = getHelpMidiKeyboardChoiceCopy('en');
    expect(copy.pageTitle.length).toBeGreaterThan(0);
    expect(copy.models).toHaveLength(3);
    expect(copy.sizeTable.length).toBeGreaterThan(0);
  });

  it('uses different page titles for ja and en', () => {
    const ja = getHelpIosMidiCopy('ja');
    const en = getHelpIosMidiCopy('en');
    expect(ja.pageTitle).not.toBe(en.pageTitle);

    const jaChoice = getHelpMidiKeyboardChoiceCopy('ja');
    const enChoice = getHelpMidiKeyboardChoiceCopy('en');
    expect(jaChoice.pageTitle).not.toBe(enChoice.pageTitle);
  });
});
