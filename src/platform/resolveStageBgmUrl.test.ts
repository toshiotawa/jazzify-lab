import {
  DEFAULT_SURVIVAL_BGM_SETTINGS,
  resolveStageBgmUrl,
} from '@/platform/supabaseSurvival';

describe('resolveStageBgmUrl', () => {
  it('uses phrases drum loop for composite phrase boss (stage 6)', () => {
    const url = resolveStageBgmUrl({
      stageType: 'progression',
      mapCategory: 'phrases',
      compositePhraseSources: [1, 2, 3, 4, 5],
    });
    expect(url).toBe(DEFAULT_SURVIVAL_BGM_SETTINGS.phrases);
  });

  it('uses composite phrase bgm from stage when set', () => {
    const custom = 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';
    const url = resolveStageBgmUrl({
      stageType: 'progression',
      mapCategory: 'phrases',
      compositePhraseSources: [1, 2, 3, 4, 5],
      compositePhraseBgmUrl: custom,
    });
    expect(url).toBe(custom);
  });

  it('uses stage type BGM for basic progression stages', () => {
    const url = resolveStageBgmUrl({
      stageType: 'progression',
      mapCategory: 'basic',
    });
    expect(url).toBe(DEFAULT_SURVIVAL_BGM_SETTINGS.progression);
  });
});
