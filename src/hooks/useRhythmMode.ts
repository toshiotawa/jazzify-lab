'use client'

import { useEffect } from 'react'
import { useRhythmModeStore } from '@/stores/rhythmModeStore'
import type { RhythmModeSettings, RhythmDifficulty, TimeSignature } from '@/types/rhythm'

export function useRhythmMode() {
  const {
    isEnabled,
    settings,
    setEnabled,
    updateSettings,
    resetSettings
  } = useRhythmModeStore()

  // 初期化
  useEffect(() => {
    // ローカルストレージから設定を復元
    const savedSettings = localStorage.getItem('rhythmModeSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<RhythmModeSettings>
        updateSettings(parsed)
      } catch (error) {
        console.error('Failed to load rhythm mode settings:', error)
      }
    }
  }, [])

  // 設定の保存
  useEffect(() => {
    localStorage.setItem('rhythmModeSettings', JSON.stringify(settings))
  }, [settings])

  const setDifficulty = (difficulty: RhythmDifficulty) => {
    updateSettings({ difficulty })
  }

  const setTimeSignature = (timeSignature: TimeSignature) => {
    updateSettings({ timeSignature })
  }

  const setTempo = (tempo: number) => {
    updateSettings({ tempo: Math.max(60, Math.min(180, tempo)) })
  }

  const setVolume = (volume: number) => {
    updateSettings({ volume: Math.max(0, Math.min(1, volume)) })
  }

  const toggleVisualEffects = () => {
    updateSettings({ visualEffects: !settings.visualEffects })
  }

  const toggleShowGuide = () => {
    updateSettings({ showGuide: !settings.showGuide })
  }

  const toggleAutoPlay = () => {
    updateSettings({ autoPlay: !settings.autoPlay })
  }

  return {
    isEnabled,
    settings,
    setEnabled,
    updateSettings,
    resetSettings,
    setDifficulty,
    setTimeSignature,
    setTempo,
    setVolume,
    toggleVisualEffects,
    toggleShowGuide,
    toggleAutoPlay
  }
}