import { describe, expect, it } from 'vitest';

import { buildOnboardingV1Script } from '@/components/survival/tutorial/buildOnboardingV1Script';
import { mergeTutorialScenarioOverrides } from '@/components/survival/tutorial/interpretTutorialScript';
import { buildTutorialStageDefinition, resolveTutorialChordRef } from '@/components/survival/tutorial/buildTutorialStageDefinition';
import { isTutorialScriptPayload } from '@/components/survival/tutorial/tutorialScriptTypes';
import {
  isInterpretedTutorialScript,
  type SurvivalTutorialLegacyPayload,
} from '@/components/survival/tutorial/fetchSurvivalTutorialScript';
import {
  resolveLegacyTutorialRunnerKey,
  resolveSurvivalBuiltinTutorialRunner,
} from '@/components/survival/tutorial/tutorialRunnerRegistry';

describe('buildOnboardingV1Script', () => {
  it('produces valid v2 payload with steps and stage', () => {
    const script = buildOnboardingV1Script();
    expect(isTutorialScriptPayload(script)).toBe(true);
    expect(script.steps.length).toBeGreaterThan(20);
    expect(script.stage?.chordProgression).toHaveLength(3);
    expect(script.chords?.scene3_dm7.voicing).toEqual([60, 65]);
  });

  it('builds stage definition from script stage block', () => {
    const script = buildOnboardingV1Script();
    const stage = buildTutorialStageDefinition(script);
    expect(stage.chordDisplayName).toBe('ii-V-I');
    expect(stage.chordProgression).toHaveLength(3);
  });

  it('resolves chord refs', () => {
    const script = buildOnboardingV1Script();
    const chord = resolveTutorialChordRef(script, 'scene3_g7');
    expect(chord.displayName).toBe('G7');
    expect(chord.notes).toEqual([59, 65]);
  });
});

describe('fetchSurvivalTutorialScript helpers', () => {
  it('detects interpreted v2 scripts', () => {
    const script = buildOnboardingV1Script();
    expect(isInterpretedTutorialScript(script)).toBe(true);
  });

  it('does not treat legacy v1 as interpreted', () => {
    const legacy: SurvivalTutorialLegacyPayload = {
      version: 1,
      builtinRunner: 'onboarding-v1',
    };
    expect(isInterpretedTutorialScript(legacy)).toBe(false);
  });
});

describe('mergeTutorialScenarioOverrides', () => {
  it('scene2 shows chord pad (bundled preset wins over script JSON)', () => {
    const script = buildOnboardingV1Script();
    const scriptWithStaleDbPreset = {
      ...script,
      overridePresets: {
        scene2: { hideChordPad: true },
      },
    };
    const merged = mergeTutorialScenarioOverrides(scriptWithStaleDbPreset, 'scene2');
    expect(merged.hideChordPad).toBe(false);
    expect(merged.isActive).toBe(true);
  });

  it('scene1 hides chord pad', () => {
    const script = buildOnboardingV1Script();
    const merged = mergeTutorialScenarioOverrides(script, 'scene1');
    expect(merged.hideChordPad).toBe(true);
  });
});

describe('tutorialRunnerRegistry', () => {
  it('resolves onboarding-v1 and interpreted-v1 runners', () => {
    expect(resolveSurvivalBuiltinTutorialRunner('onboarding-v1')).toBeTypeOf('function');
    expect(resolveSurvivalBuiltinTutorialRunner('interpreted-v1')).toBeTypeOf('function');
  });

  it('resolves legacy runner key from payload', () => {
    expect(
      resolveLegacyTutorialRunnerKey({ version: 1, builtinRunner: 'onboarding-v1' }, 'foo'),
    ).toBe('onboarding-v1');
    expect(resolveLegacyTutorialRunnerKey({ version: 1 }, 'custom-id')).toBe('custom-id');
  });
});
