import type { EarTrainingBattleHudLabels } from '@/game/earTraining/types';

/** Supabase 等から投げられるバトルモード「未検出」メッセージ（UI で英語へマッピングする） */
export const EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA = 'バトルモードステージが見つかりません';

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
        loading: 'Loading battle mode…',
        preparing: 'Preparing battle mode…',
        title: 'Battle mode',
        stageNotFound: 'Stage not found',
        back: 'Back',
        noStagesRegistered: 'No battle mode stages are available.',
        loadFailedDefault: 'Failed to load battle mode stages.',
        stageNotFoundFromFetch: 'Battle mode stage not found.',
      }
    : {
        loading: 'バトルモードを読み込み中…',
        preparing: 'バトルモードを準備中…',
        title: 'バトルモード',
        stageNotFound: 'ステージが見つかりません',
        back: '戻る',
        noStagesRegistered: 'バトルモードステージが登録されていません',
        loadFailedDefault: 'バトルモードステージの読み込みに失敗しました',
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
        dialogAriaLabel: 'Battle mode settings',
        title: 'Battle mode settings',
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
        dialogAriaLabel: 'バトルモード設定',
        title: 'バトルモード設定',
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
  chordCompleted: (chordName: string) => string;
  chordWindowFail: (chordName: string) => string;
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
        chordCompleted: chordName => `Completed: ${chordName}`,
        chordWindowFail: chordName => `Incomplete: ${chordName}`,
        missEnemyAttack: 'Miss',
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
        chordCompleted: chordName => `完成: ${chordName}`,
        chordWindowFail: chordName => `未完成: ${chordName}`,
        missEnemyAttack: 'ミス',
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
        clearGradePrefix: 'Clear grade',
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
        clearGradePrefix: 'クリア評価',
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
