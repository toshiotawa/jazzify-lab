import Foundation

struct PitchOnsetTrackerConfig: Equatable {
    var onsetLevelDb: Double = -35
    var releaseLevelDb: Double = -45
    var minConfidence: Double = 0.5
    var pitchStableFrames: Int = 4
    var releaseFrames: Int = 4
    var minNoteFrames: Int = 6
    var attackRiseDb: Double = 6
    var retriggerGuardFrames: Int = 6
    var retriggerLookbackFrames: Int = 4
    var repeatDipDb: Double = 2
    var repeatRiseDb: Double = 4
    var centsTolerance: Double = 40
    /// 1 フレーム目でも confidence がこの値以上なら即 noteOn（高確信 = 5ms）。
    var onsetImmediateConfidence: Double = 0.85
    /// 高速反応 ON のとき、この confidence 以上ならレガートを 1 フレームで切る。
    var fastLegatoConfidence: Double = 0.8
    /// Phrase Defense の期待音を 1 フレームで採用する confidence。
    var expectedAssistConfidence: Double = 0.38
    /// 高速反応。ON のときだけ fastLegatoConfidence の 1 フレーム遷移を許す。
    var fastResponse: Bool = false
    /// 1 観測あたりの原音時間 (ms)。q=1 は 5、q=2 は 10。
    var frameDurationMs: Double = 5
    /// false のとき 1 観測だけでは即 noteOn しない（+12 実験用）。
    var allowImmediateFirstFrame: Bool = true
}

struct PitchFrame {
    let prediction: Double
    let confidence: Double
    let volume: Double
}

enum PitchInputEvent: Equatable {
    case noteOn(note: Int, frameIndex: Int, onsetFrameIndex: Int)
    case noteOff(note: Int, frameIndex: Int)
}

final class PitchOnsetTracker {
    private var config: PitchOnsetTrackerConfig
    private var currentNote = -1
    private var noteOnFrame = -1
    private var lastNoteOnFrame = -1
    private var pitchStableCount = 0
    private var lastStableNote = -1
    private var releaseCount = 0
    private var recentMinDb = Double.infinity
    private var recentMinDbFrame = -1
    private var recentLevelDbRing: [Double] = []
    private var pendingOff = false
    private var pendingOffFrame = -1
    private var legatoHitNotes: [Int] = [-1, -1, -1]
    private var legatoHitIndex = 0
    private var expectedPitchMask = 0
    private var expectedPitchMidis: [Int] = []
    private var suspendedNote = -1
    private var suspendedNoteOffFrame = -1
    private var repeatPitchClassMask = 0
    private var notePeakDb = -Double.infinity
    private var dippedFromPeak = false
    private var noteTroughDb = Double.infinity

    init(config: PitchOnsetTrackerConfig = PitchOnsetTrackerConfig()) {
        self.config = config
    }

    func setConfig(_ config: PitchOnsetTrackerConfig) {
        self.config = config
    }

    /// Phrase Defense 以外は 0。通常の自由演奏には使わない。
    func setExpectedPitchMask(_ mask: Int) {
        setExpectedPitchCandidates(mask: mask, midis: [])
    }

    func setExpectedPitchCandidates(mask: Int, midis: [Int], repeatPitchClassMask: Int = 0) {
        expectedPitchMask = mask & 0xFFF
        expectedPitchMidis = midis
        self.repeatPitchClassMask = repeatPitchClassMask & 0xFFF
    }

    func reset() {
        currentNote = -1
        noteOnFrame = -1
        lastNoteOnFrame = -1
        pitchStableCount = 0
        lastStableNote = -1
        releaseCount = 0
        recentMinDb = .infinity
        recentMinDbFrame = -1
        recentLevelDbRing = []
        pendingOff = false
        pendingOffFrame = -1
        legatoHitNotes = [-1, -1, -1]
        legatoHitIndex = 0
        suspendedNote = -1
        suspendedNoteOffFrame = -1
        repeatPitchClassMask = 0
        resetRepeatPeakState()
    }

    private func resetRepeatPeakState() {
        notePeakDb = -.infinity
        dippedFromPeak = false
        noteTroughDb = .infinity
    }

    func flushActiveNote(frameIndex: Int) -> [PitchInputEvent] {
        guard currentNote >= 0 else {
            reset()
            return []
        }
        let events: [PitchInputEvent] = [.noteOff(note: currentNote, frameIndex: frameIndex)]
        reset()
        return events
    }

    /// MIDI ノート番号として扱える prediction か（非有限・範囲外は除外して Int 変換トラップを防ぐ）。
    private static func quantizePrediction(_ prediction: Double) -> Int? {
        guard prediction.isFinite,
              prediction > 0,
              prediction < 128 else { return nil }
        return Int(prediction.rounded())
    }

    func processFrame(_ frame: PitchFrame, frameIndex: Int) -> [PitchInputEvent] {
        var events: [PitchInputEvent] = []
        guard frame.confidence.isFinite,
              frame.volume.isFinite,
              frame.volume >= 0 else {
            pitchStableCount = 0
            lastStableNote = -1
            flushPendingOff(&events, frameIndex: frameIndex)
            return events
        }

        let levelDb = volumeToDb(frame.volume)
        let quantized = Self.quantizePrediction(frame.prediction)
        let expectedAssist = isExpectedAssist(
            quantized: quantized,
            confidence: frame.confidence,
            levelDb: levelDb
        )
        let confidenceVoiced = levelDb > config.onsetLevelDb
            && frame.confidence >= config.minConfidence
            && quantized != nil
        let sustainingSameNote = currentNote >= 0
            && quantized != nil
            && levelDb >= config.releaseLevelDb
            && pitchMatch(frame.prediction, Double(currentNote), config.centsTolerance)
        let voiced = expectedAssist || confidenceVoiced || sustainingSameNote
        pushLegatoHit(voiced ? quantized ?? -1 : -1)

        if voiced, let quantized {
            if lastStableNote == quantized {
                pitchStableCount += 1
            } else {
                pitchStableCount = 1
                lastStableNote = quantized
            }

            releaseCount = 0
            pendingOff = false

            if currentNote < 0 {
                let withinRetriggerGuard = suspendedNoteOffFrame >= 0
                    && frameIndex - suspendedNoteOffFrame < config.retriggerGuardFrames
                if quantized == suspendedNote,
                   withinRetriggerGuard,
                   recentLevelRise(levelDb: levelDb) < config.attackRiseDb {
                    resumeSuspendedNote(note: quantized, frameIndex: frameIndex)
                } else if shouldStartNoteOn(
                    expectedAssist: expectedAssist,
                    confidence: frame.confidence,
                    quantized: quantized
                ) {
                    suspendedNote = -1
                    emitNoteOn(
                        &events,
                        note: quantized,
                        frameIndex: frameIndex,
                        onsetFrameIndex: frameIndex - pitchStableCount + 1,
                        levelDb: levelDb
                    )
                }
            } else if !pitchMatch(frame.prediction, Double(currentNote), config.centsTolerance) {
                if shouldTreatRepeatModePitchWobble(quantized: quantized) {
                    updateRepeatPeakAndDip(levelDb: levelDb)
                    tryRetrigger(&events, levelDb: levelDb, frameIndex: frameIndex)
                } else {
                    let octaveRelated = isOctaveRelatedJump(quantized: quantized)
                    if octaveRelated, isLikelyOctaveJump(quantized: quantized, levelDb: levelDb, confidence: frame.confidence) {
                        // 倍音由来の ±12/±24 セミトーン飛びは PC 判定に影響しないため無視。
                    } else if shouldCommitPitchChange(
                        quantized: quantized,
                        levelDb: levelDb,
                        confidence: frame.confidence,
                        octaveRelated: octaveRelated
                    ) {
                        suspendedNote = -1
                        emitNoteOff(&events, note: currentNote, frameIndex: frameIndex)
                        emitNoteOn(
                            &events,
                            note: quantized,
                            frameIndex: frameIndex,
                            onsetFrameIndex: frameIndex - pitchStableCount + 1,
                            levelDb: levelDb
                        )
                    }
                }
            } else {
                if isRepeatPitchClassActive(note: currentNote) {
                    updateRepeatPeakAndDip(levelDb: levelDb)
                }
                tryRetrigger(&events, levelDb: levelDb, frameIndex: frameIndex)
            }
        } else {
            pitchStableCount = 0
            lastStableNote = -1
            if currentNote >= 0 || suspendedNote >= 0 {
                trackRecentMinDb(levelDb: levelDb, frameIndex: frameIndex)
            }

            if currentNote >= 0 {
                let belowRelease = levelDb < config.releaseLevelDb
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

    private func shouldStartNoteOn(
        expectedAssist: Bool,
        confidence: Double,
        quantized: Int
    ) -> Bool {
        if expectedAssist {
            return legatoHitCount(quantized) >= 2
        }
        return shouldEmitNoteOn(
            pitchStableCount: pitchStableCount,
            confidence: confidence,
            allowImmediate: true
        )
    }

    private func shouldEmitNoteOn(
        pitchStableCount: Int,
        confidence: Double,
        allowImmediate: Bool
    ) -> Bool {
        if pitchStableCount >= config.pitchStableFrames { return true }
        if allowImmediate,
           config.allowImmediateFirstFrame,
           pitchStableCount == 1,
           confidence >= config.onsetImmediateConfidence { return true }
        return false
    }

    private func isOctaveRelatedJump(quantized: Int) -> Bool {
        guard currentNote >= 0 else { return false }
        let diff = abs(quantized - currentNote)
        return diff == 12 || diff == 24
    }

    private func shouldCommitPitchChange(
        quantized: Int,
        levelDb: Double,
        confidence: Double,
        octaveRelated: Bool
    ) -> Bool {
        if octaveRelated {
            if isSamePitchClass(quantized, currentNote),
               isRepeatPitchClassActive(note: currentNote) {
                return hasRepeatModeAttack(levelDb: levelDb)
            }
            if expectedPitchMidis.contains(quantized) {
                if recentLevelRise(levelDb: levelDb) >= config.attackRiseDb { return true }
                return legatoHitCount(quantized) >= 2
            }
        }
        return shouldEmitLegatoSwitch(quantized: quantized, confidence: confidence)
    }

    /// 高速反応かつ超高確信は 1 フレーム。それ以外は直近 3 フレーム中 2 ヒット。
    private func shouldEmitLegatoSwitch(quantized: Int, confidence: Double) -> Bool {
        if !isOctaveRelatedJump(quantized: quantized),
           config.fastResponse,
           confidence >= config.fastLegatoConfidence { return true }
        return legatoHitCount(quantized) >= 2
    }

    private func isExpectedAssist(quantized: Int?, confidence: Double, levelDb: Double) -> Bool {
        guard expectedPitchMask != 0, let quantized, quantized >= 0 else { return false }
        guard levelDb > config.onsetLevelDb else { return false }
        guard confidence >= config.expectedAssistConfidence else { return false }
        let pitchClass = ((quantized % 12) + 12) % 12
        return (expectedPitchMask & (1 << pitchClass)) != 0
    }

    private func pushLegatoHit(_ note: Int) {
        legatoHitNotes[legatoHitIndex] = note
        legatoHitIndex = (legatoHitIndex + 1) % 3
    }

    private func legatoHitCount(_ note: Int) -> Int {
        var count = 0
        if legatoHitNotes[0] == note { count += 1 }
        if legatoHitNotes[1] == note { count += 1 }
        if legatoHitNotes[2] == note { count += 1 }
        return count
    }

    var pitchStableDurationMs: Double {
        Double(config.pitchStableFrames) * config.frameDurationMs
    }

    private func isLikelyOctaveJump(quantized: Int, levelDb: Double, confidence: Double) -> Bool {
        guard currentNote >= 0 else { return false }
        let diff = abs(quantized - currentNote)
        guard diff == 12 || diff == 24 else { return false }

        let rise = recentLevelRise(levelDb: levelDb)
        if isSamePitchClass(quantized, currentNote),
           isRepeatPitchClassActive(note: currentNote) {
            return !hasRepeatModeAttack(levelDb: levelDb)
        }

        if expectedPitchMidis.contains(quantized) {
            if rise >= config.attackRiseDb { return false }
            if shouldEmitLegatoSwitch(quantized: quantized, confidence: confidence) { return false }
            return true
        }

        return rise < config.attackRiseDb
    }

    private func resumeSuspendedNote(note: Int, frameIndex: Int) {
        currentNote = note
        noteOnFrame = frameIndex
        releaseCount = 0
        pendingOff = false
        suspendedNote = -1
    }

    private func volumeToDb(_ volume: Double) -> Double {
        10 * log10(max(volume, 1e-12))
    }

    private func pitchMatch(_ a: Double, _ b: Double, _ centsTolerance: Double) -> Bool {
        abs(a - b) * 100 <= centsTolerance
    }

    private func emitNoteOn(
        _ events: inout [PitchInputEvent],
        note: Int,
        frameIndex: Int,
        onsetFrameIndex: Int,
        levelDb: Double? = nil
    ) {
        currentNote = note
        noteOnFrame = frameIndex
        lastNoteOnFrame = frameIndex
        recentMinDb = .infinity
        recentMinDbFrame = -1
        recentLevelDbRing = []
        suspendedNote = -1
        suspendedNoteOffFrame = -1
        resetRepeatPeakState()
        if let levelDb, levelDb.isFinite {
            notePeakDb = levelDb
            noteTroughDb = levelDb
        }
        events.append(.noteOn(note: note, frameIndex: frameIndex, onsetFrameIndex: onsetFrameIndex))
    }

    private func isSamePitchClass(_ a: Int, _ b: Int) -> Bool {
        guard a >= 0, b >= 0 else { return false }
        return ((a % 12) + 12) % 12 == ((b % 12) + 12) % 12
    }

    private func isRepeatPitchClassActive(note: Int) -> Bool {
        guard note >= 0, repeatPitchClassMask != 0 else { return false }
        let pitchClass = ((note % 12) + 12) % 12
        return (repeatPitchClassMask & (1 << pitchClass)) != 0
    }

    /// 同音連打待ち中の半音以内揺れは再発音にしない（音量リトリガのみ）。
    private func shouldTreatRepeatModePitchWobble(quantized: Int) -> Bool {
        guard currentNote >= 0, isRepeatPitchClassActive(note: currentNote) else { return false }
        if quantized == currentNote { return true }
        return abs(quantized - currentNote) == 1
    }

    private func updateRepeatPeakAndDip(levelDb: Double) {
        if levelDb > notePeakDb {
            notePeakDb = levelDb
        }
        if notePeakDb - levelDb >= config.repeatDipDb {
            dippedFromPeak = true
        }
        if dippedFromPeak {
            noteTroughDb = min(noteTroughDb, levelDb)
        }
    }

    private func hasRepeatModeAttack(levelDb: Double) -> Bool {
        guard dippedFromPeak else { return false }
        return levelDb - noteTroughDb >= config.repeatRiseDb
    }

    private func emitNoteOff(_ events: inout [PitchInputEvent], note: Int, frameIndex: Int) {
        guard currentNote == note else { return }
        suspendedNote = note
        suspendedNoteOffFrame = frameIndex
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
        let noteDuration = frameIndex - noteOnFrame
        if noteDuration >= config.minNoteFrames {
            emitNoteOff(&events, note: currentNote, frameIndex: frameIndex)
        }
    }

    private func trackRecentMinDb(levelDb: Double, frameIndex: Int) {
        recentLevelDbRing.append(levelDb)
        let maxRing = max(config.retriggerLookbackFrames, config.retriggerGuardFrames)
        if recentLevelDbRing.count > maxRing {
            recentLevelDbRing.removeFirst()
        }
        if levelDb < recentMinDb {
            recentMinDb = levelDb
            recentMinDbFrame = frameIndex
        }
    }

    private func recentLevelRise(levelDb: Double) -> Double {
        let lookback = config.retriggerLookbackFrames
        let start = max(0, recentLevelDbRing.count - lookback)
        var minRecent = levelDb
        if start < recentLevelDbRing.count {
            for index in start..<recentLevelDbRing.count {
                minRecent = min(minRecent, recentLevelDbRing[index])
            }
        }
        return levelDb - minRecent
    }

    private func tryRetrigger(_ events: inout [PitchInputEvent], levelDb: Double, frameIndex: Int) {
        guard currentNote >= 0 else { return }
        if frameIndex - lastNoteOnFrame < config.retriggerGuardFrames {
            if !isRepeatPitchClassActive(note: currentNote) {
                trackRecentMinDb(levelDb: levelDb, frameIndex: frameIndex)
            }
            return
        }

        if isRepeatPitchClassActive(note: currentNote) {
            if hasRepeatModeAttack(levelDb: levelDb) {
                let note = currentNote
                let onsetFrameIndex = max(lastNoteOnFrame + 1, frameIndex)
                emitNoteOff(&events, note: note, frameIndex: frameIndex)
                emitNoteOn(
                    &events,
                    note: note,
                    frameIndex: frameIndex,
                    onsetFrameIndex: onsetFrameIndex,
                    levelDb: levelDb
                )
            }
            return
        }

        trackRecentMinDb(levelDb: levelDb, frameIndex: frameIndex)
        let rise = recentLevelRise(levelDb: levelDb)
        if rise >= config.attackRiseDb {
            let note = currentNote
            let onsetFrameIndex = max(lastNoteOnFrame + 1, recentMinDbFrame + 1)
            emitNoteOff(&events, note: note, frameIndex: frameIndex)
            emitNoteOn(
                &events,
                note: note,
                frameIndex: frameIndex,
                onsetFrameIndex: onsetFrameIndex,
                levelDb: levelDb
            )
        }
    }
}

enum PitchOnsetSensitivity {
    /// 感度 1-10 の minConfidence。9 は 0.30、10 は 0.28。
    static func minConfidence(for level: Int) -> Double {
        if level >= 10 { return 0.28 }
        if level == 9 { return 0.30 }
        if level >= 5 { return 0.5 - Double(level - 5) * 0.03 }
        return 0.5 + Double(5 - level) * 0.0375
    }

    static func scaleConfig(sensitivity: Int, base: PitchOnsetTrackerConfig = PitchOnsetTrackerConfig()) -> PitchOnsetTrackerConfig {
        let level = max(1, min(10, sensitivity))
        let scale = pow(10, Double(5 - level) * 0.17)
        let minConfidence = Self.minConfidence(for: level)
        var config = base
        config.onsetLevelDb = base.onsetLevelDb + 10 * log10(scale)
        config.releaseLevelDb = base.releaseLevelDb + 10 * log10(scale)
        config.minConfidence = minConfidence
        return config
    }
}
