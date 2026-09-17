import type { PlayMapNode } from '@/platform/supabasePlayMap';

/** Legacy welcome quest; must not block stage unlock. */
export const DEFENSE_LEGACY_WELCOME_QUEST_ID =
  '4a0419e6-e4bb-5bdf-b39e-6ca6b3efbbcb';

export const isPlayMapProgressionGate = (node: PlayMapNode): boolean => {
  if (node.nodeKind === 'tutorial') return false;
  if (node.nodeKind === 'quest' && node.id === DEFENSE_LEGACY_WELCOME_QUEST_ID) return false;
  return true;
};

export const playMapNodeDisplayLabel = (
  node: PlayMapNode,
  stageLabel: number,
  isEnglishCopy: boolean,
): string => {
  if (node.nodeKind === 'tutorial') {
    return isEnglishCopy ? 'Intro' : '入門';
  }
  if (node.nodeKind === 'quest') return '?';
  return String(stageLabel);
};
