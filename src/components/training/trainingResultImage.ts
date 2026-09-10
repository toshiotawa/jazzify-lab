import type { TrainingLetterRank } from '@/game/training/trainingRank';

interface TrainingResultImagePayload {
  readonly trainingTitle: string;
  readonly userName: string;
  readonly rank: TrainingLetterRank;
  readonly score: number;
}

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
  ctx.font = 'bold 56px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Jazzify Training', canvas.width / 2, 160);

  ctx.font = 'bold 72px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(payload.trainingTitle, canvas.width / 2, 300);

  ctx.font = '48px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(payload.userName, canvas.width / 2, 400);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 180px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(payload.rank, canvas.width / 2, 620);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 96px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${payload.score}`, canvas.width / 2, 820);

  ctx.font = '40px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('1分間の正解数', canvas.width / 2, 900);

  return canvas;
};

export const downloadTrainingResultImage = (payload: TrainingResultImagePayload): void => {
  const canvas = renderTrainingResultImage(payload);
  const link = document.createElement('a');
  link.download = `jazzify-training-${payload.rank}-${payload.score}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
