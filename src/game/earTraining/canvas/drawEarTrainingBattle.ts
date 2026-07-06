import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import { computeQuoteBubbleMaxOuterWidth } from '@/game/earTraining/computeQuoteBubbleMaxOuterWidth';
import {
  maxLineRenderedWidthPx,
  totalQuoteLinesHeightPx,
  wrapTutorialQuoteSegmentsToLines,
} from '@/game/earTraining/tutorialQuoteSegmentsLayout';
import {
  CHARACTER_DISPLAY_SIZE,
  CHARACTER_SHADOW_HEIGHT,
  CHARACTER_SHADOW_WIDTH,
  EFFECT_ASSET_PATH,
  ENEMY_ATTACK_HAMMER_ASSET_URL,
  clampPercent,
  colorForHp,
  getChordHudLayout,
  getCountInOverlayLayout,
  computeQuoteBubbleSidePlacement,
  SIDE_BUBBLE_TAIL_LENGTH_PX,
  type QuoteBubbleSide,
  getDemoBubblePosition,
  getEnemyAttackGaugePosition,
  getFloorY,
  getHpBarLayout,
  getPhraseIntroY,
  getPhraseSlotViewport,
  HUD_HEIGHT,
  MAGIC_CIRCLE_ASSET_URL,
  PHRASE_INTRO_EMPHASIS_FADE_MS,
  PHRASE_INTRO_FADE_MS,
  PLAYER_QUOTE_CORNER_RADIUS,
  PLAYER_QUOTE_CUE_GAP_PX,
  PLAYER_QUOTE_PAD_X,
  PLAYER_QUOTE_PAD_Y,
  FUKIDASHI_ASSET_URL,
  type EarTrainingRect,
} from './earTrainingBattleLayout';
import type {
  CanvasEffectVisual,
  CanvasQuoteState,
  EarTrainingBattleDrawRuntime,
} from './earTrainingBattleDrawState';
import {
  easeCubicIn,
  easeCubicInOut,
  easeCubicOut,
  easeLinear,
  getEffectProgress,
  getVisualNow,
  lerp,
} from './earTrainingBattleDrawState';
import {
  getCharacterFlashAlpha,
  updateCharacterPositions,
} from './earTrainingBattleCharacterMotion';
import {
  applyWorldCameraTransform,
  computeCameraTransform,
} from './earTrainingBattleCamera';
import {
  drawCachedBackground,
  PLAYER_POSE_IMAGE_URLS,
} from './earTrainingBattleBackground';

const HUD_FONT = 'Arial, sans-serif';

const RIM_SCALE = 1.048;
const RIM_ALPHA = 0.12;
const RIM_TINT_PLAYER = 'rgb(255, 195, 130)';
const RIM_TINT_ENEMY = 'rgb(255, 175, 150)';

let tintCanvas: HTMLCanvasElement | null = null;
let tintCtx: CanvasRenderingContext2D | null = null;

interface RimTintCacheEntry {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const rimTintCache = new Map<string, RimTintCacheEntry>();

const getRimTintCacheKey = (
  imageSrc: string,
  width: number,
  height: number,
  tintColor: string,
): string => `${imageSrc}|${Math.round(width)}|${Math.round(height)}|${tintColor}`;

const getCachedRimTintCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number,
  tintColor: string,
): HTMLCanvasElement | null => {
  if (typeof document === 'undefined') return null;
  const key = getRimTintCacheKey(img.src, width, height, tintColor);
  const cached = rimTintCache.get(key);
  if (cached) {
    return cached.canvas;
  }
  const offCtx = getTintCanvasContext(width, height);
  if (!offCtx || !tintCanvas) return null;
  offCtx.drawImage(img, 0, 0, width, height);
  offCtx.globalCompositeOperation = 'source-atop';
  offCtx.fillStyle = tintColor;
  offCtx.fillRect(0, 0, width, height);
  const cacheCanvas = document.createElement('canvas');
  cacheCanvas.width = width;
  cacheCanvas.height = height;
  const cacheCtx = cacheCanvas.getContext('2d');
  if (!cacheCtx) return null;
  cacheCtx.drawImage(tintCanvas, 0, 0, width, height);
  rimTintCache.set(key, { canvas: cacheCanvas, width, height });
  return cacheCanvas;
};

const drawCachedRimTint = (
  targetCtx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  tintColor: string,
  tintAlpha: number,
): void => {
  const cached = getCachedRimTintCanvas(img, width, height, tintColor);
  if (!cached) return;
  targetCtx.save();
  targetCtx.globalAlpha = tintAlpha;
  targetCtx.drawImage(cached, x, y, width, height);
  targetCtx.restore();
};

const getTintCanvasContext = (width: number, height: number): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') return null;
  if (!tintCanvas) {
    tintCanvas = document.createElement('canvas');
    tintCtx = tintCanvas.getContext('2d');
  }
  if (!tintCtx || !tintCanvas) return null;
  if (tintCanvas.width < width) tintCanvas.width = width;
  if (tintCanvas.height < height) tintCanvas.height = height;
  tintCtx.setTransform(1, 0, 0, 1, 0, 0);
  tintCtx.globalCompositeOperation = 'source-over';
  tintCtx.globalAlpha = 1;
  tintCtx.clearRect(0, 0, width, height);
  return tintCtx;
};

const drawTintedImageCopy = (
  targetCtx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  tintColor: string,
  tintAlpha: number,
): void => {
  const offCtx = getTintCanvasContext(width, height);
  if (!offCtx || !tintCanvas) return;
  offCtx.drawImage(img, 0, 0, width, height);
  offCtx.globalCompositeOperation = 'source-atop';
  offCtx.fillStyle = tintColor;
  offCtx.fillRect(0, 0, width, height);
  targetCtx.save();
  targetCtx.globalAlpha = tintAlpha;
  targetCtx.drawImage(tintCanvas, x, y, width, height);
  targetCtx.restore();
};

const drawCharacterImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  flip: boolean,
): void => {
  ctx.save();
  if (flip) {
    ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW / 2, drawY, drawW, drawH);
  } else {
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
  ctx.restore();
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  runtime: EarTrainingBattleDrawRuntime,
): void => {
  drawCachedBackground(ctx, width, height, runtime.backgroundCache, runtime.loadedImages);
};

const drawHpBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  hp: number,
  maxHp: number,
  isPlayer: boolean,
): void => {
  const percent = clampPercent(hp, maxHp);
  const barColor = isPlayer
    ? colorForHp(percent, 0x34d399, 0xfbbf24, 0xef4444)
    : colorForHp(percent, 0xfb7185, 0xf59e0b, 0xbe123c);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, 12);
  ctx.strokeRect(x, y, width, 12);
  const innerWidth = Math.max(0, width - 4);
  const fillW = Math.max(0, innerWidth * percent);
  const fillX = isPlayer ? x + 2 + innerWidth - fillW : x + 2;
  ctx.fillStyle = barColor;
  ctx.fillRect(fillX, y + 2, fillW, 8);
};

const drawUtilityButton = (
  ctx: CanvasRenderingContext2D,
  rect: EarTrainingRect,
  label: string,
): void => {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `900 15px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
};

const drawHud = (
  ctx: CanvasRenderingContext2D,
  snapshot: EarTrainingBattleSnapshot,
  runtime: EarTrainingBattleDrawRuntime,
): void => {
  const { width } = runtime;
  runtime.hudHitRegions = [];

  ctx.fillStyle = 'rgba(2, 6, 23, 0.66)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.fillRect(0, 0, width, HUD_HEIGHT);
  ctx.strokeRect(0, 0, width, HUD_HEIGHT);

  const hpLayout = getHpBarLayout(width);
  if (!snapshot.hidePlayerHpBar) {
    drawHpBar(ctx, hpLayout.leftX, 16, hpLayout.barWidth, snapshot.playerHp, snapshot.playerMaxHp, true);
    drawHpBar(ctx, hpLayout.rightX, 16, hpLayout.barWidth, snapshot.enemyHp, snapshot.enemyMaxHp, false);
  }

  if (!snapshot.timeLabelHidden) {
    ctx.fillStyle = snapshot.timeLabel === '∞' ? '#67e8f9' : '#ffffff';
    ctx.font = `900 30px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(snapshot.timeLabel, width / 2, 18);
  }

  const utilBtnW = 58;
  const utilBtnH = 36;
  const utilRightPad = 12;
  const utilGap = 10;
  const utilBackX = width - utilRightPad - utilBtnW;
  const utilSettingsX = utilBackX - utilGap - utilBtnW;
  if (!snapshot.hideSettingsButton) {
    const rect = { x: utilSettingsX, y: 56, width: utilBtnW, height: utilBtnH };
    drawUtilityButton(ctx, rect, snapshot.hudLabels.settings);
    runtime.hudHitRegions.push({ id: 'settings', rect, onClick: () => undefined });
  }
  if (!snapshot.hideBackButton) {
    const rect = { x: utilBackX, y: 56, width: utilBtnW, height: utilBtnH };
    drawUtilityButton(ctx, rect, snapshot.hudLabels.backShort);
    runtime.hudHitRegions.push({ id: 'back', rect, onClick: () => undefined });
  }

  if (!snapshot.chordHudHidden && snapshot.chords.length > 0) {
    const chordLayout = getChordHudLayout(width, snapshot);
    const chords = snapshot.chords.slice(
      chordLayout.firstVisibleIndex,
      chordLayout.firstVisibleIndex + chordLayout.visibleCount,
    );
    chords.forEach((chord, index) => {
      const x = chordLayout.startX + index * chordLayout.itemWidth;
      const boxW = chordLayout.itemWidth - 6;
      const boxH = 26;
      const boxX = x + (chordLayout.itemWidth - boxW) / 2;
      const boxY = chordLayout.y;
      ctx.fillStyle = chord.active ? '#facc15' : 'rgba(2, 6, 23, 0.72)';
      ctx.strokeStyle = chord.active ? 'rgba(254, 240, 138, 0.9)' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = chord.active ? '#020617' : '#e2e8f0';
      ctx.font = `900 13px ${HUD_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(chord.name, boxX + boxW / 2, boxY + boxH / 2);
    });
  }

  if (snapshot.practiceMode) {
    ctx.fillStyle = '#67e8f9';
    const badge = snapshot.hudLabels.practiceBadge;
    ctx.font = `900 11px ${HUD_FONT}`;
    const badgeW = ctx.measureText(badge).width + 16;
    ctx.fillRect(width / 2 + 60, 26, badgeW, 20);
    ctx.fillStyle = '#083344';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(badge, width / 2 + 68, 29);
  }

  if (!snapshot.hideMidiStatus) {
    ctx.fillStyle = snapshot.isMidiConnected ? '#bbf7d0' : '#94a3b8';
    ctx.font = `900 10px ${HUD_FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(snapshot.isMidiConnected ? 'MIDI ON' : 'MIDI OFF', 18, 64);
  }
};

const drawEnemyAttackGauge = (
  ctx: CanvasRenderingContext2D,
  snapshot: EarTrainingBattleSnapshot,
  runtime: EarTrainingBattleDrawRuntime,
): void => {
  if (snapshot.attackGaugeHidden) return;
  const pos = getEnemyAttackGaugePosition(runtime.width, runtime.height);
  const gaugeW = 120;
  const gaugeH = 18;
  const x = pos.x - gaugeW / 2;
  const y = pos.y;
  const percent = clampPercent(runtime.enemyAttackGaugePercent, 100);
  const highAlert = percent >= 0.85;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `900 10px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('ATTACK', pos.x, y - 2);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
  ctx.strokeStyle = highAlert ? 'rgba(252, 165, 165, 0.78)' : 'rgba(251, 113, 133, 0.78)';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, gaugeW, gaugeH);
  ctx.strokeRect(x, y, gaugeW, gaugeH);
  const fillW = Math.max(0, (gaugeW - 4) * percent);
  ctx.fillStyle = highAlert ? '#ef4444' : '#fb7185';
  ctx.fillRect(x + 2, y + 4, fillW, gaugeH - 8);
};

const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  runtime: EarTrainingBattleDrawRuntime,
  side: 'player' | 'enemy',
  now: number,
): void => {
  const view = side === 'player' ? runtime.player : runtime.enemy;
  updateCharacterPositions(view, now);
  const floorY = getFloorY(runtime.height);
  const x = view.x;
  const poseKey = view.poseKey && now < view.poseUntil ? view.poseKey : null;
  const poseImg = poseKey && side === 'player' ? runtime.loadedImages.get(poseKey) : null;
  const img = poseImg ?? runtime.loadedImages.get(view.avatarUrl);
  const flashAlpha = getCharacterFlashAlpha(view, now);
  const rimTint = side === 'player' ? RIM_TINT_PLAYER : RIM_TINT_ENEMY;

  ctx.save();
  ctx.translate(x, floorY + view.yOffset);
  ctx.rotate(view.rotation * Math.PI / 180);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 4 - view.yOffset, CHARACTER_SHADOW_WIDTH / 2, CHARACTER_SHADOW_HEIGHT / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (img) {
    const drawW = CHARACTER_DISPLAY_SIZE;
    const drawH = CHARACTER_DISPLAY_SIZE;
    const drawX = -drawW / 2;
    const drawY = -drawH;
    const flip = view.flipX && !poseImg;
    const rimW = drawW * RIM_SCALE;
    const rimH = drawH * RIM_SCALE;
    const rimOffsetX = (rimW - drawW) * 0.5;
    const rimOffsetY = (rimH - drawH) * 0.5;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (flip) {
      ctx.scale(-1, 1);
      drawCachedRimTint(ctx, img, -rimW / 2, drawY - rimOffsetY, rimW, rimH, rimTint, RIM_ALPHA);
    } else {
      drawCachedRimTint(ctx, img, drawX - rimOffsetX, drawY - rimOffsetY, rimW, rimH, rimTint, RIM_ALPHA);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = flashAlpha;
    drawCharacterImage(ctx, img, drawX, drawY, drawW, drawH, flip);
    if (view.tintColor && now < view.tintUntil) {
      ctx.save();
      if (flip) ctx.scale(-1, 1);
      drawTintedImageCopy(
        ctx,
        img,
        flip ? -drawW / 2 : drawX,
        drawY,
        drawW,
        drawH,
        view.tintColor,
        0.45 * flashAlpha,
      );
      ctx.restore();
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 48px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = flashAlpha;
    ctx.fillText(side === 'player' ? 'P' : 'E', 0, 0);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

const drawPhraseSlots = (
  ctx: CanvasRenderingContext2D,
  snapshot: EarTrainingBattleSnapshot,
  runtime: EarTrainingBattleDrawRuntime,
  now: number,
): void => {
  if (snapshot.phraseSlotsHidden) return;
  const viewport = getPhraseSlotViewport(runtime.width, runtime.height, snapshot);
  const slots = snapshot.phraseSlots.length > 0 ? snapshot.phraseSlots : ['_'];
  const visibleSlots = slots.slice(
    viewport.firstVisibleIndex,
    viewport.firstVisibleIndex + viewport.visibleCount,
  );
  const isCircleMode = snapshot.slotKind === 'circle';
  const pulse = 0.92 + Math.sin(now / 180) * 0.08;

  visibleSlots.forEach((slot, visibleIndex) => {
    const index = viewport.firstVisibleIndex + visibleIndex;
    const x = viewport.startX + visibleIndex * (viewport.slotSize + viewport.gap);
    const y = viewport.y;
    const isCurrent = index === snapshot.currentNoteIndex;
    const revealed = snapshot.revealedNotes[index] ?? '';
    const display = revealed || slot;
    const completed = Boolean(snapshot.chordCompleted[index]);
    const alpha = isCurrent ? pulse : 1;

    ctx.globalAlpha = alpha;
    if (isCircleMode) {
      ctx.fillStyle = completed ? 'rgba(16, 185, 129, 0.32)' : 'rgba(2, 6, 23, 0.78)';
      ctx.strokeStyle = completed ? 'rgba(167, 243, 208, 0.9)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, viewport.slotSize, viewport.slotSize);
      ctx.strokeRect(x, y, viewport.slotSize, viewport.slotSize);
      ctx.beginPath();
      ctx.arc(x + viewport.slotSize / 2, y + viewport.slotSize / 2, viewport.slotSize * 0.28, 0, Math.PI * 2);
      ctx.strokeStyle = completed ? '#34d399' : 'rgba(255, 255, 255, 0.55)';
      ctx.stroke();
    } else {
      ctx.fillStyle = isCurrent ? 'rgba(250, 204, 21, 0.95)' : 'rgba(2, 6, 23, 0.78)';
      ctx.strokeStyle = isCurrent ? 'rgba(254, 240, 138, 0.9)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, viewport.slotSize, viewport.slotSize);
      ctx.strokeRect(x, y, viewport.slotSize, viewport.slotSize);
      ctx.fillStyle = isCurrent ? '#020617' : '#e2e8f0';
      ctx.font = `900 ${Math.max(10, viewport.slotSize * 0.42)}px ${HUD_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(display, x + viewport.slotSize / 2, y + viewport.slotSize / 2);
    }
    ctx.globalAlpha = 1;
  });

  if (viewport.firstVisibleIndex > 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = `900 22px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('‹', viewport.startX - 12, viewport.y + viewport.slotSize / 2);
  }
  if (viewport.firstVisibleIndex + viewport.visibleCount < slots.length) {
    const totalWidth = visibleSlots.length * viewport.slotSize + (visibleSlots.length - 1) * viewport.gap;
    ctx.fillStyle = '#94a3b8';
    ctx.font = `900 22px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('›', viewport.startX + totalWidth + 12, viewport.y + viewport.slotSize / 2);
  }
};

const drawDemoBubble = (
  ctx: CanvasRenderingContext2D,
  snapshot: EarTrainingBattleSnapshot,
  runtime: EarTrainingBattleDrawRuntime,
): void => {
  if (!snapshot.demoLoopActive) return;
  const img = runtime.loadedImages.get(FUKIDASHI_ASSET_URL);
  const pos = getDemoBubblePosition(runtime.width, runtime.height, runtime.staffReservedBottomY);
  if (!img) return;
  const w = 112;
  const h = 84;
  ctx.globalAlpha = 0.96;
  ctx.drawImage(img, pos.x - w / 2, pos.y + 18 - h * 0.72, w, h);
  ctx.globalAlpha = 1;
};

const drawPhraseIntro = (
  ctx: CanvasRenderingContext2D,
  runtime: EarTrainingBattleDrawRuntime,
  now: number,
): void => {
  const intro = runtime.phraseIntro;
  if (!intro) return;
  const fadeMs = intro.emphasis ? PHRASE_INTRO_EMPHASIS_FADE_MS : PHRASE_INTRO_FADE_MS;
  const elapsed = now - intro.startedAt;
  if (elapsed > fadeMs) return;
  const t = elapsed / fadeMs;
  const alpha = 0.95 * (1 - easeCubicOut(t));
  const y = getPhraseIntroY(runtime.height) - (intro.emphasis ? 12 : 24) * t;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = intro.emphasis ? 7 : 5;
  ctx.font = `900 ${intro.emphasis ? 34 : 22}px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(intro.text, runtime.width / 2, y);
  ctx.fillText(intro.text, runtime.width / 2, y);
  ctx.restore();
};

const drawCountIn = (
  ctx: CanvasRenderingContext2D,
  snapshot: EarTrainingBattleSnapshot,
  runtime: EarTrainingBattleDrawRuntime,
): void => {
  if (snapshot.showLobbyControls || snapshot.gameState !== 'countIn' || snapshot.countInValue <= 0) return;
  const layout = getCountInOverlayLayout(runtime.width, runtime.height);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
  ctx.beginPath();
  ctx.arc(layout.x, layout.y, layout.radius + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.72)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(layout.x, layout.y, layout.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fde68a';
  ctx.font = `900 ${Math.round(layout.radius * 1.08)}px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(snapshot.countInValue), layout.x, layout.y + layout.radius * 0.04);
};

const drawQuoteBubble = (
  ctx: CanvasRenderingContext2D,
  quote: CanvasQuoteState,
  centerX: number,
  anchorFootY: number,
  now: number,
  staffReservedBottomY = 0,
  preferredSide: QuoteBubbleSide,
): void => {
  if (!quote.segments || quote.segments.length === 0) return;
  const measure = (text: string): number => {
    ctx.font = `bold ${quote.fontPx}px Inter, ui-sans-serif, system-ui, sans-serif`;
    return ctx.measureText(text).width;
  };
  const maxWidth = computeQuoteBubbleMaxOuterWidth(ctx.canvas.width, centerX) - PLAYER_QUOTE_PAD_X * 2;
  const lines = wrapTutorialQuoteSegmentsToLines(quote.segments, maxWidth, measure);
  const textW = maxLineRenderedWidthPx(lines, measure);
  const textH = totalQuoteLinesHeightPx(lines.length, quote.fontPx);
  const bubbleW = textW + PLAYER_QUOTE_PAD_X * 2 + (quote.showCue ? PLAYER_QUOTE_CUE_GAP_PX + quote.fontPx : 0);
  const bubbleH = textH + PLAYER_QUOTE_PAD_Y * 2;
  const placement = computeQuoteBubbleSidePlacement(
    centerX,
    anchorFootY,
    bubbleW,
    bubbleH,
    ctx.canvas.width,
    ctx.canvas.height,
    preferredSide,
    staffReservedBottomY,
  );
  const { bubbleX, bubbleY, tailSide } = placement;
  const bubbleMidY = bubbleY + bubbleH / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  drawRoundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, PLAYER_QUOTE_CORNER_RADIUS);
  ctx.fill();
  ctx.beginPath();
  if (tailSide === 'left') {
    ctx.moveTo(bubbleX, bubbleMidY - 8);
    ctx.lineTo(bubbleX, bubbleMidY + 8);
    ctx.lineTo(bubbleX - SIDE_BUBBLE_TAIL_LENGTH_PX, bubbleMidY);
  } else {
    ctx.moveTo(bubbleX + bubbleW, bubbleMidY - 8);
    ctx.lineTo(bubbleX + bubbleW, bubbleMidY + 8);
    ctx.lineTo(bubbleX + bubbleW + SIDE_BUBBLE_TAIL_LENGTH_PX, bubbleMidY);
  }
  ctx.closePath();
  ctx.fill();

  let cursorY = bubbleY + PLAYER_QUOTE_PAD_Y;
  lines.forEach(line => {
    let cursorX = bubbleX + PLAYER_QUOTE_PAD_X;
    line.forEach(run => {
      ctx.font = `bold ${quote.fontPx}px Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = run.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(run.text, cursorX, cursorY);
      cursorX += measure(run.text);
    });
    cursorY += quote.fontPx * 1.25;
  });

  if (quote.showCue) {
    const cueAlpha = 0.45 + Math.sin(now / 425) * 0.45;
    ctx.globalAlpha = cueAlpha;
    ctx.fillStyle = '#fde68a';
    ctx.font = `bold ${quote.fontPx}px Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('▶', bubbleX + bubbleW - PLAYER_QUOTE_PAD_X - quote.fontPx, bubbleY + PLAYER_QUOTE_PAD_Y);
    ctx.globalAlpha = 1;
  }
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): void => {
  const words = text.split(/\s+/);
  let line = '';
  let y = startY;
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, centerX, y);
};

const getResultLabel = (snapshot: EarTrainingBattleSnapshot): string | null => {
  if (snapshot.resultState === 'win') return snapshot.hudLabels.resultWin;
  if (snapshot.resultState === 'lose') return snapshot.hudLabels.resultLose;
  if (snapshot.resultState === 'timeOver') return snapshot.hudLabels.resultTimeOver;
  return null;
};

const getResultColor = (resultState: EarTrainingBattleSnapshot['resultState']): string => {
  if (resultState === 'win') return '#fde68a';
  if (resultState === 'timeOver') return '#bae6fd';
  return '#fecaca';
};

const drawLobbyOverlay = (
  ctx: CanvasRenderingContext2D,
  snapshot: EarTrainingBattleSnapshot,
  runtime: EarTrainingBattleDrawRuntime,
  now: number,
): void => {
  if (!snapshot.showLobbyControls) return;
  const { width, height } = runtime;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.62)';
  ctx.fillRect(0, 0, width, height);

  const rulesTrimmed = snapshot.quizRulesLine?.trim() ?? '';
  if (rulesTrimmed) {
    const rulesY = snapshot.resultState ? height * 0.42 : height * 0.34;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `700 16px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const maxW = Math.min(520, width - 48);
    wrapText(ctx, rulesTrimmed, width / 2, rulesY, maxW, 22);
  }

  const resultLabel = getResultLabel(snapshot);
  if (resultLabel) {
    ctx.fillStyle = getResultColor(snapshot.resultState);
    ctx.font = `900 34px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 6;
    ctx.strokeText(resultLabel, width / 2, height * 0.3);
    ctx.fillText(resultLabel, width / 2, height * 0.3);
  }

  if (snapshot.resultRankLine && snapshot.resultState) {
    ctx.fillStyle = '#fde68a';
    ctx.font = `900 18px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(snapshot.resultRankLine, width / 2, height * 0.38);
  }

  const modeRects = [
    { x: width / 2 - 82, y: height * 0.46, w: 76, h: 34, active: !snapshot.practiceMode, id: 'battleMode' },
    { x: width / 2 + 12, y: height * 0.46, w: 76, h: 34, active: snapshot.practiceMode, id: 'practiceMode' },
  ];
  modeRects.forEach(mode => {
    ctx.fillStyle = mode.active ? 'rgba(56, 189, 248, 0.95)' : 'rgba(2, 6, 23, 0.8)';
    ctx.strokeStyle = mode.active ? 'rgba(165, 243, 252, 0.95)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.fillRect(mode.x, mode.y, mode.w, mode.h);
    ctx.strokeRect(mode.x, mode.y, mode.w, mode.h);
    ctx.fillStyle = mode.active ? '#020617' : '#e2e8f0';
    ctx.font = `900 14px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = mode.id === 'battleMode' ? snapshot.hudLabels.battleMode : snapshot.hudLabels.practiceMode;
    ctx.fillText(label, mode.x + mode.w / 2, mode.y + mode.h / 2);
    if (snapshot.canChangePracticeMode) {
      runtime.hudHitRegions.push({
        id: mode.id,
        rect: { x: mode.x, y: mode.y, width: mode.w, height: mode.h },
        onClick: () => undefined,
      });
    }
  });

  const startW = 190;
  const startH = 66;
  const pulse = 1 + Math.sin(now / 310) * 0.04;
  const scaledW = startW * pulse;
  const scaledH = startH * pulse;
  const scaledX = width / 2 - scaledW / 2;
  const scaledY = height * 0.56 - scaledH / 2;
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.9)';
  ctx.lineWidth = 3;
  ctx.fillRect(scaledX, scaledY, scaledW, scaledH);
  ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
  ctx.fillStyle = '#020617';
  ctx.font = `900 28px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(snapshot.startButtonLabel, width / 2, height * 0.56);
  runtime.hudHitRegions.push({
    id: 'start',
    rect: { x: scaledX, y: scaledY, width: scaledW, height: scaledH },
    onClick: () => undefined,
  });

  const backW = 154;
  const backH = 40;
  const backX = width / 2 - backW / 2;
  const backY = height * 0.66 - backH / 2;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.86)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 2;
  ctx.fillRect(backX, backY, backW, backH);
  ctx.strokeRect(backX, backY, backW, backH);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `900 16px ${HUD_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(snapshot.hudLabels.lobbyBack, width / 2, height * 0.66);
  runtime.hudHitRegions.push({
    id: 'lobbyBack',
    rect: { x: backX, y: backY, width: backW, height: backH },
    onClick: () => undefined,
  });

  if (snapshot.lessonProgressText) {
    ctx.fillStyle = '#bbf7d0';
    ctx.font = `700 14px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(snapshot.lessonProgressText, width / 2, height * 0.75);
  }
};

const drawEffectSpriteFallback = (
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.42, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawEffectVisual = (
  ctx: CanvasRenderingContext2D,
  visual: CanvasEffectVisual,
  runtime: EarTrainingBattleDrawRuntime,
  now: number,
): void => {
  if (now < visual.startedAt) return;
  const t = getEffectProgress(visual, now);
  const positionEase = visual.kind === 'hammer' ? easeLinear : easeCubicIn;
  const x = lerp(visual.fromX, visual.toX, positionEase(t));
  const y = lerp(visual.fromY, visual.toY, positionEase(t));
  let size = visual.size * lerp(visual.scaleStart, visual.scaleEnd, easeCubicInOut(t));
  let alpha = visual.alpha;
  if (visual.kind === 'thinRing') {
    const expandEnd = 0.35;
    const expandT = Math.min(1, t / expandEnd);
    size = visual.size * lerp(visual.scaleStart, visual.scaleEnd, easeCubicOut(expandT));
    const fadeT = t <= expandEnd ? 0 : (t - expandEnd) / (1 - expandEnd);
    alpha = visual.alpha * (1 - easeCubicOut(fadeT));
  } else if (visual.fadeOut || visual.kind === 'magicCircle' || visual.kind === 'ring' || visual.kind === 'slash' || visual.kind === 'shockwave') {
    alpha = visual.alpha * (1 - easeCubicOut(t));
  }
  const rotation = lerp(visual.rotation, visual.rotationEnd, easeLinear(t)) * Math.PI / 180;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const img = visual.imageKey ? runtime.loadedImages.get(visual.imageKey) : null;
  const spriteKinds: CanvasEffectVisual['kind'][] = ['projectile', 'meteor', 'snowflake', 'lightning', 'cloud', 'hammer', 'magicCircle'];
  if (spriteKinds.includes(visual.kind)) {
    if (img) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      drawEffectSpriteFallback(ctx, size, visual.color || '#ff851f');
    }
  } else if (visual.kind === 'burst' || visual.kind === 'ring') {
    ctx.fillStyle = visual.color;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    if (visual.kind === 'ring') {
      ctx.strokeStyle = visual.strokeColor ?? 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (visual.kind === 'thinRing') {
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = visual.color;
    ctx.lineWidth = 5;
    ctx.stroke();
  } else if (visual.kind === 'shockwave') {
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = visual.color;
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (visual.kind === 'particle' || visual.kind === 'energyOrb' || visual.kind === 'spark') {
    const particleSize = visual.size * lerp(visual.scaleStart, visual.scaleEnd, easeCubicOut(t));
    ctx.fillStyle = visual.color;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, particleSize / 2), 0, Math.PI * 2);
    ctx.fill();
  } else if (visual.kind === 'slash') {
    const w = size * 1.9;
    const h = Math.max(5, size * 0.075);

    const gradient = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.04, 'rgba(255,255,255,0.88)');
    gradient.addColorStop(0.5, visual.color || 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.96, 'rgba(255,255,255,0.88)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(-w * 0.08, -1, w * 0.84, 2);
  }

  ctx.restore();
};

const drawEffects = (
  ctx: CanvasRenderingContext2D,
  runtime: EarTrainingBattleDrawRuntime,
  visualNow: number,
): void => {
  if (runtime.screenFlash) {
    const flashT = (visualNow - runtime.screenFlash.startedAt) / runtime.screenFlash.durationMs;
    if (flashT <= 1) {
      ctx.fillStyle = runtime.screenFlash.color.replace(/[\d.]+\)$/, `${runtime.screenFlash.alpha * (1 - flashT)})`);
      ctx.fillRect(0, 0, runtime.width, runtime.height);
    }
  }

  runtime.effects.forEach(effect => {
    effect.visuals.forEach(visual => drawEffectVisual(ctx, visual, runtime, visualNow));
  });

  runtime.floatingTexts.forEach(text => {
    const t = (visualNow - text.startedAt) / text.durationMs;
    if (t > 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - easeCubicOut(t);
    ctx.fillStyle = text.color;
    ctx.font = `900 28px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.text, text.x, text.y - t * 36);
    ctx.restore();
  });

  runtime.damageTexts.forEach(text => {
    const t = (visualNow - text.startedAt) / text.durationMs;
    if (t > 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - easeCubicOut(t);
    ctx.fillStyle = '#fecaca';
    ctx.font = `900 22px ${HUD_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.text, text.x, text.y - t * 28);
    ctx.restore();
  });
};

export const drawEarTrainingBattle = (
  ctx: CanvasRenderingContext2D,
  snapshot: EarTrainingBattleSnapshot,
  runtime: EarTrainingBattleDrawRuntime,
  now: number,
): void => {
  const { width, height } = runtime;
  ctx.clearRect(0, 0, width, height);

  const visualNow = getVisualNow(now, runtime.visualSlow);
  const cameraTransform = computeCameraTransform(runtime.camera, width, height, visualNow);
  ctx.save();
  applyWorldCameraTransform(ctx, cameraTransform);
  drawBackground(ctx, width, height, runtime);
  drawCharacter(ctx, runtime, 'player', visualNow);
  drawCharacter(ctx, runtime, 'enemy', visualNow);
  drawPhraseIntro(ctx, runtime, visualNow);
  drawEffects(ctx, runtime, visualNow);
  ctx.restore();

  drawHud(ctx, snapshot, runtime);
  drawEnemyAttackGauge(ctx, snapshot, runtime);
  const floorY = getFloorY(height);
  drawQuoteBubble(ctx, runtime.playerQuote, runtime.player.x, floorY, now, runtime.staffReservedBottomY, 'left');
  drawQuoteBubble(ctx, runtime.partnerQuote, runtime.enemy.x, floorY, now, runtime.staffReservedBottomY, 'right');
  drawDemoBubble(ctx, snapshot, runtime);
  drawPhraseSlots(ctx, snapshot, runtime, now);
  drawCountIn(ctx, snapshot, runtime);
  drawLobbyOverlay(ctx, snapshot, runtime, now);
};

export const computeStructuralSnapshotKey = (snapshot: EarTrainingBattleSnapshot): string => [
  snapshot.gameState,
  snapshot.showLobbyControls ? 1 : 0,
  snapshot.practiceMode ? 1 : 0,
  snapshot.phraseRunId,
  snapshot.playerAvatarUrl,
  snapshot.enemyAvatarUrl,
  snapshot.enemyAvatarFlipX ? 1 : 0,
  snapshot.fixedCharacterPositions ? 1 : 0,
  snapshot.resultState ?? '',
  snapshot.chordHudHidden ? 1 : 0,
  snapshot.phraseSlotsHidden ? 1 : 0,
  snapshot.attackGaugeHidden ? 1 : 0,
  snapshot.timeLabelHidden ? 1 : 0,
  snapshot.startButtonLabel,
  snapshot.quizRulesLine ?? '',
  snapshot.lessonProgressText ?? '',
  snapshot.demoLoopActive ? 1 : 0,
].join('|');

export const computeHudLayoutSnapshotKey = (
  snapshot: EarTrainingBattleSnapshot,
  width: number,
): string => {
  const chordsKey = snapshot.chords.map(chord => `${chord.id}:${chord.name}`).join(',');
  const slotsKey = snapshot.phraseSlots.join(',');
  return [
    snapshot.hidePlayerHpBar ? 1 : 0,
    snapshot.hideSettingsButton ? 1 : 0,
    snapshot.hideBackButton ? 1 : 0,
    snapshot.hideMidiStatus ? 1 : 0,
    snapshot.isMidiConnected ? 1 : 0,
    chordsKey,
    slotsKey,
    snapshot.slotKind,
    width,
  ].join('|');
};

export const computePhraseSlotViewportKey = (
  snapshot: EarTrainingBattleSnapshot,
  width: number,
): string => [
  snapshot.phraseSlots.join(','),
  snapshot.currentNoteIndex,
  snapshot.slotKind,
  snapshot.revealedNotes.join(','),
  snapshot.chordCompleted.map(v => (v ? 1 : 0)).join(''),
  width,
].join('|');

export const preloadEarTrainingBattleImages = (
  urls: readonly string[],
): Promise<Map<string, HTMLImageElement>> => {
  const map = new Map<string, HTMLImageElement>();
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(unique.map(url => new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      map.set(url, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  }))).then(() => map);
};

export const EFFECT_IMAGE_URLS: Record<string, string> = {
  fireball: `${EFFECT_ASSET_PATH}effect-fireball-transparent.webp`,
  fireRing: `${EFFECT_ASSET_PATH}effect-fire-ring-transparent.webp`,
  snowflake: `${EFFECT_ASSET_PATH}effect-snowflake-transparent.webp`,
  lightning: `${EFFECT_ASSET_PATH}effect-lightning-transparent.webp`,
  meteor: `${EFFECT_ASSET_PATH}effect-meteor-transparent.webp`,
  cloud: `${EFFECT_ASSET_PATH}effect-cloud-transparent.webp`,
  hammer: ENEMY_ATTACK_HAMMER_ASSET_URL,
  fukidashi: FUKIDASHI_ASSET_URL,
  magicCircle: MAGIC_CIRCLE_ASSET_URL,
  ...PLAYER_POSE_IMAGE_URLS,
};
