import { balloonRushScenarioOverrides } from '@/utils/balloonRushSurvivalBridge';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';

const baseStage = (): BalloonRushResolvedStage => ({
  id: 'stage-id',
  slug: 'test',
  title: 'Test',
  titleEn: 'Test',
  description: null,
  descriptionEn: null,
  stageType: 'random',
  chordSuffix: '_note',
  rootPattern: 'all',
  allowedChordIds: [],
  timeLimitSec: 120,
  popQuota: 80,
  balloonLifetimeSec: 10,
  maxConcurrent: 5,
  respawnDelaySec: 2,
  bgmUrl: '',
  keyFifths: 0,
  lessonOnly: true,
  productionStaffHintMode: 'always',
  productionKeyboardHintMode: 'hidden_until_pressed',
  hideChordNamesInBattle: false,
});

describe('balloonRushScenarioOverrides', () => {
  it('譜読み random は staffMode random-staff で譜面表示経路を使う', () => {
    const overrides = balloonRushScenarioOverrides({
      ...baseStage(),
      hideChordNamesInBattle: true,
    });
    expect(overrides.staffMode).toBe('random-staff');
    expect(overrides.useChordMidiNotesForHintHighlights).toBe(true);
  });

  it('通常 random は staffMode hidden のまま', () => {
    const overrides = balloonRushScenarioOverrides(baseStage());
    expect(overrides.staffMode).toBe('hidden');
    expect(overrides.useChordMidiNotesForHintHighlights).toBe(false);
  });

  it('progression は staffMode progression', () => {
    const overrides = balloonRushScenarioOverrides({
      ...baseStage(),
      stageType: 'progression',
    });
    expect(overrides.staffMode).toBe('progression');
  });
});
