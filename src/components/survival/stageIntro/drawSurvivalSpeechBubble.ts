import {
  SURVIVAL_SPEECH_BUBBLE_FONT_PX,
  SURVIVAL_SPEECH_BUBBLE_LINE_HEIGHT_PX,
} from '@/components/survival/stageIntro/survivalSpeechBubbleLayout';
import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';
import { segmentsToPlainString } from '@/types/tutorialStyledText';

const BUBBLE_PAD_X = 11;
const BUBBLE_PAD_Y = 10;
const BUBBLE_CORNER_RADIUS = 12;
const BUBBLE_TAIL_HEIGHT = 10;
const BUBBLE_BG = 'rgba(0, 0, 0, 0.78)';
const BUBBLE_STROKE = 'rgba(255, 255, 255, 0.26)';

const bubbleFont = (): string =>
  `bold ${SURVIVAL_SPEECH_BUBBLE_FONT_PX}px Inter, ui-sans-serif, system-ui, sans-serif`;

const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const paragraphs = text.split('\n');
  const out: string[] = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    let line = '';
    for (const ch of trimmed) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        out.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out.length > 0 ? out : [text];
};

type ColorRun = { readonly t: string; readonly c: string };

const runsFromSegments = (segments: readonly TutorialResolvedTextSegment[]): ColorRun[] => {
  const out: ColorRun[] = [];
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

const measureRunWidth = (ctx: CanvasRenderingContext2D, r: ColorRun): number => {
  if (r.t === '\n') {
    return 0;
  }
  return ctx.measureText(r.t).width;
};

const pushCharRuns = (chars: string, color: string, target: ColorRun[]): void => {
  for (const ch of chars) {
    target.push({ t: ch, c: color });
  }
};

/** 幅超過の単一 run を文字単位に分割して折り返し可能にする */
const breakOversizedRun = (ctx: CanvasRenderingContext2D, run: ColorRun, maxWidth: number): ColorRun[] => {
  if (run.t === '\n' || ctx.measureText(run.t).width <= maxWidth) {
    return [run];
  }
  const out: ColorRun[] = [];
  let chunk = '';
  for (const ch of run.t) {
    const next = chunk + ch;
    if (chunk.length > 0 && ctx.measureText(next).width > maxWidth) {
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
  ctx: CanvasRenderingContext2D,
  runs: readonly ColorRun[],
  maxWidth: number,
): ColorRun[] => runs.flatMap((r) => breakOversizedRun(ctx, r, maxWidth));

const wrapColorRunsIntoLines = (
  ctx: CanvasRenderingContext2D,
  flatRuns: readonly ColorRun[],
  maxWidth: number,
): ColorRun[][] => {
  const linesOut: ColorRun[][] = [];
  let row: ColorRun[] = [];
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
    const w = ctx.measureText(run.t).width;
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

const strokeRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = BUBBLE_BG;
  ctx.fill();
  ctx.strokeStyle = BUBBLE_STROKE;
  ctx.lineWidth = 1;
  ctx.stroke();
};

export type SurvivalSpeechBubblePlacement = 'above' | 'below';

export interface DrawSurvivalSpeechBubbleParams {
  readonly ctx: CanvasRenderingContext2D;
  readonly centerX: number;
  /** 尾の先端（キャラ側の接続点） */
  readonly anchorY: number;
  /** 単色（`segments` 未指定時） */
  readonly text?: string;
  /** 複数色セグメント（優先）。`segmentsToPlainString` が空なら描画しない。 */
  readonly segments?: readonly TutorialResolvedTextSegment[];
  readonly maxWidth: number;
  /** 既定は頭上（ジャ爺・ファイ共通）。`below` は足下＋尾上向き。 */
  readonly placement?: SurvivalSpeechBubblePlacement;
}

const lineRunsWidth = (ctx: CanvasRenderingContext2D, lineRuns: readonly ColorRun[]): number =>
  lineRuns.reduce((acc, run) => acc + measureRunWidth(ctx, run), 0);

const drawSegmentedSpeechBubbleInner = (
  p: Omit<DrawSurvivalSpeechBubbleParams, 'text' | 'segments'> &
    Pick<DrawSurvivalSpeechBubbleParams, 'ctx' | 'centerX' | 'anchorY' | 'maxWidth' | 'placement'> & {
      readonly segments: readonly TutorialResolvedTextSegment[];
    },
): void => {
  const { ctx, centerX, anchorY, maxWidth, placement = 'above', segments } = p;
  ctx.save();
  ctx.font = bubbleFont();
  const innerMax = Math.max(48, maxWidth - BUBBLE_PAD_X * 2);

  const flattenedRuns = flattenRunsWithCharBreak(ctx, runsFromSegments(segments), innerMax);
  if (flattenedRuns.length === 0) {
    ctx.restore();
    return;
  }
  const lineRunsList = wrapColorRunsIntoLines(ctx, flattenedRuns, innerMax);
  if (lineRunsList.length === 0) {
    ctx.restore();
    return;
  }

  const lineHeight = SURVIVAL_SPEECH_BUBBLE_LINE_HEIGHT_PX;
  const blockHeight = lineRunsList.length * lineHeight;
  const bubbleWidth = Math.min(
    maxWidth,
    Math.max(...lineRunsList.map((row) => lineRunsWidth(ctx, row) + BUBBLE_PAD_X * 2)),
  );
  const bubbleHeight = blockHeight + BUBBLE_PAD_Y * 2;
  const left = centerX - bubbleWidth / 2;

  const paintLinesBlock = (bodyTop: number): void => {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textTop = bodyTop + BUBBLE_PAD_Y + lineHeight / 2;
    lineRunsList.forEach((row, i) => {
      const y = textTop + i * lineHeight;
      const rowW = lineRunsWidth(ctx, row);
      let x = centerX - rowW / 2;
      for (const run of row) {
        if (run.t === '\n') continue;
        ctx.fillStyle = run.c;
        ctx.fillText(run.t, x, y);
        x += ctx.measureText(run.t).width;
      }
    });
  };

  if (placement === 'above') {
    const top = anchorY - bubbleHeight - BUBBLE_TAIL_HEIGHT;
    strokeRoundRect(ctx, left, top, bubbleWidth, bubbleHeight, BUBBLE_CORNER_RADIUS);
    ctx.beginPath();
    ctx.moveTo(centerX - 10, top + bubbleHeight);
    ctx.lineTo(centerX + 10, top + bubbleHeight);
    ctx.lineTo(centerX, anchorY);
    ctx.closePath();
    ctx.fillStyle = BUBBLE_BG;
    ctx.fill();
    paintLinesBlock(top);
  } else {
    const bodyTop = anchorY + BUBBLE_TAIL_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(centerX, anchorY);
    ctx.lineTo(centerX - 10, bodyTop);
    ctx.lineTo(centerX + 10, bodyTop);
    ctx.closePath();
    ctx.fillStyle = BUBBLE_BG;
    ctx.fill();
    strokeRoundRect(ctx, left, bodyTop, bubbleWidth, bubbleHeight, BUBBLE_CORNER_RADIUS);
    paintLinesBlock(bodyTop);
  }

  ctx.restore();
};

/** キャラ追従吹き出し（ジャ爺スタイル）。`above` は頭上＋尾下向き、`below` は足下＋尾上向き。 */
export const drawSurvivalSpeechBubble = (p: DrawSurvivalSpeechBubbleParams): void => {
  const { ctx, centerX, anchorY, text, segments, maxWidth, placement = 'above' } = p;
  if (segments && segments.length > 0) {
    const plain = segmentsToPlainString(segments).trim();
    if (!plain) return;
    drawSegmentedSpeechBubbleInner({ ctx, centerX, anchorY, maxWidth, placement, segments });
    return;
  }
  const trimmed = (text ?? '').trim();
  if (!trimmed) return;

  ctx.save();
  ctx.font = bubbleFont();
  const innerMax = Math.max(48, maxWidth - BUBBLE_PAD_X * 2);
  const lines = wrapLines(ctx, trimmed, innerMax);
  const lineHeight = SURVIVAL_SPEECH_BUBBLE_LINE_HEIGHT_PX;
  const blockHeight = lines.length * lineHeight;
  const bubbleWidth = Math.min(
    maxWidth,
    Math.max(...lines.map((ln) => ctx.measureText(ln).width + BUBBLE_PAD_X * 2)),
  );
  const bubbleHeight = blockHeight + BUBBLE_PAD_Y * 2;
  const left = centerX - bubbleWidth / 2;

  if (placement === 'above') {
    const top = anchorY - bubbleHeight - BUBBLE_TAIL_HEIGHT;
    strokeRoundRect(ctx, left, top, bubbleWidth, bubbleHeight, BUBBLE_CORNER_RADIUS);
    ctx.beginPath();
    ctx.moveTo(centerX - 10, top + bubbleHeight);
    ctx.lineTo(centerX + 10, top + bubbleHeight);
    ctx.lineTo(centerX, anchorY);
    ctx.closePath();
    ctx.fillStyle = BUBBLE_BG;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textTop = top + BUBBLE_PAD_Y + lineHeight / 2;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, centerX, textTop + i * lineHeight);
    });
  } else {
    const bodyTop = anchorY + BUBBLE_TAIL_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(centerX, anchorY);
    ctx.lineTo(centerX - 10, bodyTop);
    ctx.lineTo(centerX + 10, bodyTop);
    ctx.closePath();
    ctx.fillStyle = BUBBLE_BG;
    ctx.fill();

    strokeRoundRect(ctx, left, bodyTop, bubbleWidth, bubbleHeight, BUBBLE_CORNER_RADIUS);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textTop = bodyTop + BUBBLE_PAD_Y + lineHeight / 2;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, centerX, textTop + i * lineHeight);
    });
  }

  ctx.restore();
};
