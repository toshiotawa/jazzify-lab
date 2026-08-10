import {
  applyDemoChordSourceToStage,
  applyDemoConfigToStage,
  buildCodeRunDemoLpUrl,
  CODE_RUN_DEMOS,
  resolveCodeRunDemo,
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
  it('resolves all four demo ids', () => {
    expect(resolveCodeRunDemo('demo_1')?.chordSource.kind).toBe('random');
    expect(resolveCodeRunDemo('demo_2')?.lpLocale).toBe('en');
    expect(resolveCodeRunDemo('demo_3')?.chordSource.kind).toBe('progression');
    expect(resolveCodeRunDemo('demo_4')?.lpLocale).toBe('en');
    expect(resolveCodeRunDemo('unknown')).toBeNull();
    expect(resolveCodeRunDemo(null)).toBeNull();
  });

  it('demo_1 uses C-G single notes with hint and ja LP', () => {
    const demo = CODE_RUN_DEMOS.demo_1;
    expect(demo.hintMode).toBe(true);
    expect(demo.lpLocale).toBe('ja');
    expect(demo.chordSource).toEqual({
      kind: 'random',
      allowedChords: ['C_note', 'D_note', 'E_note', 'F_note', 'G_note'],
    });
    expect(demo.runDialogueScript?.lines[0]?.text).toContain('音を弾く');
    expect(demo.runDialogueScript?.lines[0]?.text).toContain('2段ジャンプ');
    expect(demo.runDialogueScript?.lines.every((line) => line.speaker === 'fai')).toBe(true);
  });


  it('demo_3 uses II-V-I progression with voicings', () => {
    const demo = CODE_RUN_DEMOS.demo_3;
    expect(demo.hintMode).toBe(true);
    expect(demo.lpLocale).toBe('ja');
    if (demo.chordSource.kind !== 'progression') {
      throw new Error('expected progression');
    }
    expect(demo.chordSource.progression).toEqual([
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
    expect(demo.runDialogueScript?.lines[0]?.text).toContain('コードを弾く');
    expect(demo.runDialogueScript?.lines[0]?.text).toContain('2段ジャンプ');
    expect(demo.runDialogueScript?.lines.every((line) => line.speaker === 'fai')).toBe(true);
  });


  it('builds LP URLs with locale and UTM', () => {
    const jaUrl = buildCodeRunDemoLpUrl(CODE_RUN_DEMOS.demo_1);
    expect(jaUrl).toContain('https://jazzify.jp/');
    expect(jaUrl).toContain('utm_campaign=code_run_demo_single_notes_ja');

    const enUrl = buildCodeRunDemoLpUrl(CODE_RUN_DEMOS.demo_2);
    expect(enUrl).toContain('https://en.jazzify.jp/');
    expect(enUrl).toContain('utm_campaign=code_run_demo_single_notes_en');
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

  it('applyDemoConfigToStage applies chord source and dialogue script', () => {
    const next = applyDemoConfigToStage(baseStage(), CODE_RUN_DEMOS.demo_1);
    expect(next.allowedChords).toEqual(['C_note', 'D_note', 'E_note', 'F_note', 'G_note']);
    expect(next.runDialogueScript?.lines).toHaveLength(3);
    expect(next.runDialogueScript?.lines[0]?.speaker).toBe('fai');
  });
});
