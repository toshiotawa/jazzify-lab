import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import {
  DEFAULT_SURVIVAL_TUTORIAL_DRUM_LOOP_VOLUME,
  resolveSurvivalTutorialDemoPlayAudio,
  resolveTutorialV3BgmAction,
  resolveTutorialV3SceneBgmUrl,
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

describe('resolveTutorialV3SceneBgmUrl', () => {
  it('scene URL を優先し、未指定なら共有 URL へフォールバックする', () => {
    expect(
      resolveTutorialV3SceneBgmUrl(
        { type: 'dialogue_only', lines: [], bgm: { url: ' scene.mp3 ' } },
        'fallback.mp3',
      ),
    ).toBe('scene.mp3');
    expect(
      resolveTutorialV3SceneBgmUrl({ type: 'dialogue_only', lines: [] }, 'fallback.mp3'),
    ).toBe('fallback.mp3');
  });

  it('finish は BGM なし', () => {
    expect(resolveTutorialV3SceneBgmUrl({ type: 'finish' }, 'fallback.mp3')).toBeNull();
  });
});

describe('resolveTutorialV3BgmAction', () => {
  const playing = { currentUrl: 'same.mp3', isPlaying: true };

  it('URL なしと finish は stop', () => {
    expect(
      resolveTutorialV3BgmAction({ type: 'dialogue_only', lines: [] }, null, playing),
    ).toBe('stop');
    expect(resolveTutorialV3BgmAction({ type: 'finish' }, 'same.mp3', playing)).toBe('stop');
  });

  it('同一 URL が再生中なら keep(位置維持)', () => {
    expect(
      resolveTutorialV3BgmAction(
        { type: 'dialogue_only', lines: [], bgm: { url: 'same.mp3' } },
        'same.mp3',
        playing,
      ),
    ).toBe('keep');
  });

  it('resetOnEnter、URL 変更、停止中は restart', () => {
    expect(
      resolveTutorialV3BgmAction(
        { type: 'demo_play', bpm: 100, chords: [], lines: [], bgm: { resetOnEnter: true } },
        'same.mp3',
        playing,
      ),
    ).toBe('restart');
    expect(
      resolveTutorialV3BgmAction(
        { type: 'dialogue_only', lines: [] },
        'next.mp3',
        playing,
      ),
    ).toBe('restart');
    expect(
      resolveTutorialV3BgmAction(
        { type: 'dialogue_only', lines: [] },
        'same.mp3',
        { currentUrl: 'same.mp3', isPlaying: false },
      ),
    ).toBe('restart');
  });
});
