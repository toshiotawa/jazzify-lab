import {
  applyDemoChordSourceToStage,
  applyDemoConfigToStage,
  buildCodeRunDemoLpUrl,
  CODE_RUN_DEMO_DIFFICULTIES,
  CODE_RUN_DEMOS,
  resolveCodeRunDemo,
  resolveCodeRunDemoDifficulty,
} from '@/embed/codeRunDemoCatalog';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';

const baseStage = (): StageDefinition => ({
  stageNumber: 122,
  name: 'Test',
  nameEn: 'Test',
  difficulty: 'easy',
  stageType: 'random',
  playMode: 'code_run',
  chordSuffix: '',
  chordDisplayName: '',
  chordDisplayNameEn: '',
  rootPattern: 'cde',
  rootPatternName: '',
  rootPatternNameEn: '',
  allowedChords: ['C'],
  blockKey: 'major',
  mapCategory: 'basic',
  grandStaffMode: false,
  runMapId: 'snow_run_01',
});

describe('codeRunDemoCatalog', () => {
  it('resolves all four demo ids with their default difficulty', () => {
    expect(resolveCodeRunDemo('demo_1')?.defaultDifficulty).toBe('easy');
    expect(resolveCodeRunDemo('demo_2')?.lpLocale).toBe('en');
    expect(resolveCodeRunDemo('demo_2')?.defaultDifficulty).toBe('easy');
    expect(resolveCodeRunDemo('demo_3')?.defaultDifficulty).toBe('normal');
    expect(resolveCodeRunDemo('demo_4')?.lpLocale).toBe('en');
    expect(resolveCodeRunDemo('demo_4')?.defaultDifficulty).toBe('normal');
    expect(resolveCodeRunDemo('unknown')).toBeNull();
    expect(resolveCodeRunDemo(null)).toBeNull();
  });

  it('resolves difficulty query values', () => {
    expect(resolveCodeRunDemoDifficulty('easy')).toBe('easy');
    expect(resolveCodeRunDemoDifficulty('normal')).toBe('normal');
    expect(resolveCodeRunDemoDifficulty('hard')).toBeNull();
    expect(resolveCodeRunDemoDifficulty(null)).toBeNull();
  });

  it('easy uses C-G single notes', () => {
    const preset = CODE_RUN_DEMO_DIFFICULTIES.easy;
    expect(preset.chordSource).toEqual({
      kind: 'random',
      allowedChords: ['C_note', 'D_note', 'E_note', 'F_note', 'G_note'],
    });
    expect(preset.runDialogueScript.lines[0]?.text).toContain('音を弾く');
    expect(preset.runDialogueScript.lines[0]?.text).toContain('2段ジャンプ');
    expect(preset.runDialogueScript.lines.every((line) => line.speaker === 'fai')).toBe(true);
  });


  it('normal uses II-V-I progression with voicings', () => {
    const preset = CODE_RUN_DEMO_DIFFICULTIES.normal;
    if (preset.chordSource.kind !== 'progression') {
      throw new Error('expected progression');
    }
    expect(preset.chordSource.progression).toEqual([
      {
        name: 'Dm7(9)',
        voicing: [53, 57, 60, 64],
        voicingNames: ['F3', 'A3', 'C4', 'E4'],
        keyFifths: 0,
      },
      {
        name: 'G7(9.13)',
        voicing: [53, 57, 59, 64],
        voicingNames: ['F3', 'A3', 'B3', 'E4'],
        keyFifths: 0,
      },
      {
        name: 'CM7(9)',
        voicing: [52, 55, 59, 62],
        voicingNames: ['E3', 'G3', 'B3', 'D4'],
        keyFifths: 0,
      },
    ]);
    expect(preset.runDialogueScript.lines[0]?.text).toContain('コードを弾く');
    expect(preset.runDialogueScript.lines[0]?.text).toContain('2段ジャンプ');
    expect(preset.runDialogueScript.lines.every((line) => line.speaker === 'fai')).toBe(true);
  });


  it('builds LP URLs with locale and UTM', () => {
    const jaUrl = buildCodeRunDemoLpUrl(CODE_RUN_DEMOS.demo_1);
    expect(jaUrl).toContain('https://jazzify.jp/');
    expect(jaUrl).toContain('utm_campaign=code_run_demo_single_notes_ja');

    const enUrl = buildCodeRunDemoLpUrl(CODE_RUN_DEMOS.demo_2);
    expect(enUrl).toContain('https://en.jazzify.jp/');
    expect(enUrl).toContain('utm_campaign=code_run_demo_single_notes_en');

    const withFrom = buildCodeRunDemoLpUrl(CODE_RUN_DEMOS.demo_2, { from: 'en_blog' });
    expect(withFrom).toContain('utm_content=en_blog');
  });

  it('applies random chord source', () => {
    const next = applyDemoChordSourceToStage(baseStage(), {
      kind: 'random',
      allowedChords: ['C_note', 'D_note'],
    });
    expect(next.stageType).toBe('random');
    expect(next.allowedChords).toEqual(['C_note', 'D_note']);
    expect(next.chordProgression).toBeUndefined();
  });

  it('applies progression chord source', () => {
    const progression = [{ name: 'Dm7(9)', voicing: [53, 57, 60, 64] }];
    const next = applyDemoChordSourceToStage(baseStage(), {
      kind: 'progression',
      progression,
    });
    expect(next.stageType).toBe('progression');
    expect(next.allowedChords).toEqual([]);
    expect(next.chordProgression).toEqual(progression);
  });

  it('applyDemoConfigToStage applies the selected difficulty preset', () => {
    const easy = applyDemoConfigToStage(baseStage(), 'easy');
    expect(easy.stageType).toBe('random');
    expect(easy.allowedChords).toEqual(['C_note', 'D_note', 'E_note', 'F_note', 'G_note']);
    expect(easy.runDialogueScript?.lines).toHaveLength(3);
    expect(easy.runDialogueScript?.lines[0]?.speaker).toBe('fai');

    const normal = applyDemoConfigToStage(baseStage(), 'normal');
    expect(normal.stageType).toBe('progression');
    expect(normal.chordProgression?.[0]?.name).toBe('Dm7(9)');
    expect(normal.runDialogueScript?.lines[0]?.text).toContain('コードを弾く');
  });
});
