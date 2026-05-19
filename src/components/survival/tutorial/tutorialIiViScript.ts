import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import {
  TUTORIAL_BOOTSTRAP_OVERRIDES,
  type SurvivalScenarioOverrides,
} from '@/components/survival/scenario/survivalScenarioTypes';
import { TutorialAudioController } from './TutorialAudioController';
import { hasWebMidiInputDeviceInitially } from './tutorialMidiSetup';
import {
  TUTORIAL_CM7,
  TUTORIAL_DM7,
  TUTORIAL_G7,
  TUTORIAL_SCENE3_CM7,
  TUTORIAL_SCENE3_DM7,
  TUTORIAL_SCENE3_G7,
} from './tutorialOnboardingChords';

export interface TutorialRunnerUi {
  setCharacterText: (text: string) => void;
  setNarrationText: (text: string) => void;
  setConnectedDeviceLine: (line: string | null) => void;
  setShowPillarCard: (show: boolean) => void;
  setPillarCaption: (caption: string | null) => void;
  setPillarSystemImage: (image: string | null) => void;
  setShowCta: (show: boolean) => void;
}

export interface RunTutorialIiViScriptParams {
  isEnglishCopy: boolean;
  ui: TutorialRunnerUi;
  handle: SurvivalScenarioHandle;
  audio: TutorialAudioController;
  waitForMidiNoteOrTimeout: (seconds: number) => Promise<boolean>;
  waitForFirstInputNote: () => Promise<void>;
  waitForSlotBCompletion: (startPulse: number, seconds: number) => Promise<boolean>;
  onFinish: () => void;
  signal: AbortSignal;
}

/** iOS G7 と同様: forward 95、横方向 (i−2)×52 の 5体 */
export const ONBOARDING_G7_PERP_OFFSETS_PX = [-104, -52, 0, 52, 104] as const;

function sleep(seconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const ms = Math.max(0, seconds * 1000);
    const t = window.setTimeout(() => resolve(), ms);
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

function scene1Base(): SurvivalScenarioOverrides {
  const o = { ...TUTORIAL_BOOTSTRAP_OVERRIDES };
  o.hideHud = false;
  o.hideStageTitle = true;
  o.hideTimerDisplay = true;
  o.hideKillCounter = true;
  o.hidePauseButton = true;
  o.hideHintBadge = true;
  o.hideStatusStrip = true;
  o.hidePlayerHpBar = true;
  o.hideStaff = true;
  o.hideChordSlots = true;
  o.hideChordPad = true;
  o.blockSlotEvaluation = true;
  return o;
}

function scene2Base(): SurvivalScenarioOverrides {
  const o = { ...TUTORIAL_BOOTSTRAP_OVERRIDES };
  o.hideHud = true;
  o.hideStaff = true;
  o.hideChordSlots = true;
  o.hideComboBadge = true;
  o.hideChordPad = false;
  o.blockChordPadInput = true;
  o.blockMidiGameInput = true;
  o.blockSlotEvaluation = true;
  return o;
}

function scene3Base(): SurvivalScenarioOverrides {
  const o = { ...TUTORIAL_BOOTSTRAP_OVERRIDES };
  o.hideHud = false;
  o.hideStageTitle = true;
  o.hideTimerDisplay = true;
  o.hideKillCounter = true;
  o.hidePauseButton = true;
  o.hideHintBadge = true;
  o.hideStatusStrip = true;
  o.hideStaff = true;
  o.hideChordSlots = true;
  o.hideChordPad = false;
  o.hideComboBadge = true;
  o.scenarioStaffClef = 1;
  o.hideStaffOnBSlotCompletion = true;
  o.useChordMidiNotesForHintHighlights = true;
  o.staffMode = 'progression';
  o.blockSlotEvaluation = false;
  o.blockChordPadInput = false;
  o.blockMidiGameInput = false;
  return o;
}

function scene5Base(): SurvivalScenarioOverrides {
  const o = { ...TUTORIAL_BOOTSTRAP_OVERRIDES };
  o.hideHud = true;
  o.hideStaff = true;
  o.hideChordSlots = true;
  o.hideComboBadge = true;
  o.hideChordPad = false;
  o.blockSlotEvaluation = true;
  o.blockChordPadInput = false;
  o.blockMidiGameInput = true;
  return o;
}

async function playSceneOneChord(
  handle: SurvivalScenarioHandle,
  chord: ChordDefinition,
  spawn: () => void,
  attack: () => void,
  signal: AbortSignal,
): Promise<void> {
  handle.clearEnemies();
  handle.setSlotBChord(chord);
  await sleep(0.35, signal);
  spawn();
  await sleep(0.55, signal);
  const midis = chord.notes;
  if (midis.length > 0) {
    handle.playChordAudio(midis);
    const root = midis[0];
    if (root !== undefined) {
      handle.playChordAudio([root]);
    }
  }
  await sleep(0.25, signal);
  handle.emitChordNameText(chord.displayName);
  await sleep(0.6, signal);
  attack();
  await sleep(0.6, signal);
  handle.clearEnemies();
}

/**
 * onboarding-v1 相当の ii‑V‑I 台本（iOS OnboardingScript 準拠）。
 */
export async function runTutorialIiViScript(params: RunTutorialIiViScriptParams): Promise<void> {
  const {
    isEnglishCopy,
    ui,
    handle,
    audio,
    waitForMidiNoteOrTimeout,
    waitForFirstInputNote,
    waitForSlotBCompletion,
    onFinish,
    signal,
  } = params;

  const isJa = !isEnglishCopy;

  audio.playAudio('main_bgm', { loop: true });

  ui.setNarrationText('');
  handle.setOverrides(scene1Base());
  handle.setSlotAEnabled(false);
  handle.setSlotBEnabled(true);

  ui.setCharacterText(
    isJa
      ? 'ジャズって難しそう？\nコードを覚えるのが難しい？'
      : 'Jazz looks hard?\nChords feel hard to memorize?',
  );
  await sleep(2, signal);
  ui.setCharacterText(
    isJa
      ? 'コードを弾くと、ワザが出る。遊んでいるうちに、ジャズの形が身につく。'
      : 'Play a chord to unleash a move. As you play, jazz starts to stick.',
  );
  await sleep(2, signal);
  ui.setCharacterText(
    isJa ? 'これがこのアプリの基本です。' : "That's the foundation of this app.",
  );
  await sleep(2.2, signal);
  ui.setCharacterText('');

  await playSceneOneChord(
    handle,
    TUTORIAL_DM7,
    () => {
      handle.spawnEnemyInFront(88);
    },
    () => {
      handle.emitAttackOnly('A');
    },
    signal,
  );
  await playSceneOneChord(
    handle,
    TUTORIAL_G7,
    () => {
      handle.spawnEnemyInFront(88);
    },
    () => {
      handle.emitAttackOnly('A');
    },
    signal,
  );
  await playSceneOneChord(
    handle,
    TUTORIAL_CM7,
    () => {
      handle.spawnStationaryRing(12, 180);
    },
    () => {
      handle.emitSpecialShockwave();
    },
    signal,
  );

  await sleep(1.2, signal);

  ui.setNarrationText('');
  ui.setCharacterText(isJa ? 'キーボードを用意しよう。' : "Let's get your keyboard ready.");
  handle.setOverrides(scene2Base());
  handle.setSlotBChord(null);
  handle.setSlotBEnabled(false);
  await sleep(2, signal);
  ui.setNarrationText(
    isJa
      ? 'MIDIキーボードを持っている人は接続してください。\nまだ持っていない人も大丈夫。画面鍵盤でそのまま試せます。'
      : 'If you have a MIDI keyboard, connect it.\nNo keyboard yet? You can try with the on-screen one.',
  );

  const hadDeviceInitially = await hasWebMidiInputDeviceInitially();
  const midiIn5s = await waitForMidiNoteOrTimeout(5);
  if (midiIn5s || hadDeviceInitially) {
    ui.setNarrationText(isJa ? '接続できました' : 'Connected');
    await sleep(0.6, signal);
    ui.setNarrationText(isJa ? '鍵盤を1つ弾いてください' : 'Play one key on your keyboard.');
    ui.setCharacterText(isJa ? '1音弾いてみよう。' : 'Try playing one note.');
    handle.applyMutation((o) => {
      o.blockMidiGameInput = false;
      o.blockChordPadInput = true;
    });
  } else {
    ui.setNarrationText(isJa ? '画面鍵盤で試しましょう' : "Let's use the on-screen keyboard.");
    await sleep(2, signal);
    ui.setNarrationText(
      isJa
        ? 'まずは音を鳴らすところから。外部キーボードはあとで接続できます。'
        : 'Start by making sound. You can plug in a keyboard later.',
    );
    ui.setCharacterText(isJa ? '1音弾いてみよう。' : 'Try playing one note.');
    handle.applyMutation((o) => {
      o.blockChordPadInput = false;
      o.blockMidiGameInput = true;
    });
  }

  await waitForFirstInputNote();
  handle.emitAttackOnly('A');
  await sleep(1.2, signal);
  ui.setConnectedDeviceLine(null);

  ui.setNarrationText('');
  ui.setCharacterText('');
  handle.setOverrides(scene3Base());
  handle.setSlotAEnabled(false);
  handle.setSlotBEnabled(true);
  handle.applyMutation((o) => {
    o.bChordCompletionAttackSlot = null;
    o.bChordCompletionUseSpecial = false;
  });

  const runChordFight = async (
    chord: ChordDefinition,
    attackSlot: 'A' | 'B' | null,
    useSpecial: boolean,
    spawn: () => void,
    assist: () => void,
  ): Promise<boolean> => {
    handle.clearEnemies();
    handle.setSlotBEnabled(true);
    handle.applyMutation((o) => {
      o.hideStaff = true;
      o.blockSlotEvaluation = false;
      o.useChordMidiNotesForHintHighlights = true;
      o.staffMode = 'progression';
    });
    handle.setSlotBChord(chord);
    handle.applyMutation((o) => {
      o.bChordCompletionAttackSlot = attackSlot;
      o.bChordCompletionUseSpecial = useSpecial;
      o.hideStaff = false;
    });
    spawn();
    const startPulse = handle.getSlotBCompletionPulse();
    const completed = await waitForSlotBCompletion(startPulse, 5);
    if (completed) {
      handle.setSlotBEnabled(false);
      handle.setSlotBChord(chord);
      handle.applyMutation((o) => {
        o.blockSlotEvaluation = true;
        o.hideStaff = false;
        o.useChordMidiNotesForHintHighlights = false;
        o.bChordCompletionAttackSlot = null;
        o.bChordCompletionUseSpecial = false;
      });
      await sleep(0.9, signal);
    } else {
      handle.applyMutation((o) => {
        o.hideStaff = true;
      });
      const midis = chord.notes;
      handle.playChordAudio(midis);
      handle.emitChordNameText(chord.displayName);
      assist();
    }
    handle.applyMutation((o) => {
      o.hideStaff = true;
    });
    handle.setSlotBChord(null);
    handle.setSlotBEnabled(true);
    handle.applyMutation((o) => {
      o.blockSlotEvaluation = false;
      o.useChordMidiNotesForHintHighlights = true;
    });
    await sleep(0.35, signal);
    return completed;
  };

  ui.setCharacterText(
    isJa ? 'まずはDm7。下からCとF、2音だけ。' : 'First, Dm7. Just C and F from the bottom.',
  );
  await sleep(0.8, signal);
  const dm7Ok = await runChordFight(
    TUTORIAL_SCENE3_DM7,
    'B',
    false,
    () => {
      handle.spawnEnemyInFront(80);
    },
    () => {
      handle.emitAttackOnly('B');
    },
  );
  ui.setCharacterText(
    dm7Ok
      ? (isJa ? 'OK。' : 'Nice.')
      : (isJa ? '大丈夫、次でもう一回。' : 'No worries. Once more.'),
  );
  await sleep(dm7Ok ? 0.8 : 1.4, signal);
  ui.setCharacterText('');
  await sleep(0.35, signal);

  ui.setCharacterText(isJa ? '次はG7。下からBとF。' : 'Next, G7. B and F from the bottom.');
  await sleep(0.8, signal);
  const g7Ok = await runChordFight(
    TUTORIAL_SCENE3_G7,
    'A',
    false,
    () => {
      handle.spawnTutorialPerpendicularOffsets(95, ONBOARDING_G7_PERP_OFFSETS_PX);
    },
    () => {
      handle.emitAttackOnly('A');
    },
  );
  ui.setCharacterText(
    g7Ok
      ? (isJa ? 'いいね、ジャズになってきた' : "Nice. That's starting to sound like jazz.")
      : (isJa ? '大丈夫、次でもう一回。' : 'No worries. Once more.'),
  );
  await sleep(g7Ok ? 1.8 : 1.4, signal);
  ui.setCharacterText('');
  await sleep(0.35, signal);

  ui.setCharacterText(
    isJa ? '最後はCM7。下からBとEで着地しよう。' : 'Last, CM7. Land on B and E from the bottom.',
  );
  await sleep(0.8, signal);
  await runChordFight(
    TUTORIAL_SCENE3_CM7,
    null,
    true,
    () => {
      handle.spawnStationaryRing(12, 190);
    },
    () => {
      handle.emitSpecialShockwave();
    },
  );
  ui.setCharacterText('');
  await sleep(0.4, signal);

  handle.clearEnemies();
  handle.setSlotBChord(null);
  handle.setSlotBEnabled(false);
  handle.setSlotAEnabled(false);
  handle.applyMutation((o) => {
    o.hideChordSlots = true;
    o.hideStaff = true;
    o.scenarioStaffClef = 1;
    o.hideStaffOnBSlotCompletion = false;
    o.useChordMidiNotesForHintHighlights = false;
    o.blockSlotEvaluation = true;
    o.staffMode = 'hidden';
  });

  ui.setCharacterText(
    isJa ? '今の3つは、ジャズでよく出る進行。' : 'Those three show up all the time in jazz.',
  );
  await sleep(2, signal);
  ui.setCharacterText(isJa ? '“II-V-I（ツーファイブワン）”。' : '"Two-Five-One" (II-V-I).');
  await sleep(2, signal);
  ui.setCharacterText(
    isJa
      ? '理屈はあとで追いつく。\nまずは、指で覚えよう。'
      : 'Theory will catch up later.\nFirst, let your fingers learn it.',
  );
  await sleep(2.2, signal);

  handle.setOverrides(scene5Base());
  ui.setCharacterText(
    isJa
      ? 'ここから少しずつ、できることが増えていくよ。'
      : "From here, you'll slowly unlock more and more.",
  );
  await sleep(2, signal);
  ui.setCharacterText('');

  const showPillar = async (caption: string, systemImage: string) => {
    ui.setPillarCaption(caption);
    ui.setPillarSystemImage(systemImage);
    ui.setShowPillarCard(true);
    await sleep(2, signal);
    ui.setShowPillarCard(false);
    ui.setPillarCaption(null);
    ui.setPillarSystemImage(null);
  };

  await showPillar(
    isJa ? '使えるコードが増える。' : "You'll grow your usable chords.",
    'music.note.list',
  );
  await showPillar(
    isJa ? 'リズムに乗れる。' : "You'll ride the rhythm.",
    'metronome',
  );
  await showPillar(
    isJa ? '自分のフレーズで返せる。' : "You'll answer with your own phrases.",
    'waveform',
  );

  ui.setCharacterText(
    isJa
      ? '僕はファイ、君と一緒に冒険できることを楽しみにしているよ'
      : "I'm Fai, and I can't wait to go on this adventure with you.",
  );
  await sleep(2.5, signal);
  ui.setShowCta(true);
  await sleep(5, signal);

  audio.stopAllAudio();
  if (!signal.aborted) {
    onFinish();
  }
}
