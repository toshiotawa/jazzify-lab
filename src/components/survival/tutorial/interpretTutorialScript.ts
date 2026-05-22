import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import {
  TUTORIAL_BOOTSTRAP_OVERRIDES,
  type SurvivalScenarioOverrides,
} from '@/components/survival/scenario/survivalScenarioTypes';
import { TutorialAudioController } from './TutorialAudioController';
import { resolveTutorialOverridePreset } from './tutorialScriptPresets';
import { resolveTutorialChordRef } from './buildTutorialStageDefinition';
import type {
  TutorialAttackStep,
  TutorialLocalizedText,
  TutorialScriptPayload,
  TutorialScriptStep,
  TutorialSpawnStep,
} from './tutorialScriptTypes';
import type { TutorialRunnerUi } from './tutorialIiViScript';
import { hasWebMidiInputDeviceInitially } from './tutorialMidiSetup';

export interface RunInterpretedTutorialScriptParams {
  script: TutorialScriptPayload;
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

function localized(text: TutorialLocalizedText, isEnglishCopy: boolean): string {
  return isEnglishCopy ? text.en : text.ja;
}

/** iOS `TutorialScriptPresets.resolve` と同様、バンドル preset を DB JSON より優先する。 */
export function mergeTutorialScenarioOverrides(
  script: TutorialScriptPayload,
  preset?: string,
  patch?: Partial<SurvivalScenarioOverrides>,
): SurvivalScenarioOverrides {
  const bundled = preset ? resolveTutorialOverridePreset(preset) : undefined;
  const fromScript = preset ? script.overridePresets?.[preset] : undefined;
  const base = bundled ?? fromScript ?? TUTORIAL_BOOTSTRAP_OVERRIDES;
  const current = { ...TUTORIAL_BOOTSTRAP_OVERRIDES, ...base, ...(patch ?? {}) };
  return { ...current, isActive: true };
}

function runSpawn(handle: SurvivalScenarioHandle, spawn: TutorialSpawnStep): void {
  switch (spawn.kind) {
    case 'front':
      handle.spawnEnemyInFront(spawn.distance);
      break;
    case 'ring':
      handle.spawnStationaryRing(spawn.count, spawn.radius);
      break;
    case 'perpOffsets':
      handle.spawnTutorialPerpendicularOffsets(spawn.distanceForward, spawn.offsets);
      break;
    case 'at':
      handle.spawnStationaryAt(spawn.x, spawn.y);
      break;
    default: {
      const _exhaustive: never = spawn;
      void _exhaustive;
    }
  }
}

function runAttack(handle: SurvivalScenarioHandle, attack: TutorialAttackStep): void {
  if ('special' in attack && attack.special) {
    handle.emitSpecialShockwave();
    return;
  }
  if ('slot' in attack) {
    handle.emitAttackOnly(attack.slot);
  }
}

function applyCompletionAttack(
  handle: SurvivalScenarioHandle,
  attack: TutorialAttackStep | null | undefined,
  useSpecial: boolean,
): void {
  if (useSpecial) {
    handle.applyMutation((o) => {
      o.bChordCompletionAttackSlot = null;
      o.bChordCompletionUseSpecial = true;
    });
    return;
  }
  const slot = attack && 'slot' in attack ? attack.slot : null;
  handle.applyMutation((o) => {
    o.bChordCompletionAttackSlot = slot;
    o.bChordCompletionUseSpecial = false;
  });
}

async function playDemoOneChord(
  handle: SurvivalScenarioHandle,
  chord: ChordDefinition,
  spawn: TutorialSpawnStep,
  attack: TutorialAttackStep,
  signal: AbortSignal,
): Promise<void> {
  handle.clearEnemies();
  handle.setSlotBChord(chord);
  await sleep(0.35, signal);
  runSpawn(handle, spawn);
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
  runAttack(handle, attack);
  await sleep(0.6, signal);
  handle.clearEnemies();
}

async function runChordFightStep(
  params: RunInterpretedTutorialScriptParams,
  step: Extract<TutorialScriptStep, { type: 'chordFight' }>,
): Promise<void> {
  const { script, isEnglishCopy, ui, handle, waitForSlotBCompletion, signal } = params;
  const chord = resolveTutorialChordRef(script, step.chord);
  const timeoutSeconds = step.timeoutSeconds ?? 5;

  if (step.introCharacter) {
    ui.setCharacterText(step.introCharacter);
    await sleep(step.introDelaySeconds ?? 0.8, signal);
  }

  handle.clearEnemies();
  handle.setSlotBEnabled(true);
  handle.applyMutation((o) => {
    o.hideStaff = true;
    o.blockSlotEvaluation = false;
    o.useChordMidiNotesForHintHighlights = true;
    o.staffMode = 'progression';
  });
  handle.setSlotBChord(chord);
  applyCompletionAttack(handle, step.completionAttack, step.useSpecial === true);
  handle.applyMutation((o) => {
    o.hideStaff = false;
  });
  runSpawn(handle, step.spawn);

  const startPulse = handle.getSlotBCompletionPulse();
  const completed = await waitForSlotBCompletion(startPulse, timeoutSeconds);

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
    if (step.successCharacter) {
      ui.setCharacterText(step.successCharacter);
      await sleep(step.successDelaySeconds ?? 0.8, signal);
    }
  } else {
    handle.applyMutation((o) => {
      o.hideStaff = true;
    });
    handle.playChordAudio(chord.notes);
    handle.emitChordNameText(chord.displayName);
    runAttack(handle, step.assistAttack);
    if (step.failCharacter) {
      ui.setCharacterText(step.failCharacter);
      await sleep(step.failDelaySeconds ?? 1.4, signal);
    }
  }

  handle.applyMutation((o) => {
    o.hideStaff = true;
  });
  handle.setSlotBChord(null);
  handle.setSlotBEnabled(true);
  handle.applyMutation((o) => {
    o.blockSlotEvaluation = false;
    o.useChordMidiNotesForHintHighlights = true;
    o.bChordCompletionAttackSlot = null;
    o.bChordCompletionUseSpecial = false;
  });
  ui.setCharacterText('');
  await sleep(0.35, signal);
}

async function runKeyboardSetup(
  params: RunInterpretedTutorialScriptParams,
  midiWaitSeconds: number,
): Promise<void> {
  const { isEnglishCopy, ui, handle, waitForMidiNoteOrTimeout, waitForFirstInputNote, signal } =
    params;

  handle.applyMutation((o) => {
    o.hideChordPad = false;
  });

  const { releaseTutorialPianoAudio } = await import('./tutorialAudioUnlock');
  releaseTutorialPianoAudio();

  const hadDeviceInitially = await hasWebMidiInputDeviceInitially();
  const midiIn5s = await waitForMidiNoteOrTimeout(midiWaitSeconds);
  if (midiIn5s || hadDeviceInitially) {
    ui.setNarrationText(isEnglishCopy ? 'Connected' : '接続できました');
    await sleep(0.6, signal);
    ui.setNarrationText(
      isEnglishCopy ? 'Play one key on your keyboard.' : '鍵盤を1つ弾いてください',
    );
    ui.setCharacterText({ ja: '1音弾いてみよう。', en: 'Try playing one note.' });
    handle.applyMutation((o) => {
      o.blockMidiGameInput = false;
      o.blockChordPadInput = true;
    });
  } else {
    ui.setNarrationText(
      isEnglishCopy ? "Let's use the on-screen keyboard." : '画面鍵盤で試しましょう',
    );
    await sleep(2, signal);
    ui.setNarrationText(
      isEnglishCopy
        ? 'Start by making sound. You can plug in a keyboard later.'
        : 'まずは音を鳴らすところから。外部キーボードはあとで接続できます。',
    );
    ui.setCharacterText({ ja: '1音弾いてみよう。', en: 'Try playing one note.' });
    handle.applyMutation((o) => {
      o.blockChordPadInput = false;
      o.blockMidiGameInput = true;
    });
  }

  await waitForFirstInputNote();
  handle.emitAttackOnly('A');
  await sleep(1.2, signal);
  ui.setNarrationText('');
  ui.setCharacterText('');
}

async function runStep(
  params: RunInterpretedTutorialScriptParams,
  step: TutorialScriptStep,
): Promise<'continue' | 'finish'> {
  const { script, isEnglishCopy, ui, handle, audio, signal } = params;

  switch (step.type) {
    case 'delay':
      await sleep(step.seconds, signal);
      return 'continue';
    case 'character':
      ui.setCharacterText(step.text);
      return 'continue';
    case 'narration':
      if (step.clear) {
        ui.setNarrationText('');
      } else if (step.text) {
        ui.setNarrationText(localized(step.text, isEnglishCopy));
      }
      return 'continue';
    case 'connectedDevice':
      if (step.text) {
        ui.setConnectedDeviceLine(localized(step.text, isEnglishCopy));
      } else {
        ui.setConnectedDeviceLine(null);
      }
      return 'continue';
    case 'overrides': {
      const merged = mergeTutorialScenarioOverrides(script, step.preset, step.patch);
      handle.setOverrides(merged);
      return 'continue';
    }
    case 'slot':
      if (step.aEnabled !== undefined) handle.setSlotAEnabled(step.aEnabled);
      if (step.bEnabled !== undefined) handle.setSlotBEnabled(step.bEnabled);
      if (step.clearBChord) {
        handle.setSlotBChord(null);
      } else if (step.bChord !== undefined) {
        handle.setSlotBChord(resolveTutorialChordRef(script, step.bChord));
      }
      if (step.resetBCompletion) {
        handle.applyMutation((o) => {
          o.bChordCompletionAttackSlot = null;
          o.bChordCompletionUseSpecial = false;
        });
      }
      return 'continue';
    case 'clearEnemies':
      handle.clearEnemies();
      return 'continue';
    case 'spawn':
      runSpawn(handle, step.spawn);
      return 'continue';
    case 'demoOneChord':
      await playDemoOneChord(
        handle,
        resolveTutorialChordRef(script, step.chord),
        step.spawn,
        step.attack,
        signal,
      );
      return 'continue';
    case 'chordFight':
      await runChordFightStep(params, step);
      return 'continue';
    case 'keyboardSetup':
      await runKeyboardSetup(params, step.midiWaitSeconds ?? 5);
      return 'continue';
    case 'waitInput':
      await params.waitForFirstInputNote();
      return 'continue';
    case 'attack':
      runAttack(handle, step.attack);
      return 'continue';
    case 'pillar': {
      ui.setPillarCaption(localized(step.text, isEnglishCopy));
      ui.setPillarSystemImage(step.systemImage);
      ui.setShowPillarCard(true);
      await sleep(step.durationSeconds ?? 2, signal);
      ui.setShowPillarCard(false);
      ui.setPillarCaption(null);
      ui.setPillarSystemImage(null);
      return 'continue';
    }
    case 'showCta':
      ui.setShowCta(step.show);
      return 'continue';
    case 'audio':
      if (step.action === 'play') {
        audio.playAudio(step.trackId, { loop: step.loop, volume: step.volume });
      } else {
        audio.stopAudio(step.trackId);
      }
      return 'continue';
    case 'finish':
      return 'finish';
    default: {
      const _exhaustive: never = step;
      void _exhaustive;
      return 'continue';
    }
  }
}

export async function runInterpretedTutorialScript(
  params: RunInterpretedTutorialScriptParams,
): Promise<void> {
  const { script, signal, onFinish, audio } = params;

  for (const step of script.steps) {
    if (signal.aborted) return;
    const result = await runStep(params, step);
    if (result === 'finish') break;
  }

  audio.stopAllAudio();
  if (!signal.aborted) {
    onFinish();
  }
}
