import {
  computeCodeRunJoystickVector,
  CODE_RUN_JOYSTICK_DEAD_NORM,
  CODE_RUN_JOYSTICK_OUTER_RADIUS,
} from '@/utils/codeRunJoystick';

describe('computeCodeRunJoystickVector', () => {
  it('returns zero inside dead zone', () => {
    const v = computeCodeRunJoystickVector(0, 0, 5, 0);
    expect(v.dx).toBe(0);
    expect(v.dy).toBe(0);
  });

  it('returns horizontal analog when dragged right', () => {
    const v = computeCodeRunJoystickVector(
      0,
      0,
      CODE_RUN_JOYSTICK_OUTER_RADIUS,
      0,
    );
    expect(v.dx).toBeGreaterThan(0.9);
    expect(Math.abs(v.dy)).toBeLessThan(0.01);
  });

  it('clamps to outer radius', () => {
    const v = computeCodeRunJoystickVector(0, 0, 500, 0);
    expect(v.dx).toBeLessThanOrEqual(1);
    expect(v.dx).toBeGreaterThan(0.9);
  });

  it('applies dead zone before scaling', () => {
    const insideDead = CODE_RUN_JOYSTICK_OUTER_RADIUS * CODE_RUN_JOYSTICK_DEAD_NORM * 0.5;
    const v = computeCodeRunJoystickVector(0, 0, insideDead, 0);
    expect(v.dx).toBe(0);
  });
});
