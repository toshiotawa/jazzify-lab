import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import {
  buildChordOsmdRhythmTargets,
  chordOsmdRankForAccuracy,
  chordOsmdTargetIsComplete,
  collectChordOsmdMusicXmlAttacks,
  collectChordOsmdMusicXmlLyrics,
  consumeChordOsmdMidi,
  createChordOsmdRemainingCounts,
  earTrainingOsmdUsesScoreTargets,
  normalizeChordOsmdMusicXml,
  resolveEarTrainingOsmdTargetsFromScore,
  stripOsmdCountInMeasuresFromMusicXml,
  musicXmlMeasureToOsmdDisplayMeasure,
} from '@/utils/earTrainingChordOsmd';

const chord = (overrides: Partial<EarTrainingPhraseChord> & { id: string; order_index: number }): EarTrainingPhraseChord => ({
  phrase_id: 'phrase-1',
  chord_name: 'C',
  measure_number: 1,
  beat_offset: 1,
  duration_beats: 1,
  start_time_sec: null,
  end_time_sec: null,
  voicing: ['C4'],
  voicing_staves: [1],
  ...overrides,
});

const phrase = (chords: EarTrainingPhraseChord[]): EarTrainingPhrase => ({
  id: 'phrase-1',
  stage_id: 'stage-1',
  order_index: 0,
  audio_url: '/phrase.mp3',
  loop_duration_sec: 8,
  audio_duration_sec: 8,
  note_count: chords.length,
  chords,
});

describe('buildChordOsmdRhythmTargets', () => {
  it('start_time_sec=0 の1拍目を 0 秒ターゲットとして保持する', () => {
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 't0', order_index: 0, chord_name: 'Dm7', start_time_sec: 0, voicing: ['D3'] }),
      ]),
      120,
      4,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].targetTimeSec).toBe(0);
    expect(targets[0].measureNumber).toBe(1);
    expect(targets[0].midiCounts).toEqual([{ midi: 50, count: 1 }]);
  });

  it('同じタイミングの複数行を1ターゲットにまとめ、MIDI重複数も保持する', () => {
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'a', order_index: 0, chord_name: 'C', start_time_sec: 1, voicing: ['C4', 'E4'] }),
        chord({ id: 'b', order_index: 1, chord_name: 'G', start_time_sec: 1, voicing: ['C4', 'G4'] }),
      ]),
      120,
      4,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].label).toBe('C / G');
    expect(targets[0].midiCounts).toEqual([
      { midi: 60, count: 2 },
      { midi: 64, count: 1 },
      { midi: 67, count: 1 },
    ]);
  });

  it('同じ小節・拍の和音は秒タイミングに微小差があっても1ターゲットにまとめる', () => {
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'a', order_index: 0, chord_name: 'C', measure_number: 1, beat_offset: 1, start_time_sec: 0, voicing: ['C4'] }),
        chord({ id: 'b', order_index: 1, chord_name: 'C', measure_number: 1, beat_offset: 1, start_time_sec: 0.002, voicing: ['E4', 'G4'] }),
      ]),
      120,
      4,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].midiCounts).toEqual([
      { midi: 60, count: 1 },
      { midi: 64, count: 1 },
      { midi: 67, count: 1 },
    ]);
  });

  it('beat_offset のフォールバックは MusicXML 風の1始まりで計算する', () => {
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'b1', order_index: 0, measure_number: 2, beat_offset: 1, start_time_sec: null }),
        chord({ id: 'b4', order_index: 1, measure_number: 2, beat_offset: 4, start_time_sec: null }),
      ]),
      120,
      4,
    );

    expect(targets.map(target => target.targetTimeSec)).toEqual([2, 3.5]);
  });

  it('fromScore=true のとき MusicXML アタックから1音=1ターゲットを生成する', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration></note>
<note><rest/><duration>2</duration></note>
<note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration></note>
<note><rest/><duration>2</duration></note>`);
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({
          id: 'listen',
          order_index: 0,
          chord_name: '—',
          measure_number: 1,
          beat_offset: 1,
          voicing: [],
          input_disabled: true,
        }),
        chord({
          id: 'answer',
          order_index: 1,
          chord_name: 'C/G',
          measure_number: 1,
          beat_offset: 1,
          voicing: ['C4', 'G4'],
        }),
      ]),
      100,
      4,
      attacks,
      true,
    );

    expect(targets).toHaveLength(2);
    expect(targets[0].targetTimeSec).toBeCloseTo(0);
    expect(targets[0].midiCounts).toEqual([{ midi: 60, count: 1 }]);
    expect(targets[1].targetTimeSec).toBeCloseTo(1.2);
    expect(targets[1].midiCounts).toEqual([{ midi: 67, count: 1 }]);
    expect(targets.every(target => target.label === 'C/G')).toBe(true);
  });

  it('fromScore=true の和音アタックは1ターゲットにまとめ、全構成音が必要', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note>
<note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration></note>`);
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({
          id: 'answer',
          order_index: 0,
          chord_name: 'C',
          measure_number: 1,
          beat_offset: 1,
          voicing: ['C4'],
        }),
      ]),
      120,
      4,
      attacks,
      true,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].midiCounts).toEqual([
      { midi: 60, count: 1 },
      { midi: 64, count: 1 },
      { midi: 67, count: 1 },
    ]);
    const remaining = createChordOsmdRemainingCounts(targets[0]);
    const afterC = consumeChordOsmdMidi(remaining, 60);
    const afterE = afterC ? consumeChordOsmdMidi(afterC, 64) : null;
    const afterG = afterE ? consumeChordOsmdMidi(afterE, 67) : null;
    expect(afterG ? chordOsmdTargetIsComplete(afterG) : false).toBe(true);
  });

  it('fromScore=true でも聴く小節（input_disabled）のアタックはターゲット化しない', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>`);
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({
          id: 'listen',
          order_index: 0,
          chord_name: '—',
          measure_number: 1,
          beat_offset: 1,
          voicing: [],
          input_disabled: true,
        }),
      ]),
      120,
      4,
      attacks,
      true,
    );

    expect(targets).toHaveLength(0);
  });

  it('fromScore=false のとき従来どおり phrase.chords の拍1ターゲットのみ', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>2</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration></note>
<note><rest/><duration>2</duration></note>
<note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration></note>`);
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    const targets = buildChordOsmdRhythmTargets(
      phrase([
        chord({
          id: 'answer',
          order_index: 0,
          chord_name: 'C/G',
          measure_number: 1,
          beat_offset: 1,
          voicing: ['C4', 'G4'],
        }),
      ]),
      100,
      4,
      attacks,
      false,
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].targetTimeSec).toBe(0);
    expect(targets[0].midiCounts).toEqual([{ midi: 60, count: 1 }]);
  });
});

describe('Chord OSMD target consumption', () => {
  it('完全一致のMIDIだけを消費し、必要数が0になると完了扱いにする', () => {
    const [target] = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'a', order_index: 0, voicing: ['C4', 'C4'] }),
      ]),
      120,
      4,
    );
    const first = createChordOsmdRemainingCounts(target);
    const second = consumeChordOsmdMidi(first, 60);
    const third = second ? consumeChordOsmdMidi(second, 60) : null;

    expect(consumeChordOsmdMidi(first, 72)).toBeNull();
    expect(second ? chordOsmdTargetIsComplete(second) : true).toBe(false);
    expect(third ? chordOsmdTargetIsComplete(third) : false).toBe(true);
  });

  it('同じタイミングの和音は1音だけでは完了しない', () => {
    const [target] = buildChordOsmdRhythmTargets(
      phrase([
        chord({ id: 'a', order_index: 0, start_time_sec: 0, voicing: ['C4'] }),
        chord({ id: 'b', order_index: 1, start_time_sec: 0, voicing: ['E4'] }),
        chord({ id: 'c', order_index: 2, start_time_sec: 0, voicing: ['G4'] }),
      ]),
      120,
      4,
    );
    const first = createChordOsmdRemainingCounts(target);
    const afterC = consumeChordOsmdMidi(first, 60);
    const afterE = afterC ? consumeChordOsmdMidi(afterC, 64) : null;
    const afterG = afterE ? consumeChordOsmdMidi(afterE, 67) : null;

    expect(afterC ? chordOsmdTargetIsComplete(afterC) : true).toBe(false);
    expect(afterE ? chordOsmdTargetIsComplete(afterE) : true).toBe(false);
    expect(afterG ? chordOsmdTargetIsComplete(afterG) : false).toBe(true);
  });
});

describe('chordOsmdRankForAccuracy', () => {
  it('OSMDの正答率を耳コピランクに変換する', () => {
    expect(chordOsmdRankForAccuracy(1)).toBe('Perfect');
    expect(chordOsmdRankForAccuracy(0.85)).toBe('Great');
    expect(chordOsmdRankForAccuracy(0.4)).toBe('Good');
    expect(chordOsmdRankForAccuracy(0.39)).toBe('Fail');
  });
});

describe('normalizeChordOsmdMusicXml', () => {
  it('2段譜でstaffを交互に持つ単一voiceを、休符付きの2voice表記へ正規化する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
      </attributes>
      <harmony><root><root-step>D</root-step></root><kind text="m7">minor-seventh</kind></harmony>
      <note><pitch><step>D</step><octave>3</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><staff>2</staff></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
      <note><pitch><step>D</step><octave>3</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><staff>2</staff></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
    </measure>
  </part>
</score-partwise>`;

    const normalized = normalizeChordOsmdMusicXml(xml);
    const doc = new DOMParser().parseFromString(normalized, 'application/xml');
    const notes = Array.from(doc.getElementsByTagName('note'));
    const rests = notes.filter(noteElement => noteElement.getElementsByTagName('rest').length > 0);
    const pitches = notes.filter(noteElement => noteElement.getElementsByTagName('pitch').length > 0);

    expect(doc.getElementsByTagName('backup')).toHaveLength(1);
    expect(rests).toHaveLength(4);
    expect(pitches).toHaveLength(4);
    expect(Array.from(doc.getElementsByTagName('voice')).map(element => element.textContent)).toEqual([
      '1',
      '1',
      '1',
      '1',
      '2',
      '2',
      '2',
      '2',
    ]);
    expect(doc.getElementsByTagName('harmony')).toHaveLength(1);
  });

  it('backup を含む小節は voice 正規化の対象外のため変更しない（harmony があっても同様）', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part id="P1"><measure number="1">
  <attributes><divisions>1</divisions></attributes>
  <harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>
  <note><rest/><duration>4</duration><voice>1</voice></note>
  <backup><duration>4</duration></backup>
  <note><rest/><duration>4</duration><voice>2</voice></note>
</measure></part></score-partwise>`;

    expect(normalizeChordOsmdMusicXml(xml)).toBe(xml);
  });

  it('backup を含むが harmony が無い MusicXML は変更しない', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part id="P1"><measure number="1"><note><rest/><duration>4</duration><voice>1</voice></note><backup><duration>4</duration></backup><note><rest/><duration>4</duration><voice>2</voice></note></measure></part></score-partwise>`;

    expect(normalizeChordOsmdMusicXml(xml)).toBe(xml);
  });
});

describe('stripOsmdCountInMeasuresFromMusicXml', () => {
  it('各 part の先頭小節を除去する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part id="P1">
<measure number="1"><attributes><divisions>1</divisions></attributes><note><rest/><duration>4</duration></note></measure>
<measure number="2"><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure>
</part></score-partwise>`;
    const stripped = stripOsmdCountInMeasuresFromMusicXml(xml);
    expect(stripped).not.toContain('number="1"');
    expect(stripped).toContain('number="2"');
    expect(stripped.match(/<measure/g)?.length).toBe(1);
    expect(stripped).toContain('<divisions>1</divisions>');
  });

  it('削除小節の attributes を新しい先頭小節へ引き継ぐ', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part id="P1">
<measure number="1"><attributes>
<divisions>2</divisions>
<key><fifths>0</fifths><mode>major</mode></key>
<time symbol="common"><beats>4</beats><beat-type>4</beat-type></time>
<clef><sign>G</sign><line>2</line></clef>
</attributes><note><rest measure="yes"/><duration>8</duration></note></measure>
<measure number="2"><note><pitch><step>E</step><octave>4</octave></pitch><duration>8</duration><type>whole</type></note></measure>
</part></score-partwise>`;
    const stripped = stripOsmdCountInMeasuresFromMusicXml(xml);
    expect(stripped.match(/<measure/g)?.length).toBe(1);
    expect(stripped).toContain('<divisions>2</divisions>');
    expect(stripped).toContain('<fifths>0</fifths>');
    expect(stripped).toContain('symbol="common"');
    expect(stripped).toContain('<sign>G</sign>');
  });

  it('新先頭小節に既存 attributes がある場合は欠けた子だけ補完する', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part id="P1">
<measure number="1"><attributes><divisions>2</divisions><key><fifths>-1</fifths></key></attributes><note><rest/><duration>8</duration></note></measure>
<measure number="2"><attributes><divisions>4</divisions></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>16</duration></note></measure>
</part></score-partwise>`;
    const stripped = stripOsmdCountInMeasuresFromMusicXml(xml);
    expect(stripped).toContain('<divisions>4</divisions>');
    expect(stripped).toContain('<fifths>-1</fifths>');
    expect(stripped).not.toContain('<fifths>0</fifths>');
  });

  it('countInMeasures が 0 なら変更しない', () => {
    const xml = miniChordOsmdScorePartwise('<note><rest/><duration>4</duration></note>');
    expect(stripOsmdCountInMeasuresFromMusicXml(xml, 0)).toBe(xml);
  });
});

describe('musicXmlMeasureToOsmdDisplayMeasure', () => {
  it('MusicXML 小節番号から OSMD 表示用小節番号へ変換する', () => {
    expect(musicXmlMeasureToOsmdDisplayMeasure(1)).toBe(1);
    expect(musicXmlMeasureToOsmdDisplayMeasure(2)).toBe(1);
    expect(musicXmlMeasureToOsmdDisplayMeasure(5)).toBe(4);
  });
});

const miniChordOsmdScorePartwise = (measureInner: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part id="P1"><measure number="1">
${measureInner}
</measure></part></score-partwise>`;

describe('collectChordOsmdMusicXmlLyrics', () => {
  it('歌詞が無ければ空配列', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>`);
    expect(collectChordOsmdMusicXmlLyrics(xml, 120, 4)).toEqual([]);
  });

  it('1番のみ抽出し 2番は無視、拍に応じた targetTimeSec（120BPM・4/4）', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>いち</text></lyric></note>
<note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><lyric number="2"><text>に</text></lyric></note>
<note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><lyric><text>さん</text></lyric></note>`);
    expect(collectChordOsmdMusicXmlLyrics(xml, 120, 4)).toEqual([
      { targetTimeSec: 0, measureNumber: 1, text: 'いち' },
      { targetTimeSec: 1, measureNumber: 1, text: 'さん' },
    ]);
  });

  it('同一歌詞が連続するクラスタでは 1 イベントのみ', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>Hi</text></lyric></note>
<note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><lyric><text>Hi</text></lyric></note>`);
    expect(collectChordOsmdMusicXmlLyrics(xml, 120, 4)).toEqual([
      { targetTimeSec: 0, measureNumber: 1, text: 'Hi' },
    ]);
  });

  it('和音構成音にだけ歌詞が付く場合も拾う', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><lyric><text>CE</text></lyric></note>`);
    expect(collectChordOsmdMusicXmlLyrics(xml, 120, 4)).toEqual([
      { targetTimeSec: 0, measureNumber: 1, text: 'CE' },
    ]);
  });
});

describe('collectChordOsmdMusicXmlAttacks — tie handling', () => {
  it('タイ続きノート（`<tie type="stop"/>`）はアタックに含めず、先頭のみアタックする', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><tie type="start"/></note>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><tie type="stop"/></note>`);

    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks).toHaveLength(1);
    expect(attacks[0].measureNumber).toBe(1);
    expect(attacks[0].beatStartInMeasure).toBeCloseTo(1);
    expect(attacks[0].midis).toEqual([60]);
  });

  it('`<notations><tied type="stop"/></notations>` のみでもタイ続きとして除外する', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><notations><tied type="stop"/></notations></note>`);

    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks).toHaveLength(1);
    expect(attacks[0].beatStartInMeasure).toBeCloseTo(1);
    expect(attacks[0].midis).toEqual([60]);
  });

  it('和音で一部のみタイ続きなら、その構成音だけ MIDI から除外する', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><tie type="stop"/></note>
<note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration></note>`);

    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks).toHaveLength(1);
    expect(attacks[0].beatStartInMeasure).toBeCloseTo(1);
    expect([...attacks[0].midis].sort((a, b) => a - b)).toEqual([60, 67]);
  });

  it('クラスタ先頭がタイ続きで続く構成音のみなら、その構成音だけのアタックとする', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><tie type="stop"/></note>
<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note>`);

    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks).toHaveLength(1);
    expect(attacks[0].midis).toEqual([64]);
  });
});

describe('earTrainingOsmdUsesScoreTargets', () => {
  it('chord_osmd かつ未指定なら MusicXML 譜面ベース判定を使う', () => {
    expect(earTrainingOsmdUsesScoreTargets({ mode: 'chord_osmd', osmd_targets_from_score: undefined })).toBe(true);
  });

  it('chord_osmd で明示 true なら MusicXML 譜面ベース判定を使う', () => {
    expect(earTrainingOsmdUsesScoreTargets({ mode: 'chord_osmd', osmd_targets_from_score: true })).toBe(true);
  });

  it('chord_osmd で明示 false なら従来の chords タイミングに戻す', () => {
    expect(earTrainingOsmdUsesScoreTargets({ mode: 'chord_osmd', osmd_targets_from_score: false })).toBe(false);
  });

  it('chord_osmd 以外では false 扱い', () => {
    expect(earTrainingOsmdUsesScoreTargets({ mode: 'phrase', osmd_targets_from_score: undefined })).toBe(false);
  });
});

describe('resolveEarTrainingOsmdTargetsFromScore', () => {
  it('chord_osmd 未指定時は true を返す', () => {
    expect(resolveEarTrainingOsmdTargetsFromScore({ mode: 'chord_osmd', osmd_targets_from_score: undefined })).toBe(true);
  });

  it('chord_osmd 明示 false は false を返す', () => {
    expect(resolveEarTrainingOsmdTargetsFromScore({ mode: 'chord_osmd', osmd_targets_from_score: false })).toBe(false);
  });

  it('phrase モードでは undefined を維持', () => {
    expect(resolveEarTrainingOsmdTargetsFromScore({ mode: 'phrase', osmd_targets_from_score: undefined })).toBeUndefined();
  });
});
