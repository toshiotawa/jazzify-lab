import React from 'react';
import { cn } from '@/utils/cn';

export type EarTutorialDialogPlacement =
  | 'default'
  | 'belowChordHud'
  | 'belowVoicingPhraseSlots'
  | 'dialogueIntroUpperCenter';

interface OnboardingOverlaysProps {
  characterText: string;
  narrationText: string;
  connectedDeviceLine: string | null;
  showPillarCard: boolean;
  pillarCaption: string | null;
  pillarSystemImage: string | null;
  showCta: boolean;
  showSkip: boolean;
  isEnglishCopy: boolean;
  onCta: () => void;
  onSkip: () => void;
  ctaLabel?: string;
  /** 耳コピチュートリアルなど。既定は従来の中央付近。 */
  earTutorialDialogPlacement?: EarTutorialDialogPlacement;
  /** `belowVoicingPhraseSlots` 用のコード数近似。 */
  earTutorialVoicingSlotCount?: number;
}

function pillarEmoji(systemImage: string | null): string {
  if (systemImage === 'music.note.list') return '🎵';
  if (systemImage === 'metronome') return '⏱️';
  return '〰️';
}

const estimateVoicingSlotBandPx = (slotCount: number, viewportShortEdgePx: number): number => {
  const avail = Math.min(viewportShortEdgePx * 0.52, 260);
  const count = Math.max(1, slotCount);
  const gaps = Math.max(0, count - 1) * 6;
  const slotSize = Math.max(34, Math.floor((avail - gaps) / count));
  return slotSize + 6;
};

/**
 * LP オンボーディング / 耳コピチュートリアル共通。セリフ吹き出し位置は `earTutorialDialogPlacement` で切替。
 */
export const OnboardingOverlays: React.FC<OnboardingOverlaysProps> = ({
  characterText,
  narrationText,
  connectedDeviceLine,
  showPillarCard,
  pillarCaption,
  pillarSystemImage,
  showCta,
  showSkip,
  isEnglishCopy,
  onCta,
  onSkip,
  ctaLabel,
  earTutorialDialogPlacement = 'default',
  earTutorialVoicingSlotCount = 4,
}) => {
  const viewportShortEdgePx =
    typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) : 400;
  const tutorialPlacement =
    characterText !== '' && earTutorialDialogPlacement !== 'default'
      ? earTutorialDialogPlacement
      : undefined;

  const characterOuterStyle = ((): React.CSSProperties => {
    if (!tutorialPlacement) {
      return {
        top: 'max(70px, min(max(86px, calc(50% - 92px)), calc(100% - 240px)))',
      };
    }
    if (tutorialPlacement === 'belowChordHud') {
      return {
        top: '72px',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translateX(-50%)',
      };
    }
    if (tutorialPlacement === 'belowVoicingPhraseSlots') {
      const bandPx = estimateVoicingSlotBandPx(earTutorialVoicingSlotCount, viewportShortEdgePx);
      const bottomLiftPx = 80 + bandPx + 54 + 14;
      return {
        bottom: `${bottomLiftPx}px`,
        top: 'auto',
        left: '50%',
        right: 'auto',
        transform: 'translateX(-50%)',
      };
    }
    return {
      top: 'max(56px, 22vh)',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translateX(-50%)',
    };
  })();

  const characterWidthClass =
    tutorialPlacement !== undefined
      ? 'w-[min(300px,calc(100vw-32px))]'
      : 'w-[min(380px,calc(100vw-32px))]';
  const characterInnerTypographyClass =
    tutorialPlacement !== undefined
      ? 'text-xs leading-snug'
      : 'text-sm';

  return (
  <>
    {characterText ? (
      <div
        className={cn(
          'pointer-events-none absolute z-30 px-4',
          tutorialPlacement !== undefined ? 'left-1/2' : 'inset-x-0',
        )}
        style={characterOuterStyle}
      >
        <div className={cn('mx-auto flex flex-col items-center', characterWidthClass, '-translate-y-1/2')}>
          <div
            className={cn(
              'w-full rounded-[12px] border border-white/25 bg-black/80 px-3 py-2.5 text-center font-bold text-white shadow-lg',
              characterInnerTypographyClass,
            )}
          >
            {characterText.split('\n').map((line, i) => (
              <span key={`${i}-${line}`}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </div>
          <div
            className="h-0 w-0 border-x-[12px] border-t-[12px] border-x-transparent border-t-black/80"
            aria-hidden
          />
        </div>
      </div>
    ) : null}

    {connectedDeviceLine ? (
      <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center">
        <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">
          {connectedDeviceLine}
        </span>
      </div>
    ) : null}

    {narrationText ? (
      <div className="pointer-events-none absolute inset-x-0 bottom-[200px] z-30 flex justify-center px-5">
        <p className="max-w-lg whitespace-pre-line rounded-xl bg-black/55 px-4 py-4 text-center text-sm text-slate-200">
          {narrationText}
        </p>
      </div>
    ) : null}

    {showPillarCard && pillarCaption ? (
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-purple-400/40 bg-slate-900/95 p-6 text-center">
          <span className="text-4xl" aria-hidden>
            {pillarEmoji(pillarSystemImage)}
          </span>
          <p className="text-base font-semibold text-white">{pillarCaption}</p>
        </div>
      </div>
    ) : null}

    {showCta ? (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
        <button
          type="button"
          onClick={onCta}
          className="rounded-xl bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-purple-500"
        >
          {ctaLabel ?? (isEnglishCopy ? 'Continue' : '続ける')}
        </button>
      </div>
    ) : null}

    {showSkip ? (
      <button
        type="button"
        onClick={onSkip}
        className="absolute right-3 top-[max(8px,env(safe-area-inset-top))] z-50 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white/90 hover:bg-black/70"
      >
        {isEnglishCopy ? 'Skip' : 'スキップ'}
      </button>
    ) : null}
  </>
);
};