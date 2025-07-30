import { create } from 'zustand'

interface GlobalTimeStore {
  currentTime: number
  isPlaying: boolean
  loopStartTime: number
  loopDuration: number
  tempo: number
  updateTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  setLoopStartTime: (time: number) => void
  setLoopDuration: (duration: number) => void
  setTempo: (tempo: number) => void
  reset: () => void
}

export const useGlobalTimeStore = create<GlobalTimeStore>((set) => ({
  currentTime: 0,
  isPlaying: false,
  loopStartTime: 0,
  loopDuration: 0,
  tempo: 120,
  
  updateTime: (time) => set({ currentTime: time }),
  
  setPlaying: (playing) => set({ isPlaying: playing }),
  
  setLoopStartTime: (time) => set({ loopStartTime: time }),
  
  setLoopDuration: (duration) => set({ loopDuration: duration }),
  
  setTempo: (tempo) => set({ tempo }),
  
  reset: () => set({
    currentTime: 0,
    isPlaying: false,
    loopStartTime: 0,
    loopDuration: 0,
    tempo: 120
  })
}))