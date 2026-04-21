import React, { useEffect, useState } from 'react';
import { FaMobileAlt, FaSyncAlt } from 'react-icons/fa';

interface OrientationLandscapePromptProps {
  isEnglishCopy?: boolean;
}

const MOBILE_WIDTH_QUERY = '(max-width: 767px)';
const PORTRAIT_QUERY = '(orientation: portrait)';

const readInitialIsMobilePortrait = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.matchMedia(MOBILE_WIDTH_QUERY).matches &&
      window.matchMedia(PORTRAIT_QUERY).matches
    );
  } catch {
    return false;
  }
};

const OrientationLandscapePrompt: React.FC<OrientationLandscapePromptProps> = ({
  isEnglishCopy = false,
}) => {
  const [isMobilePortrait, setIsMobilePortrait] = useState<boolean>(readInitialIsMobilePortrait);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const widthMq = window.matchMedia(MOBILE_WIDTH_QUERY);
    const orientMq = window.matchMedia(PORTRAIT_QUERY);

    const update = (): void => {
      setIsMobilePortrait(widthMq.matches && orientMq.matches);
    };

    update();

    const subscribe = (mq: MediaQueryList): (() => void) => {
      try {
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
      } catch {
        mq.addListener(update);
        return () => mq.removeListener(update);
      }
    };

    const unsubWidth = subscribe(widthMq);
    const unsubOrient = subscribe(orientMq);

    return () => {
      unsubWidth();
      unsubOrient();
    };
  }, []);

  if (!isMobilePortrait) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEnglishCopy ? 'Please rotate your device' : 'デバイスを横向きにしてください'}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0a0618] via-[#120a26] to-[#05030e] px-6 text-center text-white"
      style={{ touchAction: 'none' }}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute h-28 w-28 rounded-full bg-purple-500/20 blur-2xl" aria-hidden />
        <FaMobileAlt
          aria-hidden
          className="text-6xl text-purple-200"
          style={{
            animation: 'orientation-rotate 2.2s ease-in-out infinite',
            transformOrigin: '50% 50%',
          }}
        />
        <FaSyncAlt
          aria-hidden
          className="absolute -right-8 -top-2 text-2xl text-amber-300"
          style={{ animation: 'orientation-spin 2.2s linear infinite' }}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-wide text-amber-100 sm:text-2xl">
          {isEnglishCopy ? 'Please rotate to landscape' : '画面を横向きにしてください'}
        </h2>
        <p className="text-sm leading-relaxed text-violet-100/80 sm:text-base">
          {isEnglishCopy
            ? 'This map is best viewed in landscape orientation.'
            : 'このマップは横向き画面で最適に表示されます。'}
        </p>
      </div>

      <style>{`
        @keyframes orientation-rotate {
          0%, 20% { transform: rotate(0deg); }
          50%, 70% { transform: rotate(-90deg); }
          100% { transform: rotate(-90deg); }
        }
        @keyframes orientation-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OrientationLandscapePrompt;
