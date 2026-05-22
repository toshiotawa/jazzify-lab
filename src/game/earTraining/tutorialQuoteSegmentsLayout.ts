/**
 * Ear Training の Phaser / 他 UI 共通: `TutorialResolvedTextSegment` の横幅折り返し。
 */

import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';
import { TUTORIAL_DIALOG_BODY_COLOR } from '@/types/tutorialStyledText';

export type QuoteColorRun = { readonly t: string; readonly c: string };

const runsFromSegments = (segments: readonly TutorialResolvedTextSegment[]): QuoteColorRun[] => {
  const out: QuoteColorRun[] = [];
  for (const seg of segments) {
    const parts = seg.text.split('\n');
    for (let pi = 0; pi < parts.length; pi += 1) {
      if (pi > 0) {
        out.push({ t: '\n', c: seg.color });
      }
      const words = parts[pi].split(/(\s+)/);
      for (const w of words) {
        if (w) {
          out.push({ t: w, c: seg.color });
        }
      }
    }
  }
  return out;
};

const measureRunWidth = (m: (s: string) => number, r: QuoteColorRun): number =>
  r.t === '\n' ? 0 : m(r.t);

const pushCharRuns = (chars: string, color: string, target: QuoteColorRun[]): void => {
  for (const ch of chars) {
    target.push({ t: ch, c: color });
  }
};

const breakOversizedRun = (
  m: (s: string) => number,
  run: QuoteColorRun,
  maxWidth: number,
): QuoteColorRun[] => {
  if (run.t === '\n' || m(run.t) <= maxWidth) {
    return [run];
  }
  const out: QuoteColorRun[] = [];
  let chunk = '';
  for (const ch of run.t) {
    const next = chunk + ch;
    if (chunk.length > 0 && m(next) > maxWidth) {
      pushCharRuns(chunk, run.c, out);
      chunk = ch;
    } else {
      chunk = next;
    }
  }
  if (chunk) {
    pushCharRuns(chunk, run.c, out);
  }
  return out;
};

const flattenRunsWithCharBreak = (
  m: (s: string) => number,
  runs: readonly QuoteColorRun[],
  maxWidth: number,
): QuoteColorRun[] => runs.flatMap((r) => breakOversizedRun(m, r, maxWidth));

const wrapRunsIntoLines = (
  m: (s: string) => number,
  flatRuns: readonly QuoteColorRun[],
  maxWidth: number,
): QuoteColorRun[][] => {
  const linesOut: QuoteColorRun[][] = [];
  let row: QuoteColorRun[] = [];
  let lineWidth = 0;

  const flushRow = (): void => {
    if (row.length === 0) {
      return;
    }
    linesOut.push(row);
    row = [];
    lineWidth = 0;
  };

  for (const run of flatRuns) {
    if (run.t === '\n') {
      flushRow();
      continue;
    }
    const w = m(run.t);
    if (row.length === 0) {
      row.push(run);
      lineWidth = w;
      continue;
    }
    if (lineWidth + w <= maxWidth) {
      row.push(run);
      lineWidth += w;
    } else {
      flushRow();
      row.push(run);
      lineWidth = w;
    }
  }
  flushRow();
  return linesOut;
};

const appendColoredPiece = (
  row: TutorialResolvedTextSegment[],
  text: string,
  color: string,
): void => {
  if (!text.length) {
    return;
  }
  const last = row[row.length - 1];
  if (last?.color === color) {
    row[row.length - 1] = { text: last.text + text, color };
    return;
  }
  row.push({ text, color });
};

/** 複色セグメントを `maxWidthPx` で折り返した行一覧（Phaser 複数 Text 用） */
export const wrapTutorialQuoteSegmentsToLines = (
  segments: readonly TutorialResolvedTextSegment[],
  maxWidthPx: number,
  measureTextWidthPx: (s: string) => number,
): readonly (readonly TutorialResolvedTextSegment[])[] => {
  if (segments.length === 0) {
    return [];
  }
  const innerMax = Math.max(8, maxWidthPx);
  const runsPrepared = flattenRunsWithCharBreak(
    measureTextWidthPx,
    runsFromSegments(segments),
    innerMax,
  );
  const lineRunsList = wrapRunsIntoLines(measureTextWidthPx, runsPrepared, innerMax);

  const out: TutorialResolvedTextSegment[][] = [];
  for (const lineRuns of lineRunsList) {
    const row: TutorialResolvedTextSegment[] = [];
    for (const r of lineRuns) {
      if (r.t === '\n') {
        continue;
      }
      appendColoredPiece(row, r.t, r.c || TUTORIAL_DIALOG_BODY_COLOR);
    }
    if (row.length > 0) {
      out.push(row);
    }
  }
  return out;
};

/** 各行の描画横幅（複数 Text を横並びにするときの合計） */
export const maxLineRenderedWidthPx = (
  lines: readonly (readonly TutorialResolvedTextSegment[])[],
  measureTextWidthPx: (s: string) => number,
): number => lines.reduce((max, row) => {
  let wRow = 0;
  for (const seg of row) {
    wRow += measureTextWidthPx(seg.text);
  }
  return Math.max(max, wRow);
}, 0);

export const totalQuoteLinesHeightPx = (lineCount: number, lineHeightPx: number): number =>
  Math.max(0, lineCount) * lineHeightPx;
