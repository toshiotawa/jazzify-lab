import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import {
  DEFAULT_SURVIVAL_TUTORIAL_DRUM_LOOP_VOLUME,
  resolveSurvivalTutorialDemoPlayAudio,
  shouldMuteTutorialV3Bgm,
} from '@/components/survival/tutorial/resolveSurvivalTutorialDemoPlayAudioUrl';

const demoScene = {
  type: 'demo_play' as const,
  bpm: 100,
  chords: [],
  lines: [],
  audio: {
    url_ja: 'https://cdn.example/ja.mp3',
    url_en: 'https://cdn.example/en.mp3',
    volume: 0.28,
  },
};

const scriptWithDrumFallback: SurvivalTutorialScriptPayloadV3 = {
  version: 3,
  ui: {
    hidePlayerHpBar: true,
    hideSettingsButton: true,
    hideBackButton: true,
    playerInvincible: true,
    disableEnemyAttacks: true,
    keyboardHintsDefault: true,
  },
  content: {},
  scenes: [demoScene],
  audioTracks: {
    drum_loop: { url: 'https://cdn.example/fallback.mp3', volume: 0.5 },
  },
};

describe('resolveSurvivalTutorialDemoPlayAudio', () => {
  it('prefers url_ja for Japanese UI', () => {
    const resolved = resolveSurvivalTutorialDemoPlayAudio(
      demoScene,
      scriptWithDrumFallback,
      false,
    );
    expect(resolved.url).toBe('https://cdn.example/ja.mp3');
    expect(resolved.volume).toBe(0.28);
  });

  it('prefers url_en for English UI', () => {
    const resolved = resolveSurvivalTutorialDemoPlayAudio(
      demoScene,
      scriptWithDrumFallback,
      true,
    );
    expect(resolved.url).toBe('https://cdn.example/en.mp3');
  });

  it('falls back to audio.url then script drum_loop', () => {
    const sceneWithGenericUrl = {
      ...demoScene,
      audio: { url: 'https://cdn.example/generic.mp3' },
    };
    expect(
      resolveSurvivalTutorialDemoPlayAudio(sceneWithGenericUrl, scriptWithDrumFallback, true).url,
    ).toBe('https://cdn.example/generic.mp3');

    const sceneWithoutLocale = {
      ...demoScene,
      audio: undefined,
    };
    expect(
      resolveSurvivalTutorialDemoPlayAudio(sceneWithoutLocale, scriptWithDrumFallback, true).url,
    ).toBe('https://cdn.example/fallback.mp3');
  });

  it('uses drum_loop volume when scene audio has no volume', () => {
    const sceneWithoutVolume = {
      ...demoScene,
      audio: { url_ja: 'https://cdn.example/ja.mp3' },
    };
    const resolved = resolveSurvivalTutorialDemoPlayAudio(
      sceneWithoutVolume,
      scriptWithDrumFallback,
      false,
    );
    expect(resolved.volume).toBe(0.5);
  });

  it('uses default volume when nothing is set', () => {
    const resolved = resolveSurvivalTutorialDemoPlayAudio(
      { ...demoScene, audio: { url_ja: 'https://cdn.example/ja.mp3' } },
      { ...scriptWithDrumFallback, audioTracks: undefined },
      false,
    );
    expect(resolved.volume).toBe(DEFAULT_SURVIVAL_TUTORIAL_DRUM_LOOP_VOLUME);
  });
});

describe('shouldMuteTutorialV3Bgm', () => {
  it('mutes demo_play, phrase_battle, and finish', () => {
    expect(shouldMuteTutorialV3Bgm({ type: 'demo_play', bpm: 100, chords: [], lines: [] })).toBe(true);
    expect(
      shouldMuteTutorialV3Bgm({
        type: 'phrase_battle',
        contentRef: 'x',
        requiredLoops: 1,
        dialogue: {
          intro: { ja: '', en: '' },
          onReveal: { ja: '', en: '' },
          onCorrectRemaining: { ja: '', en: '' },
        },
      }),
    ).toBe(true);
    expect(shouldMuteTutorialV3Bgm({ type: 'finish' })).toBe(true);
  });

  it('does not mute dialogue_only', () => {
    expect(shouldMuteTutorialV3Bgm({ type: 'dialogue_only', lines: [] })).toBe(false);
  });
});
