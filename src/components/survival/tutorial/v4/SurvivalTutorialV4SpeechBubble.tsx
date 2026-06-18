import React from 'react';

import {
  EAR_TRAINING_PARTNER_JAJII_AVATAR_URL,
  EAR_TRAINING_PLAYER_AVATAR_URL,
  earTrainingPartnerJajiiDisplayName,
} from '@/utils/earTrainingBattleAvatar';
import { cn } from '@/utils/cn';
import type { SurvivalTutorialV3DialogueSpeaker } from '../survivalTutorialV3ScriptTypes';

export interface SurvivalTutorialV4SpeechBubbleProps {
  readonly speaker: SurvivalTutorialV3DialogueSpeaker;
  readonly text: string;
  readonly isEnglishCopy: boolean;
}

const faiName = (isEnglishCopy: boolean): string => (isEnglishCopy ? 'Fai' : 'ファイ');

export const SurvivalTutorialV4SpeechBubble: React.FC<SurvivalTutorialV4SpeechBubbleProps> = ({
  speaker,
  text,
  isEnglishCopy,
}) => {
  if (text.trim().length === 0) return null;

  if (speaker === 'narration') {
    return (
      <div className="mx-auto max-w-[80%] rounded-lg bg-black/70 px-4 py-3 text-center text-sm text-white/90">
        {text}
      </div>
    );
  }

  const isJajii = speaker === 'jajii';
  const avatarUrl = isJajii
    ? EAR_TRAINING_PARTNER_JAJII_AVATAR_URL
    : EAR_TRAINING_PLAYER_AVATAR_URL;
  const name = isJajii ? earTrainingPartnerJajiiDisplayName(isEnglishCopy) : faiName(isEnglishCopy);

  return (
    <div
      className={cn(
        'flex w-full max-w-[92%] items-end gap-3',
        isJajii ? 'mr-auto flex-row' : 'ml-auto flex-row-reverse',
      )}
    >
      <img
        src={avatarUrl}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-full border border-white/20 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-xs font-semibold text-white/70">{name}</div>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed text-white shadow-lg',
            isJajii ? 'bg-indigo-700/80' : 'bg-emerald-700/80',
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
