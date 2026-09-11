import type { TrainingLetterRank } from '@/game/training/trainingRank';

interface TrainingResultImagePayload {
  readonly trainingTitle: string;
  readonly userName: string;
  readonly rank: TrainingLetterRank;
  readonly score: number;
  readonly rankPosition: number | null;
}

const FONT_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const wrapCanvasLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): readonly string[] => {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) return [text];

  const lines: string[] = [];
  let current = words[0] ?? '';
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i] ?? '';
    }
  }
  lines.push(current);
  return lines;
};

const drawFittedTitle = (
  ctx: CanvasRenderingContext2D,
  title: string,
  centerX: number,
  startY: number,
  maxWidth: number,
): void => {
  let fontSize = 72;
  const minFontSize = 36;
  let lines: readonly string[] = [title];

  while (fontSize >= minFontSize) {
    ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
    lines = wrapCanvasLines(ctx, title, maxWidth);
    const widest = lines.reduce(
      (max, line) => Math.max(max, ctx.measureText(line).width),
      0,
    );
    if (widest <= maxWidth) break;
    fontSize -= 4;
  }

  const lineHeight = fontSize * 1.15;
  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, startY + index * lineHeight);
  });
};

const renderTrainingResultImage = (payload: TrainingResultImagePayload): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D unavailable');
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1e1b4b');
  gradient.addColorStop(1, '#312e81');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.font = `bold 56px ${FONT_FAMILY}`;
  ctx.fillText('Jazzify Training', canvas.width / 2, 160);

  drawFittedTitle(ctx, payload.trainingTitle, canvas.width / 2, 280, canvas.width - 120);

  ctx.font = `48px ${FONT_FAMILY}`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(payload.userName, canvas.width / 2, 400);

  ctx.fillStyle = '#fbbf24';
  ctx.font = `bold 180px ${FONT_FAMILY}`;
  ctx.fillText(payload.rank, canvas.width / 2, 620);

  ctx.fillStyle = '#f8fafc';
  ctx.font = `bold 96px ${FONT_FAMILY}`;
  ctx.fillText(`${payload.score}`, canvas.width / 2, 820);

  if (payload.rankPosition != null) {
    ctx.font = `bold 44px ${FONT_FAMILY}`;
    ctx.fillStyle = '#c7d2fe';
    ctx.fillText(`あなたの順位 … ${payload.rankPosition}位`, canvas.width / 2, 910);
  }

  ctx.font = `40px ${FONT_FAMILY}`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('1分間の正解数', canvas.width / 2, payload.rankPosition != null ? 970 : 900);

  return canvas;
};

export const downloadTrainingResultImage = (payload: TrainingResultImagePayload): void => {
  const canvas = renderTrainingResultImage(payload);
  const link = document.createElement('a');
  link.download = `jazzify-training-${payload.rank}-${payload.score}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
