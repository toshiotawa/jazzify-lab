import {
  buildPrecisionNotesFromMusicXml,
  isPrecisionNoteInGuideWindow,
  isPrecisionNoteInPerformanceWindow,
  isPrecisionShortNoteDuration,
  PRECISION_FULL_KEYBOARD_RANGE,
  resolvePrecisionDisplayKeyboardRange,
  resolvePrecisionKeyboardRange,
} from '@/utils/earTrainingPrecisionNotes';
import {
  findPrecisionNoteForInput,
  precisionRankForGoodRate,
  createPrecisionRuntimeStates,
  markExpiredPrecisionNotesAsMiss,
  isPrecisionClearRank,
  PRECISION_JUDGMENT_WINDOW_SEC,
  shouldCullPrecisionNoteFromLane,
} from '@/utils/earTrainingPrecisionJudge';
import { applyPracticeTransposeToMusicXml } from '@/utils/earTrainingPracticeTranspose';

const MINIMAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part>
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <key><fifths>0</fifths></key>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

describe('earTrainingPrecisionNotes', () => {
  it('1音1ノーツを生成する', () => {
    const { notes } = buildPrecisionNotesFromMusicXml(MINIMAL_XML, 120, 4);
    expect(notes).toHaveLength(3);
    expect(notes[0]?.midi).toBe(60);
    expect(notes[1]?.midi).toBe(64);
    expect(notes[2]?.midi).toBe(67);
  });

  it('2オクターブ以内なら24半音幅に拡張する', () => {
    const range = resolvePrecisionKeyboardRange([60, 67]);
    expect(range.maxMidi - range.minMidi + 1).toBeGreaterThanOrEqual(24);
    expect(range.minMidi).toBeLessThanOrEqual(60);
    expect(range.maxMidi).toBeGreaterThanOrEqual(67);
  });

  it('Web版は88鍵フルレンジを返す', () => {
    const range = resolvePrecisionDisplayKeyboardRange([60, 67], true);
    expect(range).toEqual(PRECISION_FULL_KEYBOARD_RANGE);
  });

  it('移調済みMusicXMLからoffset無しで正しいmidiを生成する', () => {
    const transposed = applyPracticeTransposeToMusicXml(MINIMAL_XML, 2);
    const { notes: withOffset } = buildPrecisionNotesFromMusicXml(MINIMAL_XML, 120, 4, 2);
    const { notes: fromTransposed } = buildPrecisionNotesFromMusicXml(transposed, 120, 4);
    expect(fromTransposed[0]?.midi).toBe(62);
    expect(fromTransposed.map(note => note.midi)).toEqual(withOffset.map(note => note.midi));
  });

  it('四分ノーツは isShortNote=false', () => {
    const { notes } = buildPrecisionNotesFromMusicXml(MINIMAL_XML, 120, 4);
    expect(notes.every(note => note.isShortNote === false)).toBe(true);
    expect(isPrecisionShortNoteDuration(notes[0]?.durationSec ?? 0, 120)).toBe(false);
  });
});

describe('earTrainingPrecisionJudge', () => {
  it('±250ms 内の最早ノーツを good にする', () => {
    const notes = [
      { id: 'a', midi: 60, startSec: 1, durationSec: 0.5, isBlackKey: false, measureNumber: 1, isShortNote: false },
      { id: 'b', midi: 60, startSec: 1.2, durationSec: 0.5, isBlackKey: false, measureNumber: 1, isShortNote: false },
    ];
    const states = createPrecisionRuntimeStates(notes);
    const matched = findPrecisionNoteForInput(notes, states, 60, 1.05, 0.25);
    expect(matched?.id).toBe('a');
  });

  it('窓超過で miss を付与する', () => {
    const notes = [
      { id: 'a', midi: 60, startSec: 1, durationSec: 0.5, isBlackKey: false, measureNumber: 1, isShortNote: false },
    ];
    const states = createPrecisionRuntimeStates(notes);
    const missed = markExpiredPrecisionNotesAsMiss(notes, states, 1.3, 0.25);
    expect(missed).toBe(1);
    expect(states.get('a')?.judgment).toBe('miss');
  });

  it('good率から D/C/B/A/S ランクを決める', () => {
    expect(precisionRankForGoodRate(0.96)).toBe('S');
    expect(precisionRankForGoodRate(0.91)).toBe('A');
    expect(precisionRankForGoodRate(0.81)).toBe('B');
    expect(precisionRankForGoodRate(0.71)).toBe('C');
    expect(precisionRankForGoodRate(0.69)).toBe('D');
    expect(isPrecisionClearRank('C')).toBe(true);
    expect(isPrecisionClearRank('D')).toBe(false);
  });

  it('練習ガイド窓内のpendingノーツを判定する', () => {
    const note = {
      startSec: 2, durationSec: 0.5, isBlackKey: false, measureNumber: 1, id: 'a', midi: 60, isShortNote: false,
    };
    expect(isPrecisionNoteInGuideWindow(note, 1.6, PRECISION_JUDGMENT_WINDOW_SEC)).toBe(true);
    expect(isPrecisionNoteInGuideWindow(note, 2.1, PRECISION_JUDGMENT_WINDOW_SEC)).toBe(true);
    expect(isPrecisionNoteInGuideWindow(note, 1.0, PRECISION_JUDGMENT_WINDOW_SEC)).toBe(false);
    expect(isPrecisionNoteInGuideWindow(note, 2.5, PRECISION_JUDGMENT_WINDOW_SEC)).toBe(false);
  });

  it('演奏区間内の pending ノーツを練習ハイライト対象とする', () => {
    const note = {
      startSec: 2, durationSec: 0.5, isBlackKey: false, measureNumber: 1, id: 'a', midi: 60, isShortNote: false,
    };
    expect(isPrecisionNoteInPerformanceWindow(note, 2)).toBe(true);
    expect(isPrecisionNoteInPerformanceWindow(note, 2.5)).toBe(true);
    expect(isPrecisionNoteInPerformanceWindow(note, 1.9)).toBe(false);
    expect(isPrecisionNoteInPerformanceWindow(note, 2.51)).toBe(false);
  });

  it('miss ノーツは画面下端を出るまでカリングしない', () => {
    const laneHeight = 300;
    const canvasHeight = 396;
    const inPianoZoneTop = laneHeight + 50;
    expect(shouldCullPrecisionNoteFromLane(
      'miss',
      350,
      inPianoZoneTop,
      laneHeight,
      canvasHeight,
    )).toBe(false);
    expect(shouldCullPrecisionNoteFromLane(
      'miss',
      450,
      canvasHeight + 30,
      laneHeight,
      canvasHeight,
    )).toBe(true);
  });

  it('pending ノーツはレーン下端を超えたらカリングする', () => {
    const laneHeight = 300;
    const canvasHeight = 396;
    expect(shouldCullPrecisionNoteFromLane(
      'pending',
      250,
      laneHeight + 30,
      laneHeight,
      canvasHeight,
    )).toBe(true);
    expect(shouldCullPrecisionNoteFromLane(
      'good',
      350,
      laneHeight + 30,
      laneHeight,
      canvasHeight,
    )).toBe(false);
  });
});
