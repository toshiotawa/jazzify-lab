import { easeCubicOut } from './earTrainingBattleDrawState';

export interface CameraShakeState {
  startedAt: number;
  durationMs: number;
  amplitude: number;
}

export interface CameraPunchZoomState {
  startedAt: number;
  inMs: number;
  holdMs: number;
  outMs: number;
  targetScale: number;
  focusX: number;
  focusY: number;
}

export interface CanvasCameraRuntime {
  shake: CameraShakeState | null;
  punchZoom: CameraPunchZoomState | null;
}

export const createCameraRuntime = (): CanvasCameraRuntime => ({
  shake: null,
  punchZoom: null,
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

export const triggerFinishPunchZoom = (
  camera: CanvasCameraRuntime,
  focusX: number,
  focusY: number,
  targetScale = 1.1,
): void => {
  camera.punchZoom = {
    startedAt: performance.now(),
    inMs: 64,
    holdMs: 48,
    outMs: 160,
    targetScale,
    focusX,
    focusY,
  };
};

const resolvePunchZoomScale = (zoom: CameraPunchZoomState, now: number): number => {
  const elapsed = now - zoom.startedAt;
  if (elapsed < zoom.inMs) {
    const t = elapsed / zoom.inMs;
    return 1 + (zoom.targetScale - 1) * easeCubicOut(t);
  }
  const holdEnd = zoom.inMs + zoom.holdMs;
  if (elapsed < holdEnd) {
    return zoom.targetScale;
  }
  const outElapsed = elapsed - holdEnd;
  if (outElapsed < zoom.outMs) {
    const t = outElapsed / zoom.outMs;
    return zoom.targetScale + (1 - zoom.targetScale) * easeCubicOut(t);
  }
  return 1;
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

  if (camera.punchZoom) {
    const elapsed = now - camera.punchZoom.startedAt;
    const totalMs = camera.punchZoom.inMs + camera.punchZoom.holdMs + camera.punchZoom.outMs;
    if (elapsed < totalMs) {
      scratchTransform.scale = resolvePunchZoomScale(camera.punchZoom, now);
      scratchTransform.focusX = camera.punchZoom.focusX;
      scratchTransform.focusY = camera.punchZoom.focusY;
    } else {
      camera.punchZoom = null;
    }
  }

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

  return scratchTransform;
};

export const isCameraActive = (
  camera: CanvasCameraRuntime,
  now: number,
): boolean => {
  const shakeActive = camera.shake !== null
    && now - camera.shake.startedAt < camera.shake.durationMs;
  const zoomActive = camera.punchZoom !== null
    && now - camera.punchZoom.startedAt
      < camera.punchZoom.inMs + camera.punchZoom.holdMs + camera.punchZoom.outMs;
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
