import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { OsmdMeasureBounds } from '@/utils/earTrainingChordOsmdScoreScroll';

export interface OsmdMeasureLayout {
  measureCentersByNumber: Record<number, number>;
  measureBoundsByNumber: Record<number, OsmdMeasureBounds>;
  scoreWidth: number;
}

export type OsmdGraphicMeasureLike = {
  MeasureNumber?: number;
  parentSourceMeasure?: { MeasureNumber?: number };
  PositionAndShape?: {
    AbsolutePosition?: { x?: number };
    BorderRight?: number;
  };
  staffEntries?: Array<{
    graphicalVoiceEntries?: Array<{
      notes?: Array<{
        PositionAndShape?: { AbsolutePosition?: { x?: number } };
        sourceNote?: { Pitch?: unknown; TransposedPitch?: unknown };
      }>;
    }>;
  }>;
};

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

export const resolveOsmdGraphicMeasureNumber = (
  measure: OsmdGraphicMeasureLike,
  fallbackOrdinal: number,
): number => {
  const direct = getFiniteNumber(measure.MeasureNumber);
  if (direct !== null && direct > 0) {
    return Math.floor(direct);
  }
  const fromSource = getFiniteNumber(measure.parentSourceMeasure?.MeasureNumber);
  if (fromSource !== null && fromSource > 0) {
    return Math.floor(fromSource);
  }
  return fallbackOrdinal;
};

const assignMeasureLayout = (
  measureNumber: number,
  noteMinX: number,
  noteMaxX: number,
  measureMinX: number,
  measureMaxX: number,
  measureCentersByNumber: Record<number, number>,
  measureBoundsByNumber: Record<number, OsmdMeasureBounds>,
): void => {
  const left = Number.isFinite(measureMinX) ? measureMinX : noteMinX;
  const right = Number.isFinite(measureMaxX) ? measureMaxX : noteMaxX;
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return;
  }
  measureCentersByNumber[measureNumber] = (left + right) / 2;
  const boundsEntry: OsmdMeasureBounds = { left, right };
  if (Number.isFinite(noteMinX)) {
    boundsEntry.noteLeft = noteMinX;
  }
  if (Number.isFinite(noteMaxX)) {
    boundsEntry.noteRight = noteMaxX;
  }
  measureBoundsByNumber[measureNumber] = boundsEntry;
};

const mergeMeasureBounds = (
  target: OsmdMeasureBounds,
  noteMinX: number,
  noteMaxX: number,
  measureMinX: number,
  measureMaxX: number,
): void => {
  const left = Number.isFinite(measureMinX) ? measureMinX : noteMinX;
  const right = Number.isFinite(measureMaxX) ? measureMaxX : noteMaxX;
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return;
  }
  target.left = Math.min(target.left, left);
  target.right = Math.max(target.right, right);
  if (Number.isFinite(noteMinX)) {
    target.noteLeft = target.noteLeft === undefined
      ? noteMinX
      : Math.min(target.noteLeft, noteMinX);
  }
  if (Number.isFinite(noteMaxX)) {
    target.noteRight = target.noteRight === undefined
      ? noteMaxX
      : Math.max(target.noteRight, noteMaxX);
  }
};

/** MeasureList 行（小節）単位で譜表 X をマージし、MusicXML 小節番号をキーにする。 */
export const collectOsmdMeasureLayoutFromMeasureList = (
  measureList: readonly (readonly OsmdGraphicMeasureLike[])[],
  scaleFactor: number,
  viewportWidth: number,
  renderedWidth: number,
): OsmdMeasureLayout => {
  const measureCentersByNumber: Record<number, number> = {};
  const measureBoundsByNumber: Record<number, OsmdMeasureBounds> = {};
  let maxX = 0;
  let measureOrdinal = 0;

  for (let measureIndex = 0; measureIndex < measureList.length; measureIndex += 1) {
    const row = measureList[measureIndex] ?? [];
    const measures = row.filter(Boolean) as OsmdGraphicMeasureLike[];
    if (measures.length === 0) {
      continue;
    }

    measureOrdinal += 1;
    const measureNumber = resolveOsmdGraphicMeasureNumber(measures[0], measureOrdinal);

    let noteMinX = Number.POSITIVE_INFINITY;
    let noteMaxX = Number.NEGATIVE_INFINITY;
    let measureMinX = Number.POSITIVE_INFINITY;
    let measureMaxX = Number.NEGATIVE_INFINITY;

    for (const measure of measures) {
      const measureX = getFiniteNumber(measure.PositionAndShape?.AbsolutePosition?.x);
      const measureWidth = getFiniteNumber(measure.PositionAndShape?.BorderRight) ?? 0;

      if (measureX !== null) {
        const scaledMeasureX = measureX * scaleFactor;
        measureMinX = Math.min(measureMinX, scaledMeasureX);
        measureMaxX = Math.max(measureMaxX, scaledMeasureX + measureWidth * scaleFactor);
      }

      for (const entry of measure.staffEntries ?? []) {
        for (const voiceEntry of entry.graphicalVoiceEntries ?? []) {
          for (const note of voiceEntry.notes ?? []) {
            if (!note.sourceNote?.Pitch && !note.sourceNote?.TransposedPitch) {
              continue;
            }
            const x = getFiniteNumber(note.PositionAndShape?.AbsolutePosition?.x);
            if (x !== null) {
              const scaledX = x * scaleFactor;
              noteMinX = Math.min(noteMinX, scaledX);
              noteMaxX = Math.max(noteMaxX, scaledX);
              maxX = Math.max(maxX, scaledX);
            }
          }
        }
      }
    }

    const existing = measureBoundsByNumber[measureNumber];
    if (existing) {
      mergeMeasureBounds(existing, noteMinX, noteMaxX, measureMinX, measureMaxX);
      measureCentersByNumber[measureNumber] = (existing.left + existing.right) / 2;
    } else {
      assignMeasureLayout(
        measureNumber,
        noteMinX,
        noteMaxX,
        measureMinX,
        measureMaxX,
        measureCentersByNumber,
        measureBoundsByNumber,
      );
    }
  }

  return {
    measureCentersByNumber,
    measureBoundsByNumber,
    scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
  };
};

export const readOsmdMeasureList = (
  osmd: OpenSheetMusicDisplay,
): readonly (readonly OsmdGraphicMeasureLike[])[] => {
  const sheet = osmd.GraphicSheet as { MeasureList?: unknown; measureList?: unknown } | undefined;
  const raw = sheet?.MeasureList ?? sheet?.measureList;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as readonly (readonly OsmdGraphicMeasureLike[])[];
};

export const computeOsmdLayoutScaleFactor = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
): { scaleFactor: number; renderedWidth: number } => {
  const boundingWidth = getFiniteNumber(osmd.GraphicSheet?.BoundingBox?.width) ?? 0;
  const renderedWidth = surface?.getBoundingClientRect().width ?? 0;
  const scaleFactor = boundingWidth > 0 && renderedWidth > 0 ? renderedWidth / boundingWidth : 10;
  return { scaleFactor, renderedWidth };
};

/** MeasureList が使えない OSMD 向けフォールバック（StaffLine 内の同一小節インデックスで X を統合）。 */
export const collectOsmdMeasureLayoutFromStaffLines = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
  viewportWidth: number,
): OsmdMeasureLayout => {
  const { scaleFactor, renderedWidth } = computeOsmdLayoutScaleFactor(osmd, surface);

  const byNumberBounds: Record<number, { nMin: number; nMax: number; mMin: number; mMax: number }> = {};
  let maxX = 0;

  const pages = osmd.GraphicSheet?.MusicPages ?? [];
  for (const page of pages) {
    for (const system of page.MusicSystems ?? []) {
      const staffLines = system.StaffLines ?? [];
      if (staffLines.length === 0) {
        continue;
      }
      const measureCount = staffLines.reduce(
        (max, staffLine) => Math.max(max, staffLine.Measures?.length ?? 0),
        0,
      );
      for (let measureIndex = 0; measureIndex < measureCount; measureIndex += 1) {
        const mn = measureIndex + 1;

        let b = byNumberBounds[mn];
        if (!b) {
          b = {
            nMin: Number.POSITIVE_INFINITY,
            nMax: Number.NEGATIVE_INFINITY,
            mMin: Number.POSITIVE_INFINITY,
            mMax: Number.NEGATIVE_INFINITY,
          };
          byNumberBounds[mn] = b;
        }

        for (const staffLine of staffLines) {
          const measure = staffLine.Measures?.[measureIndex];
          if (!measure) {
            continue;
          }

          const measureLike = measure as OsmdGraphicMeasureLike;
          const measureX = getFiniteNumber(measureLike.PositionAndShape?.AbsolutePosition?.x);
          const measureWidth = getFiniteNumber(measureLike.PositionAndShape?.BorderRight) ?? 0;
          if (measureX !== null) {
            const smx = measureX * scaleFactor;
            b.mMin = Math.min(b.mMin, smx);
            b.mMax = Math.max(b.mMax, smx + measureWidth * scaleFactor);
          }

          for (const entry of measureLike.staffEntries ?? []) {
            for (const voiceEntry of entry.graphicalVoiceEntries ?? []) {
              for (const note of voiceEntry.notes ?? []) {
                if (!note.sourceNote?.Pitch && !note.sourceNote?.TransposedPitch) {
                  continue;
                }
                const x = getFiniteNumber(note.PositionAndShape?.AbsolutePosition?.x);
                if (x !== null) {
                  const sx = x * scaleFactor;
                  b.nMin = Math.min(b.nMin, sx);
                  b.nMax = Math.max(b.nMax, sx);
                  maxX = Math.max(maxX, sx);
                }
              }
            }
          }
        }
      }
    }
  }

  const measureCentersByNumber: Record<number, number> = {};
  const measureBoundsByNumber: Record<number, OsmdMeasureBounds> = {};
  for (const [mnStr, b] of Object.entries(byNumberBounds)) {
    assignMeasureLayout(
      Number(mnStr),
      b.nMin,
      b.nMax,
      b.mMin,
      b.mMax,
      measureCentersByNumber,
      measureBoundsByNumber,
    );
  }

  return {
    measureCentersByNumber,
    measureBoundsByNumber,
    scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
  };
};

export const measureLayoutFromOsmd = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
  viewportWidth: number,
): OsmdMeasureLayout => {
  const { scaleFactor, renderedWidth } = computeOsmdLayoutScaleFactor(osmd, surface);
  const measureList = readOsmdMeasureList(osmd);
  const primary = collectOsmdMeasureLayoutFromMeasureList(
    measureList,
    scaleFactor,
    viewportWidth,
    renderedWidth,
  );
  const primaryKeys = Object.keys(primary.measureCentersByNumber);
  if (primaryKeys.length > 0) {
    return primary;
  }
  return collectOsmdMeasureLayoutFromStaffLines(osmd, surface, viewportWidth);
};
