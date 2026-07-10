import {
  easeCubicOut,
  PARRY_ZOOM_TARGET,
} from './earTrainingBattleDrawState';
import {
  resolveParryZoomScaleAtPhraseSec,
  resolvePhraseSecFromPerfAnchor,
} from './earTrainingBattleBeatSyncTiming';

export interface CameraShakeState {
  startedAt: number;
  durationMs: number;
  amplitude: number;
}

export interface ParryPhraseZoomState {
  anchorPhraseSec: number;
  zoomOutPhraseSec: number;
  hitPerfMs: number;
  focusX: number;
  focusY: number;
  centerX: number;
  centerY: number;
  zoomTarget: number;
}

export interface CanvasCameraRuntime {
  shake: CameraShakeState | null;
  parryZoom: ParryPhraseZoomState | null;
}

export const createCameraRuntime = (): CanvasCameraRuntime => ({
  shake: null,
  parryZoom: null,
});

const shakeNoise = (seed: number): number => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export const triggerCameraShake = (
  camera: CanvasCameraRuntime,
  amplitude: number,
  durationMs: number,
): void => {
  camera.shake = {
    startedAt: performance.now(),
    durationMs,
    amplitude,
  };
};

export interface TriggerParryPhraseZoomParams {
  anchorPhraseSec: number;
  zoomOutPhraseSec: number;
  hitPerfMs: number;
  focusX: number;
  focusY: number;
  centerX: number;
  centerY: number;
  zoomTarget?: number;
}

export const triggerParryPhraseZoom = (
  camera: CanvasCameraRuntime,
  params: TriggerParryPhraseZoomParams,
): void => {
  camera.parryZoom = {
    anchorPhraseSec: params.anchorPhraseSec,
    zoomOutPhraseSec: params.zoomOutPhraseSec,
    hitPerfMs: params.hitPerfMs,
    focusX: params.focusX,
    focusY: params.focusY,
    centerX: params.centerX,
    centerY: params.centerY,
    zoomTarget: params.zoomTarget ?? PARRY_ZOOM_TARGET,
  };
};

export const clearParryZoom = (camera: CanvasCameraRuntime): void => {
  camera.parryZoom = null;
};

export interface CameraTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  focusX: number;
  focusY: number;
}

const scratchTransform: CameraTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  focusX: 0,
  focusY: 0,
};

const applyParryZoomTransform = (
  zoom: ParryPhraseZoomState,
  now: number,
): void => {
  const currentPhraseSec = resolvePhraseSecFromPerfAnchor(
    zoom.anchorPhraseSec,
    zoom.hitPerfMs,
    now,
  );
  const scale = resolveParryZoomScaleAtPhraseSec(currentPhraseSec, {
    anchorPhraseSec: zoom.anchorPhraseSec,
    zoomOutPhraseSec: zoom.zoomOutPhraseSec,
    zoomTarget: zoom.zoomTarget,
  });
  if (scale <= 1 + 1e-6) {
    return;
  }
  const zoomT = (scale - 1) / Math.max(1e-6, zoom.zoomTarget - 1);
  scratchTransform.focusX = zoom.centerX + (zoom.focusX - zoom.centerX) * zoomT;
  scratchTransform.focusY = zoom.centerY + (zoom.focusY - zoom.centerY) * zoomT;
  scratchTransform.scale = scale;
};

export const computeCameraTransform = (
  camera: CanvasCameraRuntime,
  width: number,
  height: number,
  now: number,
): CameraTransform => {
  const centerX = width / 2;
  const centerY = height / 2;
  scratchTransform.offsetX = 0;
  scratchTransform.offsetY = 0;
  scratchTransform.scale = 1;
  scratchTransform.focusX = centerX;
  scratchTransform.focusY = centerY;

  if (camera.shake) {
    const elapsed = now - camera.shake.startedAt;
    if (elapsed < camera.shake.durationMs) {
      const stepIndex = Math.floor(elapsed / 40);
      const t = elapsed / camera.shake.durationMs;
      const decay = 1 - easeCubicOut(t);
      const amp = camera.shake.amplitude * decay;
      scratchTransform.offsetX = (shakeNoise(stepIndex) * 2 - 1) * amp;
      scratchTransform.offsetY = (shakeNoise(stepIndex + 17) * 2 - 1) * amp;
    } else {
      camera.shake = null;
    }
  }

  if (camera.parryZoom) {
    const currentPhraseSec = resolvePhraseSecFromPerfAnchor(
      camera.parryZoom.anchorPhraseSec,
      camera.parryZoom.hitPerfMs,
      now,
    );
    if (currentPhraseSec >= camera.parryZoom.zoomOutPhraseSec - 1e-6) {
      camera.parryZoom = null;
    } else {
      applyParryZoomTransform(camera.parryZoom, now);
    }
  }

  return scratchTransform;
};

export const isCameraActive = (
  camera: CanvasCameraRuntime,
  now: number,
): boolean => {
  const shakeActive = camera.shake !== null
    && now - camera.shake.startedAt < camera.shake.durationMs;
  const zoomActive = camera.parryZoom !== null
    && resolvePhraseSecFromPerfAnchor(
      camera.parryZoom.anchorPhraseSec,
      camera.parryZoom.hitPerfMs,
      now,
    ) < camera.parryZoom.zoomOutPhraseSec - 1e-6;
  return shakeActive || zoomActive;
};

export const applyWorldCameraTransform = (
  ctx: CanvasRenderingContext2D,
  transform: CameraTransform,
): void => {
  ctx.translate(transform.focusX + transform.offsetX, transform.focusY + transform.offsetY);
  ctx.scale(transform.scale, transform.scale);
  ctx.translate(-transform.focusX, -transform.focusY);
};
