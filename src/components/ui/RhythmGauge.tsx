import React, { useMemo } from 'react'
import clsx from 'clsx'

interface RhythmGaugeProps {
  /** 0-1 の進捗率 */
  progress: number
  className?: string
}

/**
 * リズムモード用ゲージ。
 * 判定ウィンドウを UI として視覚化する際に使用する。
 * 80% 位置にマーカー線を描画。
 */
export const RhythmGauge: React.FC<RhythmGaugeProps> = ({ progress, className }) => {
  const clamped = useMemo(() => Math.max(0, Math.min(progress, 1)), [progress])
  return (
    <div className={clsx('relative h-2 w-full bg-gray-300 rounded', className)}>
      <div
        className="absolute top-0 h-2 bg-green-500 rounded"
        style={{ width: `${clamped * 100}%` }}
      />
      {/* 80% マーカー */}
      <div
        className="absolute top-0 h-2 w-0.5 bg-red-500"
        style={{ left: '80%' }}
      />
    </div>
  )
}
