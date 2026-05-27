import type { Direction } from '@/components/survival/SurvivalTypes';
import { MAP_CONFIG, SHOCKWAVE_DURATION } from '@/components/survival/SurvivalTypes';

import type { ShockwaveBurst } from '@/utils/balloonRushMelee';

export interface BalloonDrawInstance {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export interface BalloonRushDrawSnapshot {
  readonly playerX: number;
  readonly playerY: number;
  readonly playerDirection: Direction;
  readonly balloons: readonly BalloonDrawInstance[];
  readonly jajiiX: number | null;
  readonly jajiiY: number | null;
  readonly shockwaves: readonly ShockwaveBurst[];
  readonly nowPerfMs: number;
}

const BALLOON_EMOJI = '🎈';
const PLAYER_EMOJI = '🧑‍🎤';
const JAJII_EMOJI = '🧙';

export const drawBalloonRushWorld = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  snap: BalloonRushDrawSnapshot,
): void => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const mapW = MAP_CONFIG.width;
  const mapH = MAP_CONFIG.height;
  const scale = Math.min(width / mapW, height / mapH) * 0.98;
  const ox = (width - mapW * scale) / 2;
  const oy = (height - mapH * scale) / 2;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4 / scale;
  ctx.strokeRect(0, 0, mapW, mapH);

  const { playerX, playerY } = snap;
  const camX = playerX;
  const camY = playerY;
  const viewHalfW = width / scale / 2;
  const viewHalfH = height / scale / 2;
  const loX = camX - viewHalfW;
  const loY = camY - viewHalfH;

  ctx.translate(-loX, -loY);

  for (const w of snap.shockwaves) {
    const age = snap.nowPerfMs - w.startPerfMs;
    if (age < 0 || age > SHOCKWAVE_DURATION) continue;
    const t = age / SHOCKWAVE_DURATION;
    const r = w.maxRadius * t;
    ctx.beginPath();
    ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(250,204,21,${0.55 * (1 - t)})`;
    ctx.lineWidth = (8 * (1 - t) + 2) / scale;
    ctx.stroke();
  }

  if (snap.jajiiX !== null && snap.jajiiY !== null) {
    ctx.font = `${48}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(JAJII_EMOJI, snap.jajiiX, snap.jajiiY);
  }

  for (const b of snap.balloons) {
    if (!b.visible) continue;
    ctx.font = `${52}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(BALLOON_EMOJI, b.x, b.y);
  }

  ctx.font = `${52}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(PLAYER_EMOJI, playerX, playerY);

  ctx.restore();
};
