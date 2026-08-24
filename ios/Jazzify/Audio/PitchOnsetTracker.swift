import Foundation

struct PitchOnsetTrackerConfig: Equatable {
    var onsetLevelDb: Double = -35
    var releaseLevelDb: Double = -45
    var minConfidence: Double = 0.5
    var pitchStableFrames: Int = 2
    var releaseFrames: Int = 3
    var minNoteFrames: Int = 4
    var attackRiseDb: Double = 6
    var retriggerGuardFrames: Int = 5
    var centsTolerance: Double = 40
}

struct PitchFrame {
    let prediction: Double
    let confidence: Double
    let volume: Double
}

enum PitchInputEvent: Equatable {
    case noteOn(note: Int, frameIndex: Int)
    case noteOff(note: Int, frameIndex: Int)
}

final class PitchOnsetTracker {
    private var config: PitchOnsetTrackerConfig
    private var currentNote = -1
    private var noteOnFrame = -1
    private var lastNoteOnFrame = -1
    private var pitchStableCount = 0
    private var lastStablePitch: Double = -1
    private var releaseCount = 0
    private var recentMinDb = Double.infinity
    private var pendingOff = false
    private var pendingOffFrame = -1

    init(config: PitchOnsetTrackerConfig = PitchOnsetTrackerConfig()) {
        self.config = config
    }

    func setConfig(_ config: PitchOnsetTrackerConfig) {
        self.config = config
    }

    func reset() {
        currentNote = -1
        noteOnFrame = -1
        lastNoteOnFrame = -1
        pitchStableCount = 0
        lastStablePitch = -1
        releaseCount = 0
        recentMinDb = .infinity
        pendingOff = false
        pendingOffFrame = -1
    }

    func processFrame(_ frame: PitchFrame, frameIndex: Int) -> [PitchInputEvent] {
        var events: [PitchInputEvent] = []
        let levelDb = volumeToDb(frame.volume)
        let voiced = levelDb > config.onsetLevelDb
            && frame.confidence >= config.minConfidence
            && frame.prediction > 0

        if voiced {
            let quantized = Int(frame.prediction.rounded())
            if lastStablePitch >= 0,
               pitchMatch(frame.prediction, lastStablePitch, config.centsTolerance) {
                pitchStableCount += 1
            } else {
                pitchStableCount = 1
                lastStablePitch = frame.prediction
            }

            releaseCount = 0
            pendingOff = false

            if currentNote < 0 {
                if pitchStableCount >= config.pitchStableFrames {
                    emitNoteOn(&events, note: quantized, frameIndex: frameIndex)
                }
            } else if !pitchMatch(frame.prediction, Double(currentNote), config.centsTolerance) {
                if pitchStableCount >= config.pitchStableFrames {
                    emitNoteOff(&events, note: currentNote, frameIndex: frameIndex)
                    emitNoteOn(&events, note: quantized, frameIndex: frameIndex)
                }
            } else {
                tryRetrigger(&events, levelDb: levelDb, frameIndex: frameIndex)
            }
        } else {
            pitchStableCount = 0
            lastStablePitch = -1

            if currentNote >= 0 {
                let belowRelease = levelDb < config.releaseLevelDb
                    || frame.confidence < config.minConfidence
                if belowRelease {
                    releaseCount += 1
                    if releaseCount >= config.releaseFrames {
                        scheduleNoteOff(&events, note: currentNote, frameIndex: frameIndex)
                    }
                } else {
                    releaseCount = 0
                }
            }
        }

        flushPendingOff(&events, frameIndex: frameIndex)
        return events
    }

    func getCurrentNote() -> Int { currentNote }

    private func volumeToDb(_ volume: Double) -> Double {
        10 * log10(max(volume, 1e-12))
    }

    private func pitchMatch(_ a: Double, _ b: Double, _ centsTolerance: Double) -> Bool {
        abs(a - b) * 100 <= centsTolerance
    }

    private func emitNoteOn(_ events: inout [PitchInputEvent], note: Int, frameIndex: Int) {
        currentNote = note
        noteOnFrame = frameIndex
        lastNoteOnFrame = frameIndex
        recentMinDb = .infinity
        events.append(.noteOn(note: note, frameIndex: frameIndex))
    }

    private func emitNoteOff(_ events: inout [PitchInputEvent], note: Int, frameIndex: Int) {
        guard currentNote == note else { return }
        currentNote = -1
        noteOnFrame = -1
        releaseCount = 0
        pendingOff = false
        events.append(.noteOff(note: note, frameIndex: frameIndex))
    }

    private func scheduleNoteOff(_ events: inout [PitchInputEvent], note: Int, frameIndex: Int) {
        let noteDuration = frameIndex - noteOnFrame
        if noteDuration < config.minNoteFrames {
            pendingOff = true
            pendingOffFrame = frameIndex
            return
        }
        emitNoteOff(&events, note: note, frameIndex: frameIndex)
    }

    private func flushPendingOff(_ events: inout [PitchInputEvent], frameIndex: Int) {
        guard pendingOff, currentNote >= 0 else { return }
        let elapsed = frameIndex - pendingOffFrame
        if elapsed >= config.minNoteFrames {
            emitNoteOff(&events, note: currentNote, frameIndex: frameIndex)
        }
    }

    private func tryRetrigger(_ events: inout [PitchInputEvent], levelDb: Double, frameIndex: Int) {
        guard currentNote >= 0 else { return }
        if frameIndex - lastNoteOnFrame < config.retriggerGuardFrames {
            recentMinDb = min(recentMinDb, levelDb)
            return
        }
        recentMinDb = min(recentMinDb, levelDb)
        let rise = levelDb - recentMinDb
        if rise >= config.attackRiseDb {
            let note = currentNote
            emitNoteOff(&events, note: note, frameIndex: frameIndex)
            emitNoteOn(&events, note: note, frameIndex: frameIndex)
        }
    }
}

enum PitchOnsetSensitivity {
    static func scaleConfig(sensitivity: Int, base: PitchOnsetTrackerConfig = PitchOnsetTrackerConfig()) -> PitchOnsetTrackerConfig {
        let level = max(1, min(10, sensitivity))
        let scale = pow(10, Double(5 - level) * 0.17)
        var config = base
        config.onsetLevelDb = base.onsetLevelDb + 10 * log10(scale)
        config.releaseLevelDb = base.releaseLevelDb + 10 * log10(scale)
        return config
    }
}
