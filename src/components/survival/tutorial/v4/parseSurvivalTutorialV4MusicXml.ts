/**
 * Survival Tutorial V4 — MusicXML パーサ(素材抽出)。
 *
 * 抽出するもの:
 * - 音符(staff 1|2|3, MIDI, 音名, 絶対拍, 小節番号)
 * - harmony(コード名, 絶対拍, 小節番号)
 * - 歌詞(Verse 番号, テキスト, 絶対拍, 小節番号) → セリフの素材
 * - リハーサルマーク(テキスト, 絶対拍, 小節番号, 拍オフセット) → シーン境界
 * - 調号(fifths), BPM(sound tempo), 拍子
 *
 * Swing のリズムは MIDI のノート timing に内包される前提のため、ここでは扱わない。
 *
 * 拍はすべて四分音符基準(quarter beats)。`new DOMParser()` を使う(jsdom/ブラウザ)。
 */

export interface SurvivalTutorialV4ParsedNote {
  /** ステージ先頭からの絶対拍(四分音符基準)。 */
  readonly startBeat: number;
  readonly endBeat: number;
  readonly midi: number;
  readonly noteName: string;
  readonly staff: 1 | 2 | 3;
  readonly measureNumber: number;
}

export interface SurvivalTutorialV4ParsedHarmony {
  readonly startBeat: number;
  readonly measureNumber: number;
  readonly chordName: string;
}

export interface SurvivalTutorialV4ParsedLyric {
  readonly startBeat: number;
  readonly measureNumber: number;
  readonly verse: number;
  readonly text: string;
}

export interface SurvivalTutorialV4ParsedRehearsal {
  readonly mark: string;
  readonly startBeat: number;
  readonly measureNumber: number;
  /** 小節内の拍オフセット(四分音符基準, 1 始まり)。 */
  readonly beatOffset: number;
}

export interface SurvivalTutorialV4ParsedScore {
  readonly beatsPerMeasure: number;
  readonly beatType: number;
  readonly keyFifths: number;
  readonly bpm: number;
  readonly measureCount: number;
  /** 各小節先頭の絶対拍(四分音符基準)。index = measureNumber-1。 */
  readonly measureStartBeats: readonly number[];
  /** 全小節分の四分音符拍長。 */
  readonly totalQuarterBeats: number;
  readonly notes: readonly SurvivalTutorialV4ParsedNote[];
  readonly harmonies: readonly SurvivalTutorialV4ParsedHarmony[];
  readonly lyrics: readonly SurvivalTutorialV4ParsedLyric[];
  readonly rehearsals: readonly SurvivalTutorialV4ParsedRehearsal[];
}

const STEP_SEMITONES: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

const calculateMidi = (step: string, alter: number, octave: number): number => {
  const base = STEP_SEMITONES[step] ?? 0;
  return (octave + 1) * 12 + base + alter;
};

const stepAlterToName = (step: string, alter: number, octave: number): string => {
  let accidental = '';
  if (alter > 0) accidental = '#'.repeat(alter);
  else if (alter < 0) accidental = 'b'.repeat(-alter);
  return `${step}${accidental}${octave}`;
};

const getNumberFromText = (
  element: Element,
  selector: string,
  fallback: number,
): number => {
  const parsed = Number(element.querySelector(selector)?.textContent ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isGraceNote = (note: Element): boolean => note.querySelector('grace') !== null;

const isPitchedNote = (note: Element): boolean =>
  note.querySelector('pitch') !== null && note.querySelector('rest') === null;

const clampStaff = (value: number): 1 | 2 | 3 => {
  if (value === 2) return 2;
  if (value >= 3) return 3;
  return 1;
};

const getHarmonyName = (harmony: Element): string => {
  const rootStep = harmony.querySelector('root > root-step')?.textContent?.trim() ?? 'C';
  const rootAlterText = harmony.querySelector('root > root-alter')?.textContent?.trim();
  const rootAlter = rootAlterText ? Number(rootAlterText) : 0;
  let rootAcc = '';
  if (rootAlter > 0) rootAcc = '#'.repeat(rootAlter);
  else if (rootAlter < 0) rootAcc = 'b'.repeat(-rootAlter);

  const kindEl = harmony.querySelector('kind');
  const kindText = kindEl?.getAttribute('text') ?? kindEl?.textContent?.trim() ?? '';

  const bassStep = harmony.querySelector('bass > bass-step')?.textContent?.trim();
  let bass = '';
  if (bassStep) {
    const bassAlterText = harmony.querySelector('bass > bass-alter')?.textContent?.trim();
    const bassAlter = bassAlterText ? Number(bassAlterText) : 0;
    let bassAcc = '';
    if (bassAlter > 0) bassAcc = '#'.repeat(bassAlter);
    else if (bassAlter < 0) bassAcc = 'b'.repeat(-bassAlter);
    bass = `/${bassStep}${bassAcc}`;
  }

  return `${rootStep}${rootAcc}${kindText}${bass}`;
};

export const parseSurvivalTutorialV4MusicXml = (
  xmlText: string,
): SurvivalTutorialV4ParsedScore => {
  const document = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('MusicXML の解析に失敗しました');
  }

  const part = document.querySelector('part');
  if (!part) {
    throw new Error('MusicXML に part がありません');
  }
  const measures = Array.from(part.querySelectorAll(':scope > measure'));
  if (measures.length === 0) {
    throw new Error('MusicXML に小節がありません');
  }

  const notes: SurvivalTutorialV4ParsedNote[] = [];
  const harmonies: SurvivalTutorialV4ParsedHarmony[] = [];
  const lyrics: SurvivalTutorialV4ParsedLyric[] = [];
  const rehearsals: SurvivalTutorialV4ParsedRehearsal[] = [];
  const measureStartBeats: number[] = [];

  let divisionsPerQuarter = getNumberFromText(measures[0], 'attributes > divisions', 1);
  let beatsPerMeasure = getNumberFromText(measures[0], 'attributes > time > beats', 4);
  let beatType = getNumberFromText(measures[0], 'attributes > time > beat-type', 4);
  const keyFifthsText = document.querySelector('key > fifths')?.textContent?.trim();
  const keyFifths = keyFifthsText && Number.isFinite(Number(keyFifthsText))
    ? Number(keyFifthsText)
    : 0;
  let bpm = 0;

  let cumulativeBeatPosition = 0;

  measures.forEach((measure, measureIndex) => {
    const measureNumber = measureIndex + 1;
    measureStartBeats.push(round(cumulativeBeatPosition));

    const divisionsEl = measure.querySelector('attributes > divisions');
    if (divisionsEl?.textContent) {
      const parsed = Number(divisionsEl.textContent);
      if (Number.isFinite(parsed) && parsed > 0) divisionsPerQuarter = parsed;
    }
    const timeEl = measure.querySelector('attributes > time');
    if (timeEl) {
      const parsedBeats = Number(timeEl.querySelector('beats')?.textContent);
      const parsedBeatType = Number(timeEl.querySelector('beat-type')?.textContent);
      if (Number.isFinite(parsedBeats) && parsedBeats > 0) beatsPerMeasure = parsedBeats;
      if (Number.isFinite(parsedBeatType) && parsedBeatType > 0) beatType = parsedBeatType;
    }

    const measureQuarterBeats = (beatsPerMeasure / beatType) * 4;
    let positionDivisions = 0;
    let lastNoteStartDivisions = 0;

    for (const child of Array.from(measure.children)) {
      const tag = child.tagName;

      if (tag === 'direction') {
        const beatOffset = round(1 + positionDivisions / divisionsPerQuarter);
        const startBeat = round(cumulativeBeatPosition + (beatOffset - 1));

        const rehearsalEl = child.querySelector('direction-type > rehearsal');
        if (rehearsalEl?.textContent) {
          const mark = rehearsalEl.textContent.trim();
          if (mark.length > 0) {
            rehearsals.push({ mark, startBeat, measureNumber, beatOffset });
          }
        }

        const tempoText = child.querySelector('sound[tempo]')?.getAttribute('tempo');
        if (tempoText && bpm === 0) {
          const parsedTempo = Number(tempoText);
          if (Number.isFinite(parsedTempo) && parsedTempo > 0) bpm = parsedTempo;
        }
        continue;
      }

      if (tag === 'sound') {
        const tempoText = child.getAttribute('tempo');
        if (tempoText && bpm === 0) {
          const parsedTempo = Number(tempoText);
          if (Number.isFinite(parsedTempo) && parsedTempo > 0) bpm = parsedTempo;
        }
        continue;
      }

      if (tag === 'harmony') {
        const beatOffset = round(1 + positionDivisions / divisionsPerQuarter);
        const startBeat = round(cumulativeBeatPosition + (beatOffset - 1));
        harmonies.push({ startBeat, measureNumber, chordName: getHarmonyName(child) });
        continue;
      }

      if (tag === 'backup') {
        const duration = Number(child.querySelector('duration')?.textContent ?? '0');
        positionDivisions -= Number.isFinite(duration) ? duration : 0;
        continue;
      }

      if (tag === 'forward') {
        const duration = Number(child.querySelector('duration')?.textContent ?? '0');
        positionDivisions += Number.isFinite(duration) ? duration : 0;
        continue;
      }

      if (tag !== 'note' || isGraceNote(child)) {
        continue;
      }

      const isChordTone = child.querySelector('chord') !== null;
      const noteStartDivisions = isChordTone ? lastNoteStartDivisions : positionDivisions;
      const duration = Number(child.querySelector('duration')?.textContent ?? '0');
      const startBeat = round(cumulativeBeatPosition + noteStartDivisions / divisionsPerQuarter);

      if (isPitchedNote(child)) {
        const step = child.querySelector('pitch > step')?.textContent?.trim() ?? 'C';
        const alterText = child.querySelector('pitch > alter')?.textContent?.trim();
        const alter = alterText ? Number(alterText) : 0;
        const octaveText = child.querySelector('pitch > octave')?.textContent?.trim();
        const octave = octaveText ? Number(octaveText) : 4;
        const staffText = child.querySelector('staff')?.textContent?.trim();
        const staff = clampStaff(staffText ? Number(staffText) : 1);
        const endBeat = round(
          startBeat + (Number.isFinite(duration) && duration > 0 ? duration / divisionsPerQuarter : 0),
        );

        notes.push({
          startBeat,
          endBeat,
          midi: calculateMidi(step, alter, octave),
          noteName: stepAlterToName(step, alter, octave),
          staff,
          measureNumber,
        });

        for (const lyricEl of Array.from(child.querySelectorAll('lyric'))) {
          const text = lyricEl.querySelector('text')?.textContent?.trim() ?? '';
          if (text.length === 0) continue;
          const verseAttr = lyricEl.getAttribute('number')?.trim();
          const verse = verseAttr && Number.isFinite(Number(verseAttr)) ? Number(verseAttr) : 1;
          lyrics.push({ startBeat, measureNumber, verse, text });
        }
      }

      if (!isChordTone) {
        lastNoteStartDivisions = noteStartDivisions;
        positionDivisions += Number.isFinite(duration) ? duration : 0;
      }
    }

    if (measureQuarterBeats > 0) {
      cumulativeBeatPosition += measureQuarterBeats;
    }
  });

  return {
    beatsPerMeasure,
    beatType,
    keyFifths,
    bpm: bpm > 0 ? bpm : 120,
    measureCount: measures.length,
    measureStartBeats,
    totalQuarterBeats: round(cumulativeBeatPosition),
    notes,
    harmonies,
    lyrics,
    rehearsals,
  };
};
