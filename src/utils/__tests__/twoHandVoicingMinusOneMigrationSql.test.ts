import {
  generateTwoHandVoicingMinusOneMigrationSql,
} from '@/utils/twoHandVoicingMinusOneMigrationSql';

describe('twoHandVoicingMinusOneMigrationSql', () => {
  it('60 件の audio_url UPDATE を生成する', () => {
    const sql = generateTwoHandVoicingMinusOneMigrationSql();
    expect(sql).toContain('UPDATE public.ear_training_phrases p');
    expect(sql).toContain('thvi-b3-voicing-b3-m7-p1');
    expect(sql).toContain('thvi-voicing-b1-q1');
    expect(sql).toContain('thva-voicing-b1-minm7-p1');
    expect(sql).toContain('thvi-b3-voicing-b3-m7-p1-minus-one.mp3');
    expect(sql).toContain('thvi-voicing-b1-q1-ph0-minus-one.mp3');
    expect(sql).toContain('thva-voicing-b1-majM7-p1-minus-one.mp3');
    expect((sql.match(/UPDATE public\.ear_training_phrases p/g) ?? []).length).toBe(60);
    expect(sql).not.toContain('ear_training_phrase_chords');
  });
});
