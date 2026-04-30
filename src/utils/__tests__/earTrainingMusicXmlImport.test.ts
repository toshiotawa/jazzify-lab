import { describe, expect, it } from 'vitest';
import {
  buildEarTrainingPhraseDraftsFromMusicXml,
  createEarTrainingMusicXmlPreview,
  scaleEarTrainingPhraseChordTimings,
  validateEarTrainingImportFileCount,
} from '@/utils/earTrainingMusicXmlImport';

const sampleMusicXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <harmony>
        <root><root-step>C</root-step></root>
        <kind text="maj7">major-seventh</kind>
      </harmony>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
    </measure>
    <measure number="2">
      <harmony>
        <root><root-step>D</root-step></root>
        <kind text="m7">minor-seventh</kind>
      </harmony>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
    </measure>
    <measure number="3">
      <harmony>
        <root><root-step>E</root-step></root>
        <kind text="7">dominant</kind>
      </harmony>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
    </measure>
    <measure number="4">
      <harmony>
        <root><root-step>A</root-step></root>
        <kind text="7">dominant</kind>
      </harmony>
      <note><pitch><step>A</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>B</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>C</step><octave>6</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
      <note><pitch><step>D</step><octave>6</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

const singleNoteMusicXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

describe('earTrainingMusicXmlImport', () => {
  it('指定小節数ごとにMusicXMLのフレーズ範囲を作る', () => {
    const preview = createEarTrainingMusicXmlPreview(sampleMusicXml, 2);

    expect(preview.totalMeasures).toBe(4);
    expect(preview.phraseCount).toBe(2);
    expect(preview.ranges).toEqual([
      { orderIndex: 0, startMeasure: 1, endMeasure: 2 },
      { orderIndex: 1, startMeasure: 3, endMeasure: 4 },
    ]);
  });

  it('各フレーズのノートとコードを耳コピDB行へ変換する', () => {
    const drafts = buildEarTrainingPhraseDraftsFromMusicXml(sampleMusicXml, {
      phraseMeasures: 2,
      bpm: 120,
      beatsPerMeasure: 4,
    });

    expect(drafts).toHaveLength(2);
    expect(drafts[0].noteCount).toBe(8);
    expect(drafts[0].notes[0]).toMatchObject({
      note_index: 0,
      note_name: 'C4',
      pitch_midi: 60,
      pitch_class: 0,
      measure_number: 1,
      beat_offset: 1,
    });
    expect(drafts[0].notes[4]).toMatchObject({
      note_name: 'G4',
      measure_number: 2,
      beat_offset: 1,
    });
    expect(drafts[0].chords.map(chord => chord.chord_name)).toEqual(['Cmaj7', 'Dm7']);
    expect(drafts[0].chords[0]).toMatchObject({
      measure_number: 1,
      beat_offset: 1,
      duration_beats: 4,
      start_time_sec: 0,
      end_time_sec: 2,
    });
    expect(drafts[1].chords.map(chord => chord.chord_name)).toEqual(['E7', 'A7']);
    expect(drafts[1].chords[0]).toMatchObject({
      measure_number: 1,
      beat_offset: 1,
      duration_beats: 4,
      start_time_sec: 0,
      end_time_sec: 2,
    });
  });

  it('コードの秒タイミングを実ループ時間へスケーリングする', () => {
    const drafts = buildEarTrainingPhraseDraftsFromMusicXml(sampleMusicXml, {
      phraseMeasures: 2,
      bpm: 120,
      beatsPerMeasure: 4,
    });

    const scaledChords = scaleEarTrainingPhraseChordTimings(drafts[0].chords, 5, 4);

    expect(scaledChords[0]).toMatchObject({
      chord_name: 'Cmaj7',
      start_time_sec: 0,
      end_time_sec: 2.5,
    });
    expect(scaledChords[1]).toMatchObject({
      chord_name: 'Dm7',
      start_time_sec: 2.5,
      end_time_sec: 5,
    });
  });

  it('生成フレーズ数とmp3数が一致しない場合はエラーにする', () => {
    const preview = createEarTrainingMusicXmlPreview(sampleMusicXml, 2);

    expect(() => validateEarTrainingImportFileCount(preview, 1)).toThrow('mp3ファイル数は2個必要です');
    expect(() => validateEarTrainingImportFileCount(preview, 2)).not.toThrow();
  });

  it('和音を含むMusicXMLはMVP制約エラーにする', () => {
    const chordMusicXml = sampleMusicXml.replace(
      '<note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>',
      '<note><chord/><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>',
    );

    expect(() => createEarTrainingMusicXmlPreview(chordMusicXml, 2)).toThrow('和音を含む');
  });

  it('アウフタクトや休符開始のMusicXMLはMVP制約エラーにする', () => {
    const pickupMusicXml = sampleMusicXml.replace(
      '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>',
      '<note><rest/><duration>1</duration><voice>1</voice><type>quarter</type></note>',
    );

    expect(() => createEarTrainingMusicXmlPreview(pickupMusicXml, 2)).toThrow('アウフタクト');
  });

  it('2音未満のフレーズは生成エラーにする', () => {
    expect(() => buildEarTrainingPhraseDraftsFromMusicXml(singleNoteMusicXml, {
      phraseMeasures: 1,
      bpm: 120,
      beatsPerMeasure: 4,
    })).toThrow('ノート数は2以上');
  });
});
