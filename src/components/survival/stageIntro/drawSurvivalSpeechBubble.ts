const BUBBLE_PAD_X = 11;
const BUBBLE_PAD_Y = 10;
const BUBBLE_CORNER_RADIUS = 12;
const BUBBLE_TAIL_HEIGHT = 10;
const BUBBLE_FONT = 'bold 12px Inter, ui-sans-serif, system-ui, sans-serif';
const BUBBLE_BG = 'rgba(0, 0, 0, 0.78)';
const BUBBLE_STROKE = 'rgba(255, 255, 255, 0.26)';

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

export interface DrawSurvivalSpeechBubbleParams {
  readonly ctx: CanvasRenderingContext2D;
  /** 吹き出し中心（尾の先端付近） */
  readonly centerX: number;
  readonly anchorY: number;
  readonly text: string;
  readonly maxWidth: number;
}

/** キャラ頭上向けの吹き出し（尾は下向き）。 */
export const drawSurvivalSpeechBubble = (p: DrawSurvivalSpeechBubbleParams): void => {
  const { ctx, centerX, anchorY, text, maxWidth } = p;
  const trimmed = text.trim();
  if (!trimmed) return;

  ctx.save();
  ctx.font = BUBBLE_FONT;
  const innerMax = Math.max(48, maxWidth - BUBBLE_PAD_X * 2);
  const lines = wrapLines(ctx, trimmed, innerMax);
  const lineHeight = 16;
  const blockHeight = lines.length * lineHeight;
  const bubbleWidth = Math.min(
    maxWidth,
    Math.max(
      innerMax + BUBBLE_PAD_X * 2,
      ...lines.map((ln) => ctx.measureText(ln).width + BUBBLE_PAD_X * 2),
    ),
  );
  const bubbleHeight = blockHeight + BUBBLE_PAD_Y * 2;
  const left = centerX - bubbleWidth / 2;
  const top = anchorY - bubbleHeight - BUBBLE_TAIL_HEIGHT;

  const roundRect = (
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
  };

  roundRect(left, top, bubbleWidth, bubbleHeight, BUBBLE_CORNER_RADIUS);
  ctx.fillStyle = BUBBLE_BG;
  ctx.fill();
  ctx.strokeStyle = BUBBLE_STROKE;
  ctx.lineWidth = 1;
  ctx.stroke();

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
  ctx.restore();
};
