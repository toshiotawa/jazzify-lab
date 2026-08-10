import React, { useCallback, useRef, useState } from 'react';
import {
  CODE_RUN_JOYSTICK_INNER_RADIUS,
  CODE_RUN_JOYSTICK_OUTER_RADIUS,
  computeCodeRunJoystickVector,
} from '@/utils/codeRunJoystick';

interface CodeRunVirtualStickProps {
  onAnalogChange: (value: number) => void;
  disabled?: boolean;
}

interface StickState {
  readonly originX: number;
  readonly originY: number;
  readonly knobX: number;
  readonly knobY: number;
}

const CodeRunVirtualStick: React.FC<CodeRunVirtualStickProps> = ({
  onAnalogChange,
  disabled = false,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [stick, setStick] = useState<StickState | null>(null);
  const activePointerRef = useRef<number | null>(null);

  const release = useCallback(() => {
    activePointerRef.current = null;
    setStick(null);
    onAnalogChange(0);
  }, [onAnalogChange]);

  const updateFromPointer = useCallback((clientX: number, clientY: number, originX: number, originY: number) => {
    const vector = computeCodeRunJoystickVector(originX, originY, clientX, clientY);
    const knobDistance = Math.min(
      CODE_RUN_JOYSTICK_OUTER_RADIUS,
      Math.hypot(clientX - originX, clientY - originY),
    );
    const angle = Math.atan2(clientY - originY, clientX - originX);
    setStick({
      originX,
      originY,
      knobX: Math.cos(angle) * knobDistance,
      knobY: Math.sin(angle) * knobDistance,
    });
    onAnalogChange(vector.dx);
  }, [onAnalogChange]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    const originX = event.clientX - rect.left;
    const originY = event.clientY - rect.top;
    updateFromPointer(event.clientX, event.clientY, originX, originY);
  }, [disabled, updateFromPointer]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerRef.current !== event.pointerId || !stick) return;
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateFromPointer(event.clientX, event.clientY, stick.originX, stick.originY);
  }, [disabled, stick, updateFromPointer]);

  return (
    <div
      ref={padRef}
      className="absolute inset-0 z-10 touch-none md:hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      aria-hidden
    >
      {stick && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: stick.originX - CODE_RUN_JOYSTICK_OUTER_RADIUS,
            top: stick.originY - CODE_RUN_JOYSTICK_OUTER_RADIUS,
            width: CODE_RUN_JOYSTICK_OUTER_RADIUS * 2,
            height: CODE_RUN_JOYSTICK_OUTER_RADIUS * 2,
          }}
        >
          <div className="absolute inset-0 rounded-full border border-white/20 bg-white/10" />
          <div
            className="absolute rounded-full border border-white/30 bg-white/80 shadow-lg"
            style={{
              width: CODE_RUN_JOYSTICK_INNER_RADIUS * 2,
              height: CODE_RUN_JOYSTICK_INNER_RADIUS * 2,
              left: CODE_RUN_JOYSTICK_OUTER_RADIUS - CODE_RUN_JOYSTICK_INNER_RADIUS + stick.knobX,
              top: CODE_RUN_JOYSTICK_OUTER_RADIUS - CODE_RUN_JOYSTICK_INNER_RADIUS + stick.knobY,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CodeRunVirtualStick;
