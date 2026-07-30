import {
  adlibCallResponseHitRatio,
  adlibCallResponseRankForAccuracy,
  buildAdlibCallResponseHintGroups,
  buildAdlibCallResponseTargets,
  collectAdlibCallResponseAttacks,
  matchesAdlibCallResponseTarget,
  resolveAdlibCallResponseActiveHintGuideMidis,
} from '@/utils/earTrainingAdlibCallResponse';
import { collectChordOsmdMusicXmlAttacks } from '@/utils/earTrainingChordOsmd';

const miniScore = (measureInner: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">${measureInner}</measure>
  </part>
</score-partwise>`;

describe('collectAdlibCallResponseAttacks', () => {
  it('voice1 の和音クラスタのみ収集し voice2/3 を無視する', () => {
    const xml = miniScore(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
<note><chord/><pitch><step>E</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
<note><chord/><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
<note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
<note><chord/><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
<backup><duration>1</duration></backup>
<note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration><voice>2</voice></note>
<backup><duration>1</duration></backup>
<note><pitch><step>A</step><octave>5</octave></pitch><duration>1</duration><voice>3</voice></note>`);
    const attacks = collectAdlibCallResponseAttacks(xml);
    expect(attacks).toHaveLength(1);
    // C4=60, Eb4=63, F4=65, G4=67, Bb4=70
    expect(attacks[0].midis).toEqual([60, 63, 65, 67, 70]);
  });

  it('voice1 が無いコール小節はターゲット 0', () => {
    const xml = miniScore(`<attributes><divisions>1</divisions></attributes>
<note><rest/><duration>1</duration><voice>1</voice></note>
<backup><duration>1</duration></backup>
<note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>4</voice></note>`);
    expect(collectAdlibCallResponseAttacks(xml)).toHaveLength(0);
  });
});

describe('collectChordOsmdMusicXmlAttacks targetVoice option', () => {
  it('targetVoice:1 指定時は voice 1 のみ収集し voice 2/3 を除外する', () => {
    const xml = miniScore(`<attributes><divisions>2</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
<note><chord/><pitch><step>E</step><alter>-1</alter><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
<backup><duration>2</duration></backup>
<note><pitch><step>G</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice></note>
<backup><duration>2</duration></backup>
<note><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>2</duration><voice>3</voice></note>`);
    const attacks = collectChordOsmdMusicXmlAttacks(xml, { targetVoice: 1 });
    expect(attacks).toHaveLength(1);
    expect(attacks[0].midis).toEqual([60, 63]);
  });

  it('targetVoice 未指定時は従来どおり voice 2 も収集する', () => {
    const xml = miniScore(`<attributes><divisions>2</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
<backup><duration>2</duration></backup>
<note><pitch><step>G</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice></note>`);
    const attacks = collectChordOsmdMusicXmlAttacks(xml);
    expect(attacks).toHaveLength(2);
  });
});

describe('buildAdlibCallResponseTargets / matches', () => {
  it('Cm ペンタの pitch class 集合と guideMidis を生成する', () => {
    const attacks = [{
      measureNumber: 1,
      beatStartInMeasure: 1,
      midis: [60, 63, 65, 67, 70],
    }];
    const targets = buildAdlibCallResponseTargets(attacks, { bpm: 120, beatsPerMeasure: 4 });
    expect(targets).toHaveLength(1);
    expect(targets[0].targetTimeSec).toBeCloseTo(0, 5);
    expect(Array.from(targets[0].acceptedPitchClasses).sort((a, b) => a - b)).toEqual([0, 3, 5, 7, 10]);
    expect(targets[0].guideMidis).toEqual([60, 63, 65, 67, 70]);
  });

  it('オクターブ違いでも正解（C3 で C5 登録ターゲット）', () => {
    const targets = buildAdlibCallResponseTargets(
      [{ measureNumber: 1, beatStartInMeasure: 1, midis: [72] }],
      { bpm: 120, beatsPerMeasure: 4 },
    );
    expect(matchesAdlibCallResponseTarget(targets[0], 48)).toBe(true); // C3
    expect(matchesAdlibCallResponseTarget(targets[0], 60)).toBe(true); // C4
    expect(matchesAdlibCallResponseTarget(targets[0], 72)).toBe(true); // C5
    expect(matchesAdlibCallResponseTarget(targets[0], 61)).toBe(false); // C#
  });

  it('和音のうち一音一致で正解', () => {
    const targets = buildAdlibCallResponseTargets(
      [{ measureNumber: 1, beatStartInMeasure: 1, midis: [60, 63, 65, 67, 70] }],
      { bpm: 120, beatsPerMeasure: 4 },
    );
    expect(matchesAdlibCallResponseTarget(targets[0], 67)).toBe(true);
    expect(matchesAdlibCallResponseTarget(targets[0], 64)).toBe(false);
  });
});

describe('adlibCallResponseHitRatio', () => {
  it('精度分母はターゲット数', () => {
    const targets = buildAdlibCallResponseTargets(
      [
        { measureNumber: 1, beatStartInMeasure: 1, midis: [60, 63, 65] },
        { measureNumber: 1, beatStartInMeasure: 2, midis: [67, 70] },
      ],
      { bpm: 120, beatsPerMeasure: 4 },
    );
    expect(targets).toHaveLength(2);
    expect(adlibCallResponseHitRatio(targets, 1)).toBeCloseTo(0.5, 5);
    expect(adlibCallResponseHitRatio(targets, 2)).toBeCloseTo(1, 5);
    expect(adlibCallResponseRankForAccuracy(1)).toBe('Perfect');
  });
});

describe('hint groups / active guide', () => {
  const makeTarget = (
    id: string,
    measureNumber: number,
    beatStartInMeasure: number,
    midis: number[],
    bpm = 120,
    beatsPerMeasure = 4,
  ) => buildAdlibCallResponseTargets(
    [{ measureNumber, beatStartInMeasure, midis }],
    { bpm, beatsPerMeasure },
  )[0];

  it('連続する同一 guideMidis を1音群にまとめ、異なる音群は分割する', () => {
    const cde = [60, 62, 64];
    const cdef = [60, 62, 64, 65];
    const targets = [
      ...[1, 2, 3, 4].map((beat, i) => ({
        ...makeTarget(`a${i}`, 2, beat, cde),
        id: `a${i}`,
        orderIndex: i,
      })),
      ...[1, 2, 3, 4].map((beat, i) => ({
        ...makeTarget(`b${i}`, 3, beat, cdef),
        id: `b${i}`,
        orderIndex: 4 + i,
      })),
    ];
    const groups = buildAdlibCallResponseHintGroups(targets);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ startIndex: 0, endIndex: 3, guideMidis: cde });
    expect(groups[1]).toMatchObject({ startIndex: 4, endIndex: 7, guideMidis: cdef });
  });

  it('射出開始で点灯し、前音群が残る間は次音群へ切り替えない（ユーザー例）', () => {
    // 120BPM 4/4 → 1小節 = 2秒。hammer lead 1小節 = 2秒。late = 0.15
    const cde = [60, 62, 64];
    const cdef = [60, 62, 64, 65];
    const targets = [
      ...[1, 2, 3, 4].map((beat, i) => ({
        ...makeTarget(`a${i}`, 2, beat, cde),
        id: `a${i}`,
        orderIndex: i,
      })),
      ...[1, 2, 3, 4].map((beat, i) => ({
        ...makeTarget(`b${i}`, 3, beat, cdef),
        id: `b${i}`,
        orderIndex: 4 + i,
      })),
    ];
    const groups = buildAdlibCallResponseHintGroups(targets);
    const hammerLeadSec = 2;
    const lateWindowSec = 0.15;
    const settled = new Set<string>();
    const resolve = (phraseTimeSec: number) => resolveAdlibCallResponseActiveHintGuideMidis(
      targets,
      groups,
      {
        phraseTimeSec,
        hammerLeadSec,
        lateWindowSec,
        resolveJudgedTargetTimeSec: t => t,
        isLastTargetSettled: id => settled.has(id),
      },
    );

    // 1小節目頭 = 0秒: CDE 射出開始 → CDE 点灯
    expect(resolve(0)).toEqual(cde);
    // まだ射出前は null
    expect(resolve(-0.01)).toBeNull();
    // 2小節目頭 = 2秒: CDEF も射出開始するが CDE 継続
    expect(resolve(2)).toEqual(cde);
    // 2小節目4拍目ターゲット時刻 = 2 + 1.5 = 3.5。窓終了 = 3.65
    expect(resolve(3.64)).toEqual(cde);
    expect(resolve(3.66)).toEqual(cdef);
    // 早期終了: 末尾 settle で即 CDEF
    settled.add('a3');
    expect(resolve(3.5)).toEqual(cdef);
    settled.clear();
    // 3小節目4拍目 = 4 + 1.5 = 5.5。窓終了 = 5.65 で消灯
    expect(resolve(5.64)).toEqual(cdef);
    expect(resolve(5.66)).toBeNull();
    settled.add('b3');
    expect(resolve(5.5)).toBeNull();
  });
});
