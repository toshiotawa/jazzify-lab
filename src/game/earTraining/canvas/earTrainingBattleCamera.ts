import { easeCubicInOut, easeCubicOut, easeSineInOut } from './earTrainingBattleDrawState';

export interface CameraShakeState {
  startedAt: number;
  durationMs: number;
  amplitude: number;
}

export interface CameraZoomState {
  startedAt: number;
  focusX: number;
  focusY: number;
  centerX: number;
  centerY: number;
  panInMs: number;
  holdMs: number;
  returnMs: number;
  zoomTarget: number;
}

export interface CanvasCameraRuntime {
  shake: CameraShakeState | null;
  zoom: CameraZoomState | null;
}

export const createCameraRuntime = (): CanvasCameraRuntime => ({
  shake: null,
  zoom: null,
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

export const triggerZoomToPlayer = (
  camera: CanvasCameraRuntime,
  focusX: number,
  focusY: number,
  centerX: number,
  centerY: number,
  holdMs: number,
): void => {
  camera.zoom = {
    startedAt: performance.now(),
    focusX,
    focusY,
    centerX,
    centerY,
    panInMs: 180,
    holdMs,
    returnMs: 340,
    zoomTarget: 1.98,
  };
};

export const triggerParryCameraZoom = (
  camera: CanvasCameraRuntime,
  focusX: number,
  focusY: number,
  centerX: number,
  centerY: number,
): void => {
  camera.zoom = {
    startedAt: performance.now(),
    focusX,
    focusY,
    centerX,
    centerY,
    panInMs: 20,
    holdMs: 0,
    returnMs: 80,
    zoomTarget: 1.045,
  };
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

  if (camera.zoom) {
    const zoom = camera.zoom;
    const elapsed = now - zoom.startedAt;
    const panInEnd = zoom.panInMs;
    const holdEnd = panInEnd + zoom.holdMs;
    const returnEnd = holdEnd + zoom.returnMs;

    if (elapsed >= returnEnd) {
      camera.zoom = null;
    } else if (elapsed < panInEnd) {
      const t = easeSineInOut(elapsed / panInEnd);
      scratchTransform.focusX = zoom.centerX + (zoom.focusX - zoom.centerX) * t;
      scratchTransform.focusY = zoom.centerY + (zoom.focusY - zoom.centerY) * t;
      scratchTransform.scale = 1 + (zoom.zoomTarget - 1) * easeCubicOut(elapsed / panInEnd);
    } else if (elapsed < holdEnd) {
      scratchTransform.focusX = zoom.focusX;
      scratchTransform.focusY = zoom.focusY;
      scratchTransform.scale = zoom.zoomTarget;
    } else {
      const returnT = (elapsed - holdEnd) / zoom.returnMs;
      const t = easeSineInOut(returnT);
      scratchTransform.focusX = zoom.focusX + (zoom.centerX - zoom.focusX) * t;
      scratchTransform.focusY = zoom.focusY + (zoom.centerY - zoom.focusY) * t;
      scratchTransform.scale = zoom.zoomTarget + (1 - zoom.zoomTarget) * easeCubicInOut(returnT);
    }
  }

  return scratchTransform;
};

export const isCameraActive = (
  camera: CanvasCameraRuntime,
  now: number,
): boolean => {
  if (camera.shake && now - camera.shake.startedAt < camera.shake.durationMs) {
    return true;
  }
  if (camera.zoom) {
    const zoom = camera.zoom;
    const elapsed = now - zoom.startedAt;
    return elapsed < zoom.panInMs + zoom.holdMs + zoom.returnMs;
  }
  return false;
};

export const applyWorldCameraTransform = (
  ctx: CanvasRenderingContext2D,
  transform: CameraTransform,
): void => {
  ctx.translate(transform.focusX + transform.offsetX, transform.focusY + transform.offsetY);
  ctx.scale(transform.scale, transform.scale);
  ctx.translate(-transform.focusX, -transform.focusY);
};
