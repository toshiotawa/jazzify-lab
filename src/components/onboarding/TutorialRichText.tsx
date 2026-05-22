import React from 'react';

import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';

interface TutorialRichTextProps {
  readonly segments: readonly TutorialResolvedTextSegment[];
  readonly className?: string;
}

/**
 * チュートリアル吹き出し本文。`\n` は改行、`segments` で色分割。
 */
export const TutorialRichText: React.FC<TutorialRichTextProps> = ({ segments, className }) => {
  if (segments.length === 0) {
    return null;
  }
  return (
    <span className={className}>
      {segments.map((seg, i) => (
        <span key={`${i}-${seg.text.slice(0, 8)}`} style={{ color: seg.color }}>
          {seg.text.split('\n').map((line, li) => (
            <React.Fragment key={li}>
              {li > 0 ? <br /> : null}
              {line}
            </React.Fragment>
          ))}
        </span>
      ))}
    </span>
  );
};
