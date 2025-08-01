import React from 'react'
import { useTimeStore } from '@/stores/timeStore'
import { RhythmGauge } from './RhythmGauge'

interface RhythmStageHUDProps {
  gaugeProgress: number
}

/**
 * 上部ヘッダー部に配置するリズムモード HUD
 * カウントイン・現在小節/拍、ゲージを表示する。
 */
export const RhythmStageHUD: React.FC<RhythmStageHUDProps> = ({ gaugeProgress }) => {
  const { currentMeasure, currentBeat, isCountIn } = useTimeStore()

  return (
    <div className="flex flex-col items-center gap-1 text-sm">
      <div>
        {isCountIn ? (
          <span>{`M / - B ${currentBeat}`}</span>
        ) : (
          <span>{`M ${currentMeasure} - B ${currentBeat}`}</span>
        )}
      </div>
      <RhythmGauge progress={gaugeProgress} className="w-40" />
    </div>
  )
}
