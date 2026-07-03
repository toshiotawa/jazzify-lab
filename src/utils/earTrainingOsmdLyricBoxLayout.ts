import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { OsmdMeasureBounds } from '@/utils/earTrainingChordOsmdScoreScroll';
import type { ChordOsmdScoreLyricEvent } from '@/utils/earTrainingChordOsmd';
import { forEachChordOsmdNoteCluster } from '@/utils/earTrainingChordOsmd';
import type { InterStaffLyricArea } from '@/utils/earTrainingOsmdStaffVerticalLayout';
import { readBetweenStaffDistanceStaffHeightsFromMusicXml } from '@/utils/earTrainingChordOsmd';
import { detectMaxStaffLayersFromMusicXml } from '@/utils/earTrainingOsmdMusicXmlStaff';
import { resolveOsmdLayoutScaleFactorFromZoom } from '@/utils/earTrainingOsmdMeasureLayout';

export const LYRIC_LANE_HEIGHT_PX = 18;
export const LYRIC_LANE_GAP_PX = 2;
export const LYRIC_LANE_COUNT = 4;
export const MAX_VERSE_ON_SCORE = 4;
export const LYRIC_MIN_GAP_X_PX = 12;
export const LYRIC_MIN_BOX_WIDTH_PX = 48;
export const LYRIC_MAX_BOX_WIDTH_PX = 180;
export const LYRIC_BOX_PADDING_X_PX = 6;
export const LYRIC_INTER_STAFF_SAFE_PADDING_PX = 4;
export const LYRIC_BEAT_MATCH_EPS = 0.01;

export const REQUIRED_LYRIC_GAP_PX =
  LYRIC_LANE_COUNT * LYRIC_LANE_HEIGHT_PX
  + (LYRIC_LANE_COUNT - 1) * LYRIC_LANE_GAP_PX;

const LYRIC_BETWEEN_STAFF_EXTRA_UNITS = 0.5;

export interface PlacedLyricBox {
  verseNumber: number;
  displayText: string;
  fullText: string;
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
  visibleOnScore: boolean;
}

interface OsmdEngravingRulesLike {
  BetweenStaffDistance?: number;
  MinSkyBottomDistBetweenStaves?: number;
}

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

/** 歌詞4レーン分の OSMD BetweenStaffDistance 下限（staff 高さ単位）。 */
export const resolveMinBetweenStaffDistanceForLyricLanes = (zoom: number): number => {
  const safeZoom = typeof zoom === 'number' && Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const scaleFactor = resolveOsmdLayoutScaleFactorFromZoom(safeZoom);
  const gapUnits = REQUIRED_LYRIC_GAP_PX / scaleFactor;
  return gapUnits + LYRIC_BETWEEN_STAFF_EXTRA_UNITS;
};

/** 精密モード歌詞レイヤー用に段間距離の下限を保証する。2段譜未満では no-op。 */
export const applyScoreLyricBetweenStaffDistanceMin = (
  rules: OsmdEngravingRulesLike | undefined,
  musicXmlText: string | null | undefined,
  zoom: number,
  enableScoreLyricLayer: boolean,
): void => {
  if (!rules || !enableScoreLyricLayer || !musicXmlText) {
    return;
  }
  if (detectMaxStaffLayersFromMusicXml(musicXmlText) < 2) {
    return;
  }
  if (typeof rules.BetweenStaffDistance !== 'number') {
    return;
  }
  const xmlBetweenStaff = readBetweenStaffDistanceStaffHeightsFromMusicXml(musicXmlText);
  const minForLyrics = resolveMinBetweenStaffDistanceForLyricLanes(zoom);
  const nextBetweenStaff = Math.max(
    rules.BetweenStaffDistance,
    xmlBetweenStaff ?? 0,
    minForLyrics,
  );
  rules.BetweenStaffDistance = nextBetweenStaff;
  if (typeof rules.MinSkyBottomDistBetweenStaves === 'number') {
    rules.MinSkyBottomDistBetweenStaves = Math.min(
      rules.MinSkyBottomDistBetweenStaves,
      nextBetweenStaff,
    );
  }
};

/** テスト・配置用の固定幅文字計測（半角 7px / 全角 12px 近似）。 */
export const estimateLyricTextWidthPx = (text: string): number => {
  let width = 0;
  for (const char of text.replace(/\n/g, '')) {
    width += char.charCodeAt(0) > 0xff ? 12 : 7;
  }
  return width;
};

interface OsmdGraphicNoteLike {
  PositionAndShape?: {
    AbsolutePosition?: { x?: number; y?: number };
  };
  sourceNote?: { Pitch?: unknown; TransposedPitch?: unknown };
}

interface OsmdGraphicMeasureLike {
  staffEntries?: Array<{
    graphicalVoiceEntries?: Array<{
      notes?: OsmdGraphicNoteLike[];
    }>;
  }>;
}

const readNoteXScaled = (note: OsmdGraphicNoteLike, scaleFactor: number): number | null => {
  const x = getFiniteNumber(note.PositionAndShape?.AbsolutePosition?.x);
  return x === null ? null : x * scaleFactor;
};

const beatsMatch = (a: number, b: number): boolean => (
  Math.abs(a - b) < LYRIC_BEAT_MATCH_EPS
);

const collectClusterBeatsByMeasure = (
  musicXmlText: string,
): Map<number, number[]> => {
  const byMeasure = new Map<number, number[]>();
  forEachChordOsmdNoteCluster(musicXmlText, ({ measureNumber, beatStartInMeasure, clusterNotes }) => {
    const hasPitch = clusterNotes.some((noteEl) => {
      for (let child = noteEl.firstElementChild; child; child = child.nextElementSibling) {
        if (child.localName === 'pitch') {
          return true;
        }
      }
      return false;
    });
    if (!hasPitch) {
      return;
    }
    const list = byMeasure.get(measureNumber) ?? [];
    list.push(beatStartInMeasure);
    byMeasure.set(measureNumber, list);
  });
  return byMeasure;
};

const readFirstNoteXFromStaffEntry = (
  entry: NonNullable<OsmdGraphicMeasureLike['staffEntries']>[number],
  scaleFactor: number,
): number | null => {
  for (const voiceEntry of entry.graphicalVoiceEntries ?? []) {
    for (const note of voiceEntry.notes ?? []) {
      if (!note.sourceNote?.Pitch && !note.sourceNote?.TransposedPitch) {
        continue;
      }
      const noteX = readNoteXScaled(note, scaleFactor);
      if (noteX !== null) {
        return noteX;
      }
    }
  }
  return null;
};

/** OSMD GraphicSheet + MusicXML クラスタ順序で lyric イベントの音符 X を解決。 */
export const resolveNoteXForLyricEvent = (
  osmd: OpenSheetMusicDisplay,
  event: Pick<ChordOsmdScoreLyricEvent, 'measureNumber' | 'beatStartInMeasure'>,
  musicXmlText: string,
  scaleFactor: number,
): number | null => {
  const clusterBeatsByMeasure = collectClusterBeatsByMeasure(musicXmlText);
  const expectedBeats = clusterBeatsByMeasure.get(event.measureNumber) ?? [];
  let targetClusterIndex = -1;
  for (let i = 0; i < expectedBeats.length; i += 1) {
    if (beatsMatch(expectedBeats[i], event.beatStartInMeasure)) {
      targetClusterIndex = i;
      break;
    }
  }
  if (targetClusterIndex < 0) {
    return null;
  }

  const pages = osmd.GraphicSheet?.MusicPages ?? [];
  for (const page of pages) {
    for (const system of page.MusicSystems ?? []) {
      const staffLine = system.StaffLines?.[0];
      if (!staffLine) {
        continue;
      }
      const measures = staffLine.Measures ?? [];
      const measureIndex = event.measureNumber - 1;
      const measure = measures[measureIndex] as OsmdGraphicMeasureLike | undefined;
      if (!measure) {
        return null;
      }
      let clusterIndex = 0;
      for (const entry of measure.staffEntries ?? []) {
        const noteX = readFirstNoteXFromStaffEntry(entry, scaleFactor);
        if (noteX === null) {
          continue;
        }
        if (clusterIndex === targetClusterIndex) {
          return noteX;
        }
        clusterIndex += 1;
      }
      return null;
    }
  }
  return null;
};

export const resolveLyricEventX = (
  event: Pick<ChordOsmdScoreLyricEvent, 'measureNumber' | 'beatStartInMeasure'>,
  measureBoundsByNumber: Record<number, OsmdMeasureBounds>,
  beatsPerMeasure: number,
  noteX: number | null,
): number | null => {
  if (noteX !== null && Number.isFinite(noteX)) {
    return noteX;
  }
  const bounds = measureBoundsByNumber[event.measureNumber];
  if (!bounds) {
    return null;
  }
  const safeBeats = Math.max(1, beatsPerMeasure);
  const ratio = (event.beatStartInMeasure - 1) / safeBeats;
  return bounds.left + (bounds.right - bounds.left) * ratio;
};

interface OccupiedRange {
  left: number;
  right: number;
}

const rangesOverlap = (
  candidate: OccupiedRange,
  range: OccupiedRange,
  minGap: number,
): boolean => (
  candidate.left < range.right + minGap
  && candidate.right > range.left - minGap
);

const truncateLyricText = (text: string, maxChars: number): string => {
  const singleLine = text.replace(/\n/g, ' ').trim();
  if (singleLine.length <= maxChars) {
    return singleLine;
  }
  if (maxChars <= 1) {
    return '…';
  }
  return `${singleLine.slice(0, maxChars - 1)}…`;
};

const tryPlaceBox = (
  fullText: string,
  leftPx: number,
  topPx: number,
  laneHeightPx: number,
  occupied: readonly OccupiedRange[],
): { displayText: string; widthPx: number; visibleOnScore: boolean } => {
  const singleLine = fullText.replace(/\n/g, ' ').trim();
  if (singleLine.length === 0) {
    return { displayText: '', widthPx: 0, visibleOnScore: false };
  }

  const fullWidth = Math.min(
    LYRIC_MAX_BOX_WIDTH_PX,
    Math.max(LYRIC_MIN_BOX_WIDTH_PX, estimateLyricTextWidthPx(singleLine) + LYRIC_BOX_PADDING_X_PX * 2),
  );

  const tryWidth = (displayText: string, widthPx: number): boolean => {
    const candidate: OccupiedRange = { left: leftPx, right: leftPx + widthPx };
    return !occupied.some((range) => rangesOverlap(candidate, range, LYRIC_MIN_GAP_X_PX));
  };

  if (tryWidth(singleLine, fullWidth)) {
    return { displayText: singleLine, widthPx: fullWidth, visibleOnScore: true };
  }

  for (let chars = singleLine.length - 1; chars >= 3; chars -= 1) {
    const shortened = truncateLyricText(singleLine, chars);
    const widthPx = Math.min(
      LYRIC_MAX_BOX_WIDTH_PX,
      Math.max(LYRIC_MIN_BOX_WIDTH_PX, estimateLyricTextWidthPx(shortened) + LYRIC_BOX_PADDING_X_PX * 2),
    );
    if (tryWidth(shortened, widthPx)) {
      return { displayText: shortened, widthPx, visibleOnScore: true };
    }
  }

  const minWidth = LYRIC_MIN_BOX_WIDTH_PX;
  const minText = truncateLyricText(singleLine, 4);
  if (tryWidth(minText, minWidth)) {
    return { displayText: minText, widthPx: minWidth, visibleOnScore: true };
  }

  return { displayText: singleLine, widthPx: fullWidth, visibleOnScore: false };
};

export interface PlaceScoreLyricBoxesParams {
  events: readonly ChordOsmdScoreLyricEvent[];
  lyricArea: InterStaffLyricArea;
  measureBoundsByNumber: Record<number, OsmdMeasureBounds>;
  beatsPerMeasure: number;
  noteXByEventKey: Readonly<Record<string, number>>;
}

const lyricEventKey = (
  event: Pick<ChordOsmdScoreLyricEvent, 'measureNumber' | 'beatStartInMeasure' | 'verseNumber'>,
): string => `${event.measureNumber}:${event.beatStartInMeasure.toFixed(4)}:${event.verseNumber}`;

/** verse 固定レーン + 横衝突判定で譜面歌詞ボックスを配置する。 */
export const placeScoreLyricBoxes = ({
  events,
  lyricArea,
  measureBoundsByNumber,
  beatsPerMeasure,
  noteXByEventKey,
}: PlaceScoreLyricBoxesParams): PlacedLyricBox[] => {
  const laneCount = lyricArea.laneCount;
  const occupiedByLane: OccupiedRange[][] = Array.from({ length: laneCount }, () => []);

  const scoreEvents = events
    .filter((event) => event.verseNumber >= 1 && event.verseNumber <= MAX_VERSE_ON_SCORE)
    .filter((event) => event.text.trim().length > 0)
    .sort((a, b) => {
      if (a.targetTimeSec !== b.targetTimeSec) {
        return a.targetTimeSec - b.targetTimeSec;
      }
      if (a.measureNumber !== b.measureNumber) {
        return a.measureNumber - b.measureNumber;
      }
      if (a.beatStartInMeasure !== b.beatStartInMeasure) {
        return a.beatStartInMeasure - b.beatStartInMeasure;
      }
      return a.verseNumber - b.verseNumber;
    });

  const placed: PlacedLyricBox[] = [];

  for (const event of scoreEvents) {
    if (event.verseNumber > laneCount) {
      placed.push({
        verseNumber: event.verseNumber,
        displayText: event.text.replace(/\n/g, ' ').trim(),
        fullText: event.text,
        leftPx: 0,
        topPx: 0,
        widthPx: 0,
        heightPx: lyricArea.laneHeightPx,
        visibleOnScore: false,
      });
      continue;
    }

    const laneIndex = event.verseNumber - 1;
    const topPx = lyricArea.laneBasePx + laneIndex * (lyricArea.laneHeightPx + lyricArea.laneGapPx);
    const noteX = noteXByEventKey[lyricEventKey(event)] ?? null;
    const rawX = resolveLyricEventX(event, measureBoundsByNumber, beatsPerMeasure, noteX);
    if (rawX === null) {
      placed.push({
        verseNumber: event.verseNumber,
        displayText: event.text.replace(/\n/g, ' ').trim(),
        fullText: event.text,
        leftPx: 0,
        topPx,
        widthPx: 0,
        heightPx: lyricArea.laneHeightPx,
        visibleOnScore: false,
      });
      continue;
    }

    const leftPx = rawX - LYRIC_BOX_PADDING_X_PX;
    const attempt = tryPlaceBox(
      event.text,
      leftPx,
      topPx,
      lyricArea.laneHeightPx,
      occupiedByLane[laneIndex],
    );

    if (attempt.visibleOnScore) {
      occupiedByLane[laneIndex].push({
        left: leftPx,
        right: leftPx + attempt.widthPx,
      });
    }

    placed.push({
      verseNumber: event.verseNumber,
      displayText: attempt.displayText,
      fullText: event.text,
      leftPx,
      topPx,
      widthPx: attempt.widthPx,
      heightPx: lyricArea.laneHeightPx,
      visibleOnScore: attempt.visibleOnScore,
    });
  }

  return placed;
};

export const buildNoteXByEventKey = (
  osmd: OpenSheetMusicDisplay,
  events: readonly ChordOsmdScoreLyricEvent[],
  musicXmlText: string,
  scaleFactor: number,
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const event of events) {
    const noteX = resolveNoteXForLyricEvent(osmd, event, musicXmlText, scaleFactor);
    if (noteX !== null) {
      result[lyricEventKey(event)] = noteX;
    }
  }
  return result;
};
