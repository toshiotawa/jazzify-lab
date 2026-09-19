import {
  applyNotationInstrumentToMusicXml,
  clampNotationOctaveShift,
  getNotationInstrumentPreset,
  getWrittenSemitoneOffset,
  isNotationInstrumentId,
  normalizeNotationInstrumentId,
  notationClefStaffNumber,
  resolveNotationFixedActiveStaves,
  transposeKeyFifths,
  transposeWrittenNoteName,
} from '@/utils/notationInstrument';

const MINIMAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

const GRAND_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

describe('notationInstrument', () => {
  it('isNotationInstrumentId でプリセット ID を判定する', () => {
    expect(isNotationInstrumentId('tenor_sax')).toBe(true);
    expect(isNotationInstrumentId('invalid')).toBe(false);
    expect(normalizeNotationInstrumentId('invalid')).toBe('piano');
  });

  it('移調楽器のラベルにキーを付ける', () => {
    expect(getNotationInstrumentPreset('soprano_sax').label.ja).toBe('ソプラノサックス in B♭');
    expect(getNotationInstrumentPreset('alto_sax').label.en).toBe('Alto Sax in E♭');
    expect(getNotationInstrumentPreset('tenor_sax').label.ja).toBe('テナーサックス in B♭');
    expect(getNotationInstrumentPreset('baritone_sax').label.en).toBe('Baritone Sax in E♭');
    expect(getNotationInstrumentPreset('trumpet_bb').label.ja).toContain('in B♭');
    expect(getNotationInstrumentPreset('french_horn_f').label.ja).toContain('in F');
  });

  it('clampNotationOctaveShift は ±3 に制限する', () => {
    expect(clampNotationOctaveShift(3)).toBe(3);
    expect(clampNotationOctaveShift(-3)).toBe(-3);
    expect(clampNotationOctaveShift(4)).toBe(3);
    expect(clampNotationOctaveShift(-4)).toBe(-3);
  });

  it('getWrittenSemitoneOffset が管の移調とオクターブを合成する', () => {
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('piano'), 0)).toBe(0);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('tenor_sax'), 0)).toBe(14);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('alto_sax'), 0)).toBe(9);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('guitar'), 0)).toBe(12);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('electric_bass'), 0)).toBe(12);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('trumpet_bb'), 1)).toBe(14);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('piano'), 2)).toBe(24);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('piano'), 3)).toBe(36);
    expect(getWrittenSemitoneOffset(getNotationInstrumentPreset('piano'), -3)).toBe(-36);
  });

  it('transposeKeyFifths が調号を移す', () => {
    expect(transposeKeyFifths(0, 2)).toBe(2);
    expect(transposeKeyFifths(-1, 2)).toBe(1);
  });

  it('transposeWrittenNoteName が記譜音名を返す', () => {
    expect(transposeWrittenNoteName('C4', 2, 0)).toBe('D4');
    expect(transposeWrittenNoteName('C4', 14, 0)).toBe('D5');
    expect(transposeWrittenNoteName('Bb3', 2, -2)).toBe('C4');
    expect(transposeWrittenNoteName('E4', 9, 0)).toBe('C#5');
    expect(transposeWrittenNoteName('C4', 24, 0)).toBe('C6');
    expect(transposeWrittenNoteName('C4', -24, 0)).toBe('C2');
    expect(transposeWrittenNoteName('C4', 36, 0)).toBe('C7');
    expect(transposeWrittenNoteName('C4', -36, 0)).toBe('C1');
  });

  it('applyNotationInstrumentToMusicXml が Bb 楽器向けに移調する', () => {
    const preset = getNotationInstrumentPreset('trumpet_bb');
    const result = applyNotationInstrumentToMusicXml(MINIMAL_XML, preset, 0);
    expect(result).toContain('<step>D</step>');
    expect(result).toContain('<fifths>2</fifths>');
    expect(result).toContain('<sign>G</sign>');
  });

  it('applyNotationInstrumentToMusicXml が bass clef 楽器で音部記号を書き換える', () => {
    const preset = getNotationInstrumentPreset('trombone');
    const result = applyNotationInstrumentToMusicXml(MINIMAL_XML, preset, 0);
    expect(result).toContain('<sign>F</sign>');
    expect(result).toContain('<line>4</line>');
  });

  it('piano は grand のまま early return する', () => {
    const preset = getNotationInstrumentPreset('piano');
    const result = applyNotationInstrumentToMusicXml(GRAND_XML, preset, 0);
    expect(result).toBe(GRAND_XML);
  });

  it('piano の記譜オクターブ ±2 / ±3 で MusicXML のオクターブが動く', () => {
    const preset = getNotationInstrumentPreset('piano');
    const upTwo = applyNotationInstrumentToMusicXml(MINIMAL_XML, preset, 2);
    const downTwo = applyNotationInstrumentToMusicXml(MINIMAL_XML, preset, -2);
    const upThree = applyNotationInstrumentToMusicXml(MINIMAL_XML, preset, 3);
    expect(upTwo).toContain('<octave>6</octave>');
    expect(downTwo).toContain('<octave>2</octave>');
    expect(upThree).toContain('<octave>7</octave>');
    expect(upTwo).not.toContain('<octave>4</octave>');
  });

  it('notationClefStaffNumber maps single-staff clefs', () => {
    expect(notationClefStaffNumber('treble')).toBe(1);
    expect(notationClefStaffNumber('bass')).toBe(2);
    expect(notationClefStaffNumber('grand')).toBeNull();
  });

  it('resolveNotationFixedActiveStaves prefers bass/treble over fallback', () => {
    expect(resolveNotationFixedActiveStaves('bass', [1])).toEqual([2]);
    expect(resolveNotationFixedActiveStaves('treble', [1, 2])).toEqual([1]);
    expect(resolveNotationFixedActiveStaves('grand', [1])).toEqual([1]);
    expect(resolveNotationFixedActiveStaves(null, [1, 2])).toEqual([1, 2]);
    expect(resolveNotationFixedActiveStaves(undefined)).toBeUndefined();
  });
});
