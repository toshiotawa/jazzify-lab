export const CODE_RUN_JOYSTICK_OUTER_RADIUS = 64;
export const CODE_RUN_JOYSTICK_INNER_RADIUS = 28;
export const CODE_RUN_JOYSTICK_DEAD_NORM = 0.18;

export interface CodeRunJoystickVector {
  readonly dx: number;
  readonly dy: number;
}

export const computeCodeRunJoystickVector = (
  originX: number,
  originY: number,
  pointerX: number,
  pointerY: number,
  outerRadius: number = CODE_RUN_JOYSTICK_OUTER_RADIUS,
  deadNorm: number = CODE_RUN_JOYSTICK_DEAD_NORM,
): CodeRunJoystickVector => {
  const dxPx = pointerX - originX;
  const dyPx = pointerY - originY;
  const distance = Math.hypot(dxPx, dyPx);
  if (distance <= 0 || outerRadius <= 0) {
    return { dx: 0, dy: 0 };
  }
  const clampedDistance = Math.min(distance, outerRadius);
  const normX = dxPx / outerRadius;
  const normY = dyPx / outerRadius;
  const magnitude = clampedDistance / outerRadius;
  const deadApplied = magnitude <= deadNorm ? 0 : (magnitude - deadNorm) / (1 - deadNorm);
  if (deadApplied <= 0) {
    return { dx: 0, dy: 0 };
  }
  const angle = Math.atan2(normY, normX);
  return {
    dx: Math.cos(angle) * deadApplied,
    dy: Math.sin(angle) * deadApplied,
  };
};
