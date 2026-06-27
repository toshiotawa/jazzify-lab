import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase, EarTrainingPhraseChord } from '@/types';
import {
  areAllChordOsmdTargetsCompleted,
  buildChordOsmdRhythmTargets,
  chordOsmdRankForAccuracy,
  chordOsmdTargetIsComplete,
  collectChordOsmdMusicXmlAttacks,
  collectChordOsmdMusicXmlLyrics,
  consumeChordOsmdMidi,
  createChordOsmdRemainingCounts,
  earTrainingOsmdUsesScoreTargets,
  findFirstIncompleteChordOsmdTarget,
  normalizeChordOsmdMusicXml,
  resolveEarTrainingOsmdTargetsFromScore,
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

  it('fromScore=true で phrase.chords が空のとき MusicXML の全アタックをターゲット化する', () => {
    const xml = miniChordOsmdScorePartwise(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
<note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note>`);
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    const targets = buildChordOsmdRhythmTargets(
      {
        id: 'phrase-score-only',
        stage_id: 'stage-1',
        order_index: 0,
        audio_url: '/phrase.mp3',
        loop_duration_sec: 8,
        audio_duration_sec: 8,
        note_count: 0,
      },
      120,
      4,
      attacks,
      true,
    );

    expect(attacks.length).toBeGreaterThan(0);
    expect(targets).toHaveLength(attacks.length);
    expect(targets[0].label).toBe('—');
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

describe('collectChordOsmdMusicXmlAttacks accidentals', () => {
  const fMajorHeader = `
    <attributes>
      <divisions>1</divisions>
      <key><fifths>-1</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
    </attributes>`;

  it('`<accidental>natural</accidental>` のみ（`<alter>` なし）を B♮ として解釈する', () => {
    const xml = `
      <score-partwise><part><measure number="1">
        ${fMajorHeader}
        <note>
          <pitch><step>B</step><octave>4</octave></pitch>
          <duration>1</duration>
          <type>quarter</type>
          <accidental>natural</accidental>
        </note>
      </measure></part></score-partwise>`;
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks).toHaveLength(1);
    expect(attacks[0].midis).toEqual([71]);
  });

  it('`<accidental>double-sharp</accidental>` のみを解釈する', () => {
    const xml = `
      <score-partwise><part><measure number="1">
        ${fMajorHeader}
        <note>
          <pitch><step>F</step><octave>4</octave></pitch>
          <duration>1</duration>
          <type>quarter</type>
          <accidental>double-sharp</accidental>
        </note>
      </measure></part></score-partwise>`;
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks[0].midis).toEqual([67]);
  });

  it('`<accidental>flat-flat</accidental>` のみを解釈する', () => {
    const xml = `
      <score-partwise><part><measure number="1">
        ${fMajorHeader}
        <note>
          <pitch><step>B</step><octave>4</octave></pitch>
          <duration>1</duration>
          <type>quarter</type>
          <accidental>flat-flat</accidental>
        </note>
      </measure></part></score-partwise>`;
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks[0].midis).toEqual([69]);
  });
});

describe('bluesy licks bundled MusicXML', () => {
  const phrase1Path = 'public/sozai/bluesy-licks/bluesy-licks-01-240_loop4_ci.musicxml';

  it('正規化後も OSMD 判定ターゲットが生成される', () => {
    const raw = readFileSync(phrase1Path, 'utf8');
    const normalized = normalizeChordOsmdMusicXml(raw);
    const attacks = collectChordOsmdMusicXmlAttacks(normalized);
    const phrase: EarTrainingPhrase = {
      id: 'x',
      stage_id: 'y',
      order_index: 0,
      audio_url: 'u',
      loop_duration_sec: 66,
      audio_duration_sec: 66,
      note_count: 0,
    };
    const targets = buildChordOsmdRhythmTargets(phrase, 120, 4, attacks, true);
    expect(attacks.length).toBeGreaterThan(0);
    expect(targets.length).toBeGreaterThan(0);
  });

  it('フレーズ2の B♮（accidental のみ）を 71 として収集する', () => {
    const phrase2Path = 'public/sozai/bluesy-licks/bluesy-licks-02-160_loop4_ci.musicxml';
    const raw = readFileSync(phrase2Path, 'utf8');
    const normalized = normalizeChordOsmdMusicXml(raw);
    const attacks = collectChordOsmdMusicXmlAttacks(normalized);
    expect(attacks.some(attack => attack.midis.includes(71))).toBe(true);
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

describe('findFirstIncompleteChordOsmdTarget', () => {
  it('最初の未完成ターゲットを返す', () => {
    const targets = [
      { id: 'a', label: 'A', measureNumber: 1, targetTimeSec: 0, midiCounts: [] },
      { id: 'b', label: 'B', measureNumber: 2, targetTimeSec: 1, midiCounts: [] },
    ];
    const incomplete = new Set(['b']);
    expect(findFirstIncompleteChordOsmdTarget(targets, id => incomplete.has(id))?.id).toBe('b');
  });

  it('全完了時は null', () => {
    const targets = [
      { id: 'a', label: 'A', measureNumber: 1, targetTimeSec: 0, midiCounts: [] },
    ];
    expect(findFirstIncompleteChordOsmdTarget(targets, () => false)).toBeNull();
  });
});

describe('areAllChordOsmdTargetsCompleted', () => {
  it('全ターゲット完了時のみ true', () => {
    const targets = [
      { id: 'a', label: 'A', measureNumber: 1, targetTimeSec: 0, midiCounts: [] },
      { id: 'b', label: 'B', measureNumber: 2, targetTimeSec: 1, midiCounts: [] },
    ];
    const completed = new Set(['a']);
    expect(areAllChordOsmdTargetsCompleted(targets, id => completed.has(id))).toBe(false);
    completed.add('b');
    expect(areAllChordOsmdTargetsCompleted(targets, id => completed.has(id))).toBe(true);
  });
});
