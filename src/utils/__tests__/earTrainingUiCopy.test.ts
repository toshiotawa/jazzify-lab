import {
  EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA,
  formatEarTrainingCountInDisplay,
  formatEarTrainingPhraseIntroLine,
  getEarTrainingBattleHudLabels,
  getEarTrainingGameCopy,
  getEarTrainingMainCopy,
  getEarTrainingSettingsModalCopy,
} from '@/utils/earTrainingUiCopy';

describe('earTrainingUiCopy', () => {
  describe('getEarTrainingMainCopy', () => {
    it('英語モードでは読み込み文言が英語になる', () => {
      const en = getEarTrainingMainCopy(true);
      expect(en.loading).toContain('Loading');
      expect(en.title).toBe('Battle mode');
      expect(en.back).toBe('Back');
      expect(en.noStagesRegistered).toContain('No battle mode');
    });

    it('日本語モードでは読み込み文言が日本語になる', () => {
      const ja = getEarTrainingMainCopy(false);
      expect(ja.loading).toContain('読み込み');
      expect(ja.title).toBe('バトルモード');
      expect(ja.back).toBe('戻る');
    });
  });

  describe('getEarTrainingSettingsModalCopy', () => {
    it('英語では設定モーダル見出しが英語になる', () => {
      const en = getEarTrainingSettingsModalCopy(true);
      expect(en.title).toContain('settings');
      expect(en.midiHeading).toBe('MIDI device');
      expect(en.master).toBe('Master');
    });

    it('日本語では設定モーダル見出しが日本語になる', () => {
      const ja = getEarTrainingSettingsModalCopy(false);
      expect(ja.title).toContain('バトルモード');
      expect(ja.midiHeading).toBe('MIDIデバイス');
    });
  });

  describe('getEarTrainingGameCopy', () => {
    it('英語ではステータス用コピーが英語になる', () => {
      const en = getEarTrainingGameCopy(true);
      expect(en.idlePrompt).toContain('START');
      expect(en.stageClear.toLowerCase()).toContain('clear');
      expect(en.transitionNextBar('Great')).toContain('Great');
    });

    it('日本語ではステータス用コピーが日本語になる', () => {
      const ja = getEarTrainingGameCopy(false);
      expect(ja.idlePrompt).toContain('開始');
      expect(ja.stageClear).toContain('クリア');
    });
  });

  describe('getEarTrainingBattleHudLabels', () => {
    it('英語ではPhaser HUD 用ラベルが英語になる', () => {
      const en = getEarTrainingBattleHudLabels(true);
      expect(en.settings).toBe('Settings');
      expect(en.battleMode).toBe('Battle');
      expect(en.resultWin).toContain('win');
    });

    it('日本語ではPhaser HUD 用ラベルが日本語になる', () => {
      const ja = getEarTrainingBattleHudLabels(false);
      expect(ja.settings).toBe('設定');
      expect(ja.battleMode).toBe('バトル');
    });
  });

  describe('formatEarTrainingPhraseIntroLine', () => {
    it('フレーズ進行表示をロケールに合わせる', () => {
      expect(formatEarTrainingPhraseIntroLine(true, 0, 3)).toBe('Phrase 1 / 3');
      expect(formatEarTrainingPhraseIntroLine(false, 1, 4)).toBe('フレーズ 2 / 4');
    });
  });

  describe('formatEarTrainingCountInDisplay', () => {
    it('カウントイン表示をロケールに合わせる', () => {
      expect(formatEarTrainingCountInDisplay(true, 4)).toBe('Count 4');
      expect(formatEarTrainingCountInDisplay(false, 4)).toBe('カウント 4');
    });
  });

  it('未検出メッセージ定数が日本語である', () => {
    expect(EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA).toContain('バトルモード');
  });
});
