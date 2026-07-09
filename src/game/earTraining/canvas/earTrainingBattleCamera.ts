import { easeCubicOut } from './earTrainingBattleDrawState';

export interface CameraShakeState {
  startedAt: number;
  durationMs: number;
  amplitude: number;
}

export interface CanvasCameraRuntime {
  shake: CameraShakeState | null;
}

export const createCameraRuntime = (): CanvasCameraRuntime => ({
  shake: null,
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

  return scratchTransform;
};

export const isCameraActive = (
  camera: CanvasCameraRuntime,
  now: number,
): boolean => (
  camera.shake !== null
  && now - camera.shake.startedAt < camera.shake.durationMs
);

export const applyWorldCameraTransform = (
  ctx: CanvasRenderingContext2D,
  transform: CameraTransform,
): void => {
  ctx.translate(transform.focusX + transform.offsetX, transform.focusY + transform.offsetY);
  ctx.scale(transform.scale, transform.scale);
  ctx.translate(-transform.focusX, -transform.focusY);
};
