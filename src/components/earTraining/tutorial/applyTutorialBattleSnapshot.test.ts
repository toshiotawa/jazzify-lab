import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import { applyTutorialBattleSnapshot } from './applyTutorialBattleSnapshot';
import type { EarTrainingTutorialUiOverrides } from './earTrainingTutorialScriptTypes';

const baseSnapshot: EarTrainingBattleSnapshot = {
  gameState: 'playingPhrase',
  resultState: null,
  stageTitle: 'Tutorial',
  statusText: '',
  hudLabels: {
    settings: 'SETTINGS',
    backShort: 'BACK',
    practiceBadge: 'PRACTICE',
    battleMode: 'Battle',
    practiceMode: 'Practice',
    lobbyBack: 'Back',
    resultWin: 'Win',
    resultLose: 'Lose',
    resultTimeOver: 'Time over',
  },
  phraseIntroLine: 'Phrase 1',
  resultRankLine: null,
  timeLabel: '0:00',
  practiceMode: false,
  isMidiConnected: false,
  playerHp: 100,
  playerMaxHp: 100,
  enemyHp: 100,
  enemyMaxHp: 100,
  enemyName: 'Enemy',
  enemyAvatarUrl: '',
  enemyAvatarFlipX: false,
  playerAvatarUrl: '',
  phraseIndex: 0,
  phraseRunId: 0,
  phraseIntroSeq: 0,
  totalPhrases: 1,
  activeLoop: 1,
  maxLoops: 1,
  demoLoopActive: false,
  enemyAttackGaugePercent: 50,
  chords: [],
  phraseSlots: [],
  revealedNotes: [],
  currentNoteIndex: 0,
  slotKind: 'circle',
  chordCompleted: [],
  countInValue: 0,
  lastRank: null,
  showLobbyControls: true,
  canChangePracticeMode: false,
  startButtonLabel: 'START',
  lessonProgressText: null,
  hideSettingsButton: true,
};

const tutorialUi: EarTrainingTutorialUiOverrides = {
  hidePlayerHpBar: true,
  hideSettingsButton: true,
  hideBackButton: true,
  hideLobby: true,
  hideMidiToggle: true,
  hidePhraseIntroQuota: true,
  showExitButton: true,
  playerInvincible: true,
  disableEnemyAttacks: true,
  keyboardHintsDefault: true,
};

describe('applyTutorialBattleSnapshot', () => {
  it('always shows the settings button regardless of script ui overrides', () => {
    const result = applyTutorialBattleSnapshot(baseSnapshot, tutorialUi);
    expect(result.hideSettingsButton).toBe(false);
  });

  it('still applies other tutorial ui overrides', () => {
    const result = applyTutorialBattleSnapshot(baseSnapshot, tutorialUi);
    expect(result.hidePlayerHpBar).toBe(true);
    expect(result.hideBackButton).toBe(true);
    expect(result.hideLobbyControls).toBe(true);
    expect(result.phraseIntroLine).toBe('');
  });
});
