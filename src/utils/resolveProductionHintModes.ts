import type { ProductionHintMode, ResolvedProductionHintModes } from '@/types';

const VALID_MODES: readonly ProductionHintMode[] = [
  'fade_15s',
  'always',
  'hidden_until_pressed',
];

export const DEFAULT_PRODUCTION_HINT_MODE: ProductionHintMode = 'fade_15s';

export const parseProductionHintMode = (
  value: unknown,
  fallback: ProductionHintMode = DEFAULT_PRODUCTION_HINT_MODE,
): ProductionHintMode => {
  if (typeof value === 'string' && (VALID_MODES as readonly string[]).includes(value)) {
    return value as ProductionHintMode;
  }
  return fallback;
};

export interface ResolveProductionHintModesInput {
  readonly stageStaffMode?: ProductionHintMode | string | null;
  readonly stageKeyboardMode?: ProductionHintMode | string | null;
  readonly lessonOverrideStaff?: ProductionHintMode | string | null;
  readonly lessonOverrideKeyboard?: ProductionHintMode | string | null;
}

export const resolveProductionHintModes = (
  input: ResolveProductionHintModesInput,
): ResolvedProductionHintModes => {
  const stageStaff = parseProductionHintMode(input.stageStaffMode);
  const stageKeyboard = parseProductionHintMode(input.stageKeyboardMode);
  return {
    staffHintMode: input.lessonOverrideStaff != null
      ? parseProductionHintMode(input.lessonOverrideStaff, stageStaff)
      : stageStaff,
    keyboardHintMode: input.lessonOverrideKeyboard != null
      ? parseProductionHintMode(input.lessonOverrideKeyboard, stageKeyboard)
      : stageKeyboard,
  };
};
