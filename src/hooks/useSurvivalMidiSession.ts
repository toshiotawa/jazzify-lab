import type { GameMidiBindings } from '@/hooks/useGameMidiSession';
import { useGameMidiSession } from '@/hooks/useGameMidiSession';

export type SurvivalMidiBindings = GameMidiBindings;

export const useSurvivalMidiSession = (): SurvivalMidiBindings => useGameMidiSession('survival');
