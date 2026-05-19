import type { PropsWithChildren } from 'react';

import { cn } from '@/utils/cn';

/**
 * 耳コピバトルを「横画面」に見せる（90° 回転）ラッパー。子は landscape 座標系（幅=短辺、高=長辺）でレイアウトする。
 */
export const EarTrainingLandscapeTutorialShell = ({ children }: PropsWithChildren) => (
  <div
    className={cn(
      'relative flex h-[100dvh] w-[100vw] items-center justify-center overflow-hidden bg-black',
    )}
  >
    <div
      className="absolute flex items-center justify-center"
      style={{
        width: '100dvh',
        height: '100vw',
        left: 'calc(50% - 50dvh)',
        top: 'calc(50% - 50vw)',
        transform: 'rotate(90deg)',
      }}
    >
      <div className="relative h-full w-full">{children}</div>
    </div>
  </div>
);
