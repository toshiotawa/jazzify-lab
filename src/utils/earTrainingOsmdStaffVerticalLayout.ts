import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import {
  LYRIC_INTER_STAFF_SAFE_PADDING_PX,
  LYRIC_LANE_COUNT,
  LYRIC_LANE_GAP_PX,
  LYRIC_LANE_HEIGHT_PX,
  REQUIRED_LYRIC_GAP_PX,
} from '@/utils/earTrainingOsmdLyricBoxLayout';
import { computeOsmdLayoutScaleFactor } from '@/utils/earTrainingOsmdMeasureLayout';

export interface StaffVerticalBounds {
  staffIndex: number;
  topPx: number;
  bottomPx: number;
}

export interface InterStaffLyricArea {
  gapTopPx: number;
  gapBottomPx: number;
  gapHeightPx: number;
  laneBasePx: number;
  laneHeightPx: number;
  laneGapPx: number;
  laneCount: number;
  /** true = 2段譜の段間、false = 1段譜フォールバック（下段直下） */
  isInterStaff: boolean;
}

interface OsmdPositionAndShapeLike {
  AbsolutePosition?: { x?: number; y?: number };
  Size?: { width?: number; height?: number };
  BorderMarginTop?: number;
  BorderMarginBottom?: number;
}

interface OsmdStaffLineLike {
  PositionAndShape?: OsmdPositionAndShapeLike;
}

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const readStaffVerticalBounds = (
  staffLine: OsmdStaffLineLike,
  staffIndex: number,
  scaleFactor: number,
): StaffVerticalBounds | null => {
  const pos = staffLine.PositionAndShape;
  const y = getFiniteNumber(pos?.AbsolutePosition?.y);
  if (y === null) {
    return null;
  }
  const height = getFiniteNumber(pos?.Size?.height) ?? 0;
  const marginTop = getFiniteNumber(pos?.BorderMarginTop) ?? 0;
  const marginBottom = getFiniteNumber(pos?.BorderMarginBottom) ?? 0;
  const topPx = (y - marginTop) * scaleFactor;
  const bottomPx = (y + height + marginBottom) * scaleFactor;
  return { staffIndex, topPx, bottomPx };
};

/** GraphicSheet から各譜表の Y 範囲を収集（最初の MusicSystem の StaffLines）。 */
export const collectStaffVerticalBoundsFromOsmd = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
): StaffVerticalBounds[] => {
  const { scaleFactor } = computeOsmdLayoutScaleFactor(osmd, surface);
  const pages = osmd.GraphicSheet?.MusicPages ?? [];
  for (const page of pages) {
    for (const system of page.MusicSystems ?? []) {
      const staffLines = system.StaffLines ?? [];
      const bounds: StaffVerticalBounds[] = [];
      for (let i = 0; i < staffLines.length; i += 1) {
        const staffBounds = readStaffVerticalBounds(staffLines[i] as OsmdStaffLineLike, i, scaleFactor);
        if (staffBounds) {
          bounds.push(staffBounds);
        }
      }
      if (bounds.length > 0) {
        return bounds.sort((a, b) => a.topPx - b.topPx);
      }
    }
  }
  return [];
};

const resolveLaneCountForGap = (gapHeightPx: number): number => {
  const maxLaneHeight = LYRIC_LANE_HEIGHT_PX;
  const maxLaneGap = LYRIC_LANE_GAP_PX;
  for (let count = LYRIC_LANE_COUNT; count >= 1; count -= 1) {
    const required =
      count * maxLaneHeight + Math.max(0, count - 1) * maxLaneGap;
    if (gapHeightPx >= required) {
      return count;
    }
  }
  return 1;
};

const buildLyricAreaFromGap = (
  gapTopPx: number,
  gapBottomPx: number,
  laneCount: number,
  isInterStaff: boolean,
): InterStaffLyricArea => {
  const gapHeightPx = Math.max(0, gapBottomPx - gapTopPx);
  const laneHeightPx = LYRIC_LANE_HEIGHT_PX;
  const laneGapPx = LYRIC_LANE_GAP_PX;
  const lyricAreaHeight = laneCount * laneHeightPx + Math.max(0, laneCount - 1) * laneGapPx;
  const laneBasePx = gapTopPx + Math.max(0, (gapHeightPx - lyricAreaHeight) / 2);
  return {
    gapTopPx,
    gapBottomPx,
    gapHeightPx,
    laneBasePx,
    laneHeightPx,
    laneGapPx,
    laneCount,
    isInterStaff,
  };
};

/** 2段譜の段間、または 1段譜フォールバックから歌詞レーン領域を算出。 */
export const resolveInterStaffLyricArea = (
  staffBounds: readonly StaffVerticalBounds[],
): InterStaffLyricArea | null => {
  if (staffBounds.length === 0) {
    return null;
  }

  if (staffBounds.length >= 2) {
    const upper = staffBounds[0];
    const lower = staffBounds[1];
    const gapTopPx = upper.bottomPx + LYRIC_INTER_STAFF_SAFE_PADDING_PX;
    const gapBottomPx = lower.topPx - LYRIC_INTER_STAFF_SAFE_PADDING_PX;
    const gapHeightPx = gapBottomPx - gapTopPx;
    if (gapHeightPx <= 0) {
      return buildLyricAreaFromGap(gapTopPx, gapBottomPx, 1, true);
    }
    const laneCount = resolveLaneCountForGap(gapHeightPx);
    return buildLyricAreaFromGap(gapTopPx, gapBottomPx, laneCount, true);
  }

  const onlyStaff = staffBounds[0];
  const gapTopPx = onlyStaff.bottomPx + LYRIC_INTER_STAFF_SAFE_PADDING_PX;
  const gapBottomPx = gapTopPx + REQUIRED_LYRIC_GAP_PX;
  const laneCount = resolveLaneCountForGap(REQUIRED_LYRIC_GAP_PX);
  return buildLyricAreaFromGap(gapTopPx, gapBottomPx, laneCount, false);
};

export const resolveLyricAreaFromOsmd = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
): InterStaffLyricArea | null => {
  const staffBounds = collectStaffVerticalBoundsFromOsmd(osmd, surface);
  return resolveInterStaffLyricArea(staffBounds);
};
