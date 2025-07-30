interface ChordProgressionData {
  chord: string
  measure: number
  beat: number
}

export class RhythmTimingManager {
  private bpm: number
  private timeSignature: number
  private measureDuration: number // milliseconds per measure
  private beatDuration: number    // milliseconds per beat

  constructor(bpm: number, timeSignature: number) {
    this.bpm = bpm
    this.timeSignature = timeSignature
    this.measureDuration = (60000 * timeSignature) / bpm
    this.beatDuration = this.measureDuration / timeSignature
  }

  /**
   * Calculate absolute time in milliseconds for a specific measure and beat
   */
  calculateBeatTime(measure: number, beat: number): number {
    const measureTime = (measure - 1) * this.measureDuration
    const beatTime = (beat - 1) * this.beatDuration
    return measureTime + beatTime
  }

  /**
   * Get current measure and beat from absolute time
   */
  getCurrentMeasureAndBeat(currentTime: number): { measure: number; beat: number } {
    const totalMeasures = currentTime / this.measureDuration
    const measure = Math.floor(totalMeasures) + 1
    
    const remainderTime = currentTime % this.measureDuration
    const beat = Math.floor(remainderTime / this.beatDuration) + 1
    
    return { measure, beat }
  }

  /**
   * Check if current time is within judgment window of target time
   */
  isWithinJudgmentWindow(targetTime: number, currentTime: number, windowMs: number = 200): boolean {
    const diff = Math.abs(targetTime - currentTime)
    return diff <= windowMs
  }

  /**
   * Calculate next chord timing for random pattern (every measure)
   */
  getNextRandomTiming(currentTime: number): number {
    const { measure } = this.getCurrentMeasureAndBeat(currentTime)
    // Next chord at the start of next measure
    return this.calculateBeatTime(measure + 1, 1)
  }

  /**
   * Calculate absolute timing for progression chord
   */
  calculateProgressionTiming(chord: ChordProgressionData, loopStartTime: number = 0): number {
    return loopStartTime + this.calculateBeatTime(chord.measure, chord.beat)
  }

  /**
   * Find next progression chord timing from current time
   */
  findNextProgressionChord(
    progressionData: ChordProgressionData[], 
    currentTime: number,
    loopStartTime: number = 0
  ): { chord: ChordProgressionData; timing: number; index: number } | null {
    
    if (progressionData.length === 0) return null

    // Calculate all chord timings
    const chordTimings = progressionData.map((chord, index) => ({
      chord,
      timing: this.calculateProgressionTiming(chord, loopStartTime),
      index
    }))

    // Find next chord after current time
    const nextChord = chordTimings.find(item => item.timing > currentTime)
    
    if (nextChord) {
      return nextChord
    }

    // If no chord found after current time, return first chord (for loop)
    return chordTimings[0]
  }

  /**
   * Calculate gauge speed for timing display
   */
  calculateGaugeSpeed(chordInterval: number, markerPosition: number = 0.8): number {
    // Speed = distance / time
    return markerPosition / chordInterval
  }

  /**
   * Get average chord interval for gauge speed calculation
   */
  getAverageChordInterval(progressionData: ChordProgressionData[]): number {
    if (progressionData.length <= 1) {
      return this.measureDuration // Default to 1 measure
    }

    let totalInterval = 0
    for (let i = 1; i < progressionData.length; i++) {
      const prevTiming = this.calculateBeatTime(progressionData[i-1].measure, progressionData[i-1].beat)
      const currentTiming = this.calculateBeatTime(progressionData[i].measure, progressionData[i].beat)
      totalInterval += (currentTiming - prevTiming)
    }

    return totalInterval / (progressionData.length - 1)
  }

  /**
   * Update BPM and recalculate durations
   */
  updateBPM(newBpm: number): void {
    this.bpm = newBpm
    this.measureDuration = (60000 * this.timeSignature) / this.bpm
    this.beatDuration = this.measureDuration / this.timeSignature
  }

  /**
   * Update time signature and recalculate durations
   */
  updateTimeSignature(newTimeSignature: number): void {
    this.timeSignature = newTimeSignature
    this.measureDuration = (60000 * this.timeSignature) / this.bpm
    this.beatDuration = this.measureDuration / this.timeSignature
  }

  // Getters
  get currentBPM(): number { return this.bpm }
  get currentTimeSignature(): number { return this.timeSignature }
  get currentMeasureDuration(): number { return this.measureDuration }
  get currentBeatDuration(): number { return this.beatDuration }
}