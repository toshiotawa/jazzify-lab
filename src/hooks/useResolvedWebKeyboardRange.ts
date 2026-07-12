import { useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
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

  return useMemo(
    () => resolveWebKeyboardDisplayRange(noteMidis, displayMode),
    [displayMode, noteMidis],
  );
};
