import type { DefenseStaffLayout } from '@/game/defense/defenseTypes';
import {
  notationClefStaffNumber,
  type NotationInstrumentClef,
} from '@/utils/notationInstrument';

export const resolveDefenseDisplayStaves = (
  clef: NotationInstrumentClef,
  staffLayout: DefenseStaffLayout,
): readonly (1 | 2)[] => {
  const staff = notationClefStaffNumber(clef);
  if (staff) {
    return [staff];
  }
  return staffLayout === 'grand' ? [1, 2] : [1];
};
