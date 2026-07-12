import { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { resolveCurrentSignupDeviceContext } from '@/utils/analytics/deviceContext';
import {
  DEFAULT_WEB_KEYBOARD_DISPLAY_MODE,
  resolveWebKeyboardDisplayRange,
  type WebKeyboardRange,
} from '@/utils/webKeyboardDisplayRange';

export const useResolvedWebKeyboardRange = (
  noteMidis: readonly number[],
): WebKeyboardRange => {
  const displayMode = useGameStore(
    state => state.settings.webKeyboardDisplayMode ?? DEFAULT_WEB_KEYBOARD_DISPLAY_MODE,
  );
  const ensureMinTwoOctaves = useMemo(() => {
    const { signup_device_category: category } = resolveCurrentSignupDeviceContext();
    return category !== 'mobile';
  }, []);

  return useMemo(
    () => resolveWebKeyboardDisplayRange(noteMidis, displayMode, { ensureMinTwoOctaves }),
    [displayMode, ensureMinTwoOctaves, noteMidis],
  );
};
