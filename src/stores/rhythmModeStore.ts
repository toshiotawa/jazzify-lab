import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RhythmModeSettings } from '@/types/rhythm'

interface RhythmModeStore {
  isEnabled: boolean
  settings: RhythmModeSettings
  setEnabled: (enabled: boolean) => void
  updateSettings: (settings: Partial<RhythmModeSettings>) => void
  resetSettings: () => void
}

const defaultSettings: RhythmModeSettings = {
  difficulty: 'normal',
  timeSignature: '4/4',
  tempo: 120,
  volume: 0.7,
  visualEffects: true,
  showGuide: true,
  autoPlay: false
}

export const useRhythmModeStore = create<RhythmModeStore>()(
  persist(
    (set) => ({
      isEnabled: false,
      settings: defaultSettings,
      
      setEnabled: (enabled) => set({ isEnabled: enabled }),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      resetSettings: () => set({ settings: defaultSettings })
    }),
    {
      name: 'rhythm-mode-store',
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        settings: state.settings
      })
    }
  )
)