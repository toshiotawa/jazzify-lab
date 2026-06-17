import {
  bassMidiForRootAndFifth,
  bassRootMidiForSymbol,
  buildAdvancedMinusOneEvents,
  buildBlock3MinusOneEventsForLoop,
  buildCharlestonVoicingEventsForMeasure,
  buildIntermediateMinusOneEvents,
  defaultAdvancedMinusOneOutputName,
  defaultBlock3MinusOneOutputName,
  defaultIntermediateMinusOneOutputName,
  listTwoHandVoicingMinusOneTargets,
  MINUS_ONE_BEAT_SEC,
  MINUS_ONE_CHARLESTON_OFFBEAT_SEC,
  MINUS_ONE_MEASURE_SEC,
  MINUS_ONE_VOICING_SWING_OFFBEAT_SEC,
  MINUS_ONE_VOICING_SWING_ONBEAT_SEC,
  MINUS_ONE_WHOLE_NOTE_SEC,
  minusOneBeat1FrontSec,
  minusOneBeat2BackSec,
  minusOneBeat2FrontSec,
  repeatEventsForLoops,
  MINUS_ONE_LOOP_SEC,
  MINUS_ONE_LOOPS,
  MINUS_ONE_SWING_LONG_RATIO,
  resolveAdvancedMinusOneSpec,
  resolveBlock3MinusOneSpec,
  twoHandVoicingMinusOneCdnUrl,
} from '@/utils/twoHandVoicingMinusOneSchedule';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

describe('twoHandVoicingMinusOneSchedule', () => {
  it('Block3 M7 p1 は 4 小節・2拍目スウィング表裏・全音符ベース・6 ループ', () => {
    const { category, progression } = resolveBlock3MinusOneSpec('b3-m7', 'p1');
    const loop = buildBlock3MinusOneEventsForLoop(progression, category);
    expect(loop.voicingGuide).toHaveLength(8 * 4);
    expect(loop.bass).toHaveLength(4);

    const measureStartSec = 0;
    const beat2Front = minusOneBeat2FrontSec(measureStartSec);
    const beat2Back = minusOneBeat2BackSec(measureStartSec);

    const voicingA = loop.voicingGuide[0];
    expect(voicingA.startSec).toBeCloseTo(beat2Front, 6);
    expect(voicingA.durationSec).toBeCloseTo(MINUS_ONE_VOICING_SWING_ONBEAT_SEC, 6);
    expect(voicingA.articulation).toBe('sustain');

    const voicingB = loop.voicingGuide[4];
    expect(voicingB.startSec).toBeCloseTo(beat2Back, 6);
    expect(voicingB.durationSec).toBeCloseTo(MINUS_ONE_VOICING_SWING_OFFBEAT_SEC, 6);
    expect(voicingB.articulation).toBe('staccato');
    expect(beat2Back - beat2Front).toBeCloseTo(MINUS_ONE_BEAT_SEC * MINUS_ONE_SWING_LONG_RATIO, 6);
    expect(parseVoicingNoteName('A3').midi).toBeLessThan(parseVoicingNoteName('C5').midi);

    const bassRoot = loop.bass[0];
    expect(bassRoot.startSec).toBe(0);
    expect(bassRoot.durationSec).toBeCloseTo(MINUS_ONE_WHOLE_NOTE_SEC, 6);

    const repeated = repeatEventsForLoops(loop.bass, MINUS_ONE_LOOP_SEC, MINUS_ONE_LOOPS);
    expect(repeated).toHaveLength(loop.bass.length * MINUS_ONE_LOOPS);
    expect(repeated[loop.bass.length]?.startSec).toBe(MINUS_ONE_LOOP_SEC);

    const measureFourStart = MINUS_ONE_MEASURE_SEC * 3;
    const bassInMeasureFour = loop.bass.filter(event => event.startSec >= measureFourStart);
    expect(bassInMeasureFour).toHaveLength(1);
  });

  it('Charleston は 1拍目頭と 2拍目ウラで同一ヴォイシング', () => {
    const notes = ['D3', 'A3', 'C4', 'F4'] as const;
    const events = buildCharlestonVoicingEventsForMeasure(notes, 0);
    expect(events).toHaveLength(8);

    const beat1Front = minusOneBeat1FrontSec(0);
    const beat2Back = minusOneBeat2BackSec(0);
    const frontEvents = events.filter(event => event.startSec === beat1Front);
    const backEvents = events.filter(event => event.startSec === beat2Back);

    expect(frontEvents).toHaveLength(4);
    expect(backEvents).toHaveLength(4);
    expect(frontEvents[0]?.articulation).toBe('sustain');
    expect(frontEvents[0]?.durationSec).toBeCloseTo(MINUS_ONE_BEAT_SEC, 6);
    expect(backEvents[0]?.articulation).toBe('staccato');
    expect(backEvents[0]?.durationSec).toBeCloseTo(MINUS_ONE_CHARLESTON_OFFBEAT_SEC, 6);
    expect(frontEvents.map(event => event.midi)).toEqual(backEvents.map(event => event.midi));
  });

  it('中級 b1-q1 ph0 は Charleston・4 小節・6 ループ', () => {
    const events = buildIntermediateMinusOneEvents('b1-q1', 0);
    expect(events.voicingGuide.length).toBe(4 * 4 * 2 * MINUS_ONE_LOOPS);
    expect(events.bass).toHaveLength(4 * MINUS_ONE_LOOPS);
    expect(events.bass[0]?.midi).toBe(bassRootMidiForSymbol('Dm7'));
  });

  it('上級 b1-m7 p1 は Charleston・4 小節・6 ループ', () => {
    const { progression } = resolveAdvancedMinusOneSpec('b1-m7', 'p1');
    const events = buildAdvancedMinusOneEvents('b1-m7', 'p1');
    expect(events.voicingGuide.length).toBe(progression.chordSymbols.length * 5 * 2 * MINUS_ONE_LOOPS);
    expect(events.bass).toHaveLength(progression.chordSymbols.length * MINUS_ONE_LOOPS);
  });

  it('listTwoHandVoicingMinusOneTargets は 60 件・slug 一意', () => {
    const targets = listTwoHandVoicingMinusOneTargets();
    expect(targets).toHaveLength(60);

    const stagePhraseKeys = targets.map(
      target => `${target.stageSlug}:${target.phraseOrderIndex}`,
    );
    expect(new Set(stagePhraseKeys).size).toBe(60);

    const intermediateCount = targets.filter(target => target.course === 'intermediate').length;
    const block3Count = targets.filter(target => target.course === 'block3').length;
    const advancedCount = targets.filter(target => target.course === 'advanced').length;
    expect(intermediateCount).toBe(24);
    expect(block3Count).toBe(18);
    expect(advancedCount).toBe(18);
  });

  it('出力ファイル名と CDN URL', () => {
    expect(defaultIntermediateMinusOneOutputName('b1-q1', 0)).toBe('thvi-voicing-b1-q1-ph0-minus-one.mp3');
    expect(defaultBlock3MinusOneOutputName('b3-m7', 'p1')).toBe('thvi-b3-voicing-b3-m7-p1-minus-one.mp3');
    expect(defaultAdvancedMinusOneOutputName('b1-m7', 'p1')).toBe('thva-voicing-b1-minm7-p1-minus-one.mp3');
    expect(defaultAdvancedMinusOneOutputName('b1-M7', 'p1')).toBe('thva-voicing-b1-majM7-p1-minus-one.mp3');
    expect(twoHandVoicingMinusOneCdnUrl('thvi-b3-voicing-b3-m7-p1-minus-one.mp3'))
      .toBe('https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-m7-p1-minus-one.mp3');
  });

  it('M7 p1 のベース ルートはサバイバル同様 root2', () => {
    expect(bassRootMidiForSymbol('CM7')).toBe(36);
    expect(bassRootMidiForSymbol('FM7')).toBe(41);
    expect(bassRootMidiForSymbol('BbM7')).toBe(46);
    expect(bassRootMidiForSymbol('EbM7')).toBe(39);
  });

  it('bassMidiForRootAndFifth は 5th 配置用（マイナスワンでは未使用）', () => {
    expect(bassMidiForRootAndFifth('CM7')).toEqual({ root: 36, fifth: 43 });
    expect(bassMidiForRootAndFifth('FM7')).toEqual({ root: 29, fifth: 36 });
    expect(bassMidiForRootAndFifth('BbM7')).toEqual({ root: 46, fifth: 53 });
    expect(bassMidiForRootAndFifth('EbM7')).toEqual({ root: 39, fifth: 46 });
  });
});
