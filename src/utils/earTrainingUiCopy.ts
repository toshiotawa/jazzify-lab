import type { EarTrainingBattleHudLabels } from '@/game/earTraining/types';

/** Supabase 等から投げられる耳コピ「未検出」メッセージ（UI で英語へマッピングする） */
export const EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA = '耳コピステージが見つかりません';

export interface EarTrainingMainCopy {
  loading: string;
  preparing: string;
  title: string;
  stageNotFound: string;
  back: string;
  noStagesRegistered: string;
  loadFailedDefault: string;
  stageNotFoundFromFetch: string;
}

export const getEarTrainingMainCopy = (isEnglish: boolean): EarTrainingMainCopy => (
  isEnglish
    ? {
        loading: 'Loading ear training battle…',
        preparing: 'Preparing ear training battle…',
        title: 'Ear training battle',
        stageNotFound: 'Stage not found',
        back: 'Back',
        noStagesRegistered: 'No ear training stages are available.',
        loadFailedDefault: 'Failed to load ear training stages.',
        stageNotFoundFromFetch: 'Ear training stage not found.',
      }
    : {
        loading: '耳コピバトルを読み込み中…',
        preparing: '耳コピバトルを準備中…',
        title: '耳コピバトル',
        stageNotFound: 'ステージが見つかりません',
        back: '戻る',
        noStagesRegistered: '耳コピステージが登録されていません',
        loadFailedDefault: '耳コピステージの読み込みに失敗しました',
        stageNotFoundFromFetch: EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA,
      }
);

export interface EarTrainingSettingsModalCopy {
  dialogAriaLabel: string;
  title: string;
  closeAriaLabel: string;
  close: string;
  midiHeading: string;
  midiConnected: string;
  midiDisconnected: string;
  volumeHeading: string;
  master: string;
  phraseAudio: string;
  inputPiano: string;
  soundEffects: string;
}

export const getEarTrainingSettingsModalCopy = (isEnglish: boolean): EarTrainingSettingsModalCopy => (
  isEnglish
    ? {
        dialogAriaLabel: 'Ear training battle settings',
        title: 'Ear training battle settings',
        closeAriaLabel: 'Close settings',
        close: 'Close',
        midiHeading: 'MIDI device',
        midiConnected: 'Connected',
        midiDisconnected: 'Not connected or not selected',
        volumeHeading: 'Volume',
        master: 'Master',
        phraseAudio: 'Phrase audio',
        inputPiano: 'Input piano',
        soundEffects: 'Sound effects',
      }
    : {
        dialogAriaLabel: '耳コピバトル設定',
        title: '耳コピバトル設定',
        closeAriaLabel: '設定を閉じる',
        close: '閉じる',
        midiHeading: 'MIDIデバイス',
        midiConnected: '接続済み',
        midiDisconnected: '未接続または未選択',
        volumeHeading: '音量',
        master: 'マスター',
        phraseAudio: 'フレーズ音源',
        inputPiano: '入力ピアノ',
        soundEffects: '効果音',
      }
);

export interface EarTrainingGameCopy {
  idlePrompt: string;
  stageClear: string;
  gameOver: string;
  timeOver: string;
  failAdvance: string;
  noPhrases: string;
  audioFailed: string;
  countIn: string;
  transitionNextBar: (rank: string) => string;
  correct: (revealedNote?: string) => string;
  missEnemyAttack: string;
  tryAgain: string;
  lessonSaved: string;
  lessonSaving: string;
  phraseLabel: (indexOneBased: number) => string;
}

export const getEarTrainingGameCopy = (isEnglish: boolean): EarTrainingGameCopy => (
  isEnglish
    ? {
        idlePrompt: 'Press START when you are ready.',
        stageClear: 'Stage clear!',
        gameOver: 'Game over',
        timeOver: 'Time over',
        failAdvance: 'Fail — moving to the next phrase',
        noPhrases: 'No phrases are registered for this stage.',
        audioFailed: 'Could not play audio. Please try starting again.',
        countIn: 'Count-in',
        transitionNextBar: rank => `${rank} — next phrase at the next bar line`,
        correct: revealedNote => (revealedNote ? `Correct: ${revealedNote}` : 'Correct'),
        missEnemyAttack: 'Miss — enemy attack',
        tryAgain: 'Try again',
        lessonSaved: 'Lesson progress saved',
        lessonSaving: 'Saving lesson progress…',
        phraseLabel: indexOneBased => `Phrase ${indexOneBased}`,
      }
    : {
        idlePrompt: '準備ができたら開始してください',
        stageClear: 'ステージクリア！',
        gameOver: 'ゲームオーバー',
        timeOver: 'タイムオーバー',
        failAdvance: 'Fail: 次のフレーズへ進みます',
        noPhrases: 'フレーズが登録されていません',
        audioFailed: '音源を再生できませんでした。もう一度開始してください。',
        countIn: 'カウントイン',
        transitionNextBar: rank => `${rank}: 次の小節頭で次へ`,
        correct: revealedNote => (revealedNote ? `正解: ${revealedNote}` : '正解'),
        missEnemyAttack: 'ミス: 敵の攻撃',
        tryAgain: 'もう一度',
        lessonSaved: 'レッスン進捗を保存しました',
        lessonSaving: 'レッスン進捗を保存中…',
        phraseLabel: indexOneBased => `フレーズ ${indexOneBased}`,
      }
);

export const getEarTrainingBattleHudLabels = (isEnglish: boolean): EarTrainingBattleHudLabels => (
  isEnglish
    ? {
        settings: 'Settings',
        backShort: 'Back',
        practiceBadge: 'Practice',
        battleMode: 'Battle',
        practiceMode: 'Practice',
        lobbyBack: 'Back',
        resultWin: 'You win',
        resultLose: 'You lose',
        resultTimeOver: 'Time over',
        rankPrefix: 'Rank',
      }
    : {
        settings: '設定',
        backShort: '戻る',
        practiceBadge: '練習',
        battleMode: 'バトル',
        practiceMode: '練習',
        lobbyBack: '戻る',
        resultWin: '勝利',
        resultLose: '敗北',
        resultTimeOver: 'タイムオーバー',
        rankPrefix: 'ランク',
      }
);

export const formatEarTrainingPhraseIntroLine = (
  isEnglish: boolean,
  phraseIndex: number,
  totalPhrases: number,
): string => {
  const current = phraseIndex + 1;
  return isEnglish
    ? `Phrase ${current} / ${totalPhrases}`
    : `フレーズ ${current} / ${totalPhrases}`;
};

export const formatEarTrainingCountInDisplay = (isEnglish: boolean, countValue: number): string => (
  isEnglish ? `Count ${countValue}` : `カウント ${countValue}`
);
