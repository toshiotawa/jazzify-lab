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
    var repeatRetriggerGuardMs: Double = 0
    var releaseRawDropDb: Double = 30
    var legatoReturnGuardMs: Double = 0
    var retriggerLookbackFrames: Int = 4
    var repeatDipDb: Double = 3
    var repeatRiseDb: Double = 6
    var repeatAttackWindowMs: Double = 40
    var repeatPeakRecoveryMaxDropDb: Double = 6
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
    let attackDb: Double?
    let rawLevelDb: Double?

    init(
        prediction: Double,
        confidence: Double,
        volume: Double,
        attackDb: Double? = nil,
        rawLevelDb: Double? = nil
    ) {
        self.prediction = prediction
        self.confidence = confidence
        self.volume = volume
        self.attackDb = attackDb
        self.rawLevelDb = rawLevelDb
    }
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
    private var recentLevels: [(db: Double, frame: Int)] = []
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
    private var noteTroughFrame = -1
    private var notePeakAttackDb = -Double.infinity
    private var noteTroughAttackDb = Double.infinity
    private var noteTroughAttackFrame = -1
    private var recentAttackDbRing: [Double] = []
    private var noteRawPeakDb = -Double.infinity
    private var processingFrameIndex = 0
    private var legatoFromNote = -1
    private var recentReleasedNotes: [Int] = [-1, -1, -1]
    private var recentReleasedFrames: [Int] = [-1, -1, -1]

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
        recentLevels = []
        pendingOff = false
        pendingOffFrame = -1
        legatoHitNotes = [-1, -1, -1]
        legatoHitIndex = 0
        suspendedNote = -1
        suspendedNoteOffFrame = -1
        resetRepeatPeakState()
        noteRawPeakDb = -.infinity
        legatoFromNote = -1
        recentReleasedNotes = [-1, -1, -1]
        recentReleasedFrames = [-1, -1, -1]
    }

    private func resetRepeatPeakState() {
        notePeakDb = -.infinity
        dippedFromPeak = false
        noteTroughDb = .infinity
        noteTroughFrame = -1
        notePeakAttackDb = -.infinity
        noteTroughAttackDb = .infinity
        noteTroughAttackFrame = -1
        recentAttackDbRing = []
    }

    private func resolveAttackLevelDb(frame: PitchFrame, levelDb: Double) -> Double {
        if let attackDb = frame.attackDb, attackDb.isFinite {
            return attackDb
        }
        return levelDb
    }

    func flushActiveNote(frameIndex: Int, preserveRepeatGate: Bool = false) -> [PitchInputEvent] {
        let note = currentNote >= 0 ? currentNote : suspendedNote
        let keepRepeatNote = preserveRepeatGate && isRepeatPitchClassActive(note: note)
        let events: [PitchInputEvent] = currentNote >= 0
            ? [.noteOff(note: currentNote, frameIndex: frameIndex)] : []
        reset()
        // 音声欠落は発音ではない。フレーム時計を捨てても同音待ちは残す。
        if keepRepeatNote { suspendedNote = note }
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
        processingFrameIndex = frameIndex
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
        let attackLevelDb = resolveAttackLevelDb(frame: frame, levelDb: levelDb)
        let belowRawRelease = isBelowRawRelease(rawLevelDb: frame.rawLevelDb)
        if let rawLevelDb = frame.rawLevelDb, rawLevelDb.isFinite, currentNote >= 0, rawLevelDb > noteRawPeakDb {
            noteRawPeakDb = rawLevelDb
        }
        if isRepeatPitchClassActive(note: suspendedNote), !notePeakAttackDb.isFinite {
            notePeakAttackDb = attackLevelDb
            noteTroughAttackDb = attackLevelDb
        }
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
            && !belowRawRelease
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
                if isSamePitchClass(quantized, suspendedNote),
                   isRepeatPitchClassActive(note: suspendedNote) {
                    let withinRepeatRetriggerGuard = frameIndex - lastNoteOnFrame < repeatRetriggerGuardFrames()
                    if !withinRepeatRetriggerGuard,
                       hasRepeatModeAttack(
                        attackLevelDb: attackLevelDb,
                        requirePeakRecovery: quantized == suspendedNote
                       ) {
                        suspendedNote = -1
                        emitNoteOn(
                            &events,
                            note: quantized,
                            frameIndex: frameIndex,
                            onsetFrameIndex: resolveRepeatModeOnsetFrameIndex(frameIndex: frameIndex),
                            levelDb: levelDb,
                            attackLevelDb: attackLevelDb,
                            rawLevelDb: frame.rawLevelDb
                        )
                    } else {
                        resumeSuspendedNote(note: suspendedNote, frameIndex: frameIndex)
                    }
                } else if quantized == suspendedNote,
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
                        levelDb: levelDb,
                        attackLevelDb: attackLevelDb,
                        rawLevelDb: frame.rawLevelDb
                    )
                }
            } else if quantized != currentNote
                && !pitchMatch(frame.prediction, Double(currentNote), config.centsTolerance) {
                if shouldTreatRepeatModePitchWobble(quantized: quantized) {
                    if quantized == currentNote || isSamePitchClass(quantized, currentNote) {
                        updateRepeatPeakAndDip(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                        recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                        if allowsRepeatRetrigger(confidenceVoiced: confidenceVoiced, expectedAssist: expectedAssist) {
                            tryRetrigger(&events, levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                        }
                    } else {
                        updateRepeatTroughOnly(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                        recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                    }
                } else if shouldHoldRepeatModeUnexpectedPitch(quantized: quantized) {
                    updateRepeatTroughOnly(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                    recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                } else if shouldSuppressLegatoReturnToRecentNote(quantized: quantized, frameIndex: frameIndex) {
                    let wobbleReturn = quantized == legatoFromNote
                        && abs(quantized - currentNote) == 1
                    if wobbleReturn {
                        let wobbleNote = currentNote
                        emitNoteOff(&events, note: wobbleNote, frameIndex: frameIndex)
                        legatoFromNote = wobbleNote
                        resumeSuspendedNote(note: quantized, frameIndex: frameIndex)
                    } else {
                        updateRepeatTroughOnly(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                        recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                    }
                } else {
                    let octaveRelated = isOctaveRelatedJump(quantized: quantized)
                    if octaveRelated, isLikelyOctaveJump(
                        quantized: quantized,
                        levelDb: levelDb,
                        attackLevelDb: attackLevelDb,
                        confidence: frame.confidence
                    ) {
                        // 倍音由来の ±12/±24 セミトーン飛びは PC 判定に影響しないため無視。
                    } else if shouldCommitPitchChange(
                        quantized: quantized,
                        levelDb: levelDb,
                        attackLevelDb: attackLevelDb,
                        confidence: frame.confidence,
                        octaveRelated: octaveRelated
                    ) {
                        suspendedNote = -1
                        legatoFromNote = currentNote
                        emitNoteOff(&events, note: currentNote, frameIndex: frameIndex)
                        emitNoteOn(
                            &events,
                            note: quantized,
                            frameIndex: frameIndex,
                            onsetFrameIndex: frameIndex - pitchStableCount + 1,
                            levelDb: levelDb,
                            attackLevelDb: attackLevelDb,
                            rawLevelDb: frame.rawLevelDb
                        )
                    }
                }
            } else {
                if isRepeatPitchClassActive(note: currentNote) {
                    updateRepeatPeakAndDip(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                    recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                }
                if allowsRepeatRetrigger(confidenceVoiced: confidenceVoiced, expectedAssist: expectedAssist) {
                    tryRetrigger(&events, levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                }
            }
        } else {
            pitchStableCount = 0
            lastStableNote = -1
            if currentNote >= 0 || suspendedNote >= 0 {
                recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
            }
            let repeatNote = currentNote >= 0 ? currentNote : suspendedNote
            if repeatNote >= 0, isRepeatPitchClassActive(note: repeatNote) {
                updateRepeatTroughOnly(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
            }

            if currentNote >= 0 {
                let belowRelease = levelDb < config.releaseLevelDb || belowRawRelease
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
        attackLevelDb: Double,
        confidence: Double,
        octaveRelated: Bool
    ) -> Bool {
        if octaveRelated {
            if isSamePitchClass(quantized, currentNote),
               isRepeatPitchClassActive(note: currentNote) {
                if processingFrameIndex - lastNoteOnFrame < repeatRetriggerGuardFrames() {
                    return false
                }
                return hasRepeatModeAttack(
                    attackLevelDb: attackLevelDb,
                    requirePeakRecovery: quantized == currentNote
                )
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

    private func isLikelyOctaveJump(
        quantized: Int,
        levelDb: Double,
        attackLevelDb: Double,
        confidence: Double
    ) -> Bool {
        guard currentNote >= 0 else { return false }
        let diff = abs(quantized - currentNote)
        guard diff == 12 || diff == 24 else { return false }

        let rise = recentLevelRise(levelDb: levelDb)
        if isSamePitchClass(quantized, currentNote),
           isRepeatPitchClassActive(note: currentNote) {
            if processingFrameIndex - lastNoteOnFrame < repeatRetriggerGuardFrames() {
                return true
            }
            if quantized > currentNote, !expectedPitchMidis.contains(quantized) {
                return true
            }
            return !hasRepeatModeAttack(attackLevelDb: attackLevelDb, requirePeakRecovery: false)
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

    private func allowsRepeatRetrigger(confidenceVoiced: Bool, expectedAssist: Bool) -> Bool {
        confidenceVoiced || expectedAssist
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
        levelDb: Double? = nil,
        attackLevelDb: Double? = nil,
        preserveAttackPeakReference: Bool = false,
        rawLevelDb: Double? = nil
    ) {
        let prevPeakAttackDb = notePeakAttackDb
        currentNote = note
        noteOnFrame = frameIndex
        lastNoteOnFrame = frameIndex
        recentLevels = []
        suspendedNote = -1
        suspendedNoteOffFrame = -1
        resetRepeatPeakState()
        if let levelDb, levelDb.isFinite {
            notePeakDb = levelDb
            noteTroughDb = levelDb
        }
        if let attackLevelDb, attackLevelDb.isFinite {
            if preserveAttackPeakReference, prevPeakAttackDb.isFinite {
                let floor = prevPeakAttackDb - config.repeatPeakRecoveryMaxDropDb
                notePeakAttackDb = max(attackLevelDb, floor)
            } else {
                notePeakAttackDb = attackLevelDb
            }
            noteTroughAttackDb = attackLevelDb
        }
        if let rawLevelDb, rawLevelDb.isFinite {
            noteRawPeakDb = rawLevelDb
        } else {
            noteRawPeakDb = -.infinity
        }
        events.append(.noteOn(note: note, frameIndex: frameIndex, onsetFrameIndex: onsetFrameIndex))
    }

    private func isBelowRawRelease(rawLevelDb: Double?) -> Bool {
        guard let rawLevelDb, rawLevelDb.isFinite, noteRawPeakDb.isFinite else { return false }
        return rawLevelDb < noteRawPeakDb - config.releaseRawDropDb
    }

    private func repeatRetriggerGuardFrames() -> Int {
        let frameMs = max(1, config.frameDurationMs)
        return max(config.retriggerGuardFrames, Int((config.repeatRetriggerGuardMs / frameMs).rounded()))
    }

    private func legatoReturnGuardFrames() -> Int {
        let frameMs = max(1, config.frameDurationMs)
        guard config.legatoReturnGuardMs > 0 else { return 0 }
        return Int((config.legatoReturnGuardMs / frameMs).rounded())
    }

    private func pushRecentRelease(note: Int, frameIndex: Int) {
        recentReleasedNotes[0] = recentReleasedNotes[1]
        recentReleasedNotes[1] = recentReleasedNotes[2]
        recentReleasedNotes[2] = note
        recentReleasedFrames[0] = recentReleasedFrames[1]
        recentReleasedFrames[1] = recentReleasedFrames[2]
        recentReleasedFrames[2] = frameIndex
    }

    private func isRecentlyReleased(quantized: Int, frameIndex: Int) -> Bool {
        let guardFrames = legatoReturnGuardFrames()
        guard guardFrames > 0 else { return false }
        for index in 0..<recentReleasedNotes.count {
            let releasedNote = recentReleasedNotes[index]
            let releasedFrame = recentReleasedFrames[index]
            if releasedNote == quantized,
               releasedFrame >= 0,
               frameIndex - releasedFrame < guardFrames {
                return true
            }
        }
        return false
    }

    private func shouldSuppressLegatoReturnToRecentNote(quantized: Int, frameIndex: Int) -> Bool {
        guard currentNote >= 0 else { return false }
        return isRecentlyReleased(quantized: quantized, frameIndex: frameIndex)
    }

    private func isSamePitchClass(_ a: Int, _ b: Int) -> Bool {
        guard a >= 0, b >= 0 else { return false }
        return ((a % 12) + 12) % 12 == ((b % 12) + 12) % 12
    }

    private func isRepeatPitchClassActive(note: Int) -> Bool {
        guard note >= 0 else { return false }
        let pitchClass = ((note % 12) + 12) % 12
        let mask = repeatPitchClassMask | (expectedPitchMidis.isEmpty ? 0 : expectedPitchMask)
        guard mask != 0 else { return false }
        return (mask & (1 << pitchClass)) != 0
    }

    /// 同音待ち中に期待実音以外へ逸れた誤検出はレガート切替しない。
    private func shouldHoldRepeatModeUnexpectedPitch(quantized: Int) -> Bool {
        guard currentNote >= 0, isRepeatPitchClassActive(note: currentNote) else { return false }
        if shouldTreatRepeatModePitchWobble(quantized: quantized) { return false }
        if isOctaveRelatedJump(quantized: quantized) { return false }
        if expectedPitchMidis.contains(quantized) { return false }
        if expectedPitchMask != 0 {
            let pitchClass = ((quantized % 12) + 12) % 12
            if (expectedPitchMask & (1 << pitchClass)) != 0 { return false }
        }
        return true
    }

    /// 同音連打待ち中の半音以内揺れは再発音にしない（音量リトリガのみ）。
    private func shouldTreatRepeatModePitchWobble(quantized: Int) -> Bool {
        guard currentNote >= 0, isRepeatPitchClassActive(note: currentNote) else { return false }
        if quantized == currentNote { return true }
        if isSamePitchClass(quantized, currentNote), isOctaveRelatedJump(quantized: quantized) {
            if quantized > currentNote, !expectedPitchMidis.contains(quantized) {
                return true
            }
            return false
        }
        return abs(quantized - currentNote) == 1
    }

    private func updateRepeatPeakAndDip(levelDb: Double, attackLevelDb: Double, frameIndex: Int) {
        if levelDb > notePeakDb {
            notePeakDb = levelDb
        }
        if attackLevelDb > notePeakAttackDb {
            notePeakAttackDb = attackLevelDb
        }
        updateRepeatTroughOnly(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
    }

    private func updateRepeatTroughOnly(levelDb: Double, attackLevelDb: Double, frameIndex: Int) {
        if notePeakAttackDb - attackLevelDb >= config.repeatDipDb {
            dippedFromPeak = true
        }
        if dippedFromPeak, attackLevelDb <= noteTroughAttackDb {
            noteTroughAttackDb = attackLevelDb
            noteTroughAttackFrame = frameIndex
        }
    }

    private func repeatAttackLookbackFrames() -> Int {
        let frameMs = max(1, config.frameDurationMs)
        return max(
            config.retriggerLookbackFrames,
            Int((config.repeatAttackWindowMs / frameMs).rounded())
        )
    }

    private func hasRepeatModeAttack(
        attackLevelDb: Double,
        requirePeakRecovery: Bool = false
    ) -> Bool {
        guard dippedFromPeak else { return false }
        guard attackLevelDb - noteTroughAttackDb >= config.repeatRiseDb else { return false }
        if requirePeakRecovery,
           notePeakAttackDb.isFinite,
           attackLevelDb < notePeakAttackDb - config.repeatPeakRecoveryMaxDropDb {
            return false
        }
        return recentAttackRiseWithinLookback(
            attackLevelDb: attackLevelDb,
            lookbackFrames: repeatAttackLookbackFrames()
        ) >= config.repeatRiseDb
    }

    private func recentAttackRiseWithinLookback(attackLevelDb: Double, lookbackFrames: Int) -> Double {
        let start = max(0, recentAttackDbRing.count - lookbackFrames)
        var minRecent = attackLevelDb
        if start < recentAttackDbRing.count {
            for index in start..<recentAttackDbRing.count {
                minRecent = min(minRecent, recentAttackDbRing[index])
            }
        }
        return attackLevelDb - minRecent
    }

    private func emitNoteOff(_ events: inout [PitchInputEvent], note: Int, frameIndex: Int) {
        guard currentNote == note else { return }
        suspendedNote = note
        suspendedNoteOffFrame = frameIndex
        currentNote = -1
        noteOnFrame = -1
        releaseCount = 0
        pendingOff = false
        pushRecentRelease(note: note, frameIndex: frameIndex)
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

    private func recordLevels(levelDb: Double, attackLevelDb: Double, frameIndex: Int) {
        recentLevels.append((levelDb, frameIndex))
        recentAttackDbRing.append(attackLevelDb)
        let maxRing = max(
            config.retriggerLookbackFrames,
            config.retriggerGuardFrames,
            repeatRetriggerGuardFrames(),
            repeatAttackLookbackFrames()
        )
        if recentLevels.count > maxRing {
            recentLevels.removeFirst()
        }
        if recentAttackDbRing.count > maxRing {
            recentAttackDbRing.removeFirst()
        }
    }

    private func recentTrough() -> (db: Double, frame: Int)? {
        let start = max(0, recentLevels.count - config.retriggerLookbackFrames)
        guard start < recentLevels.count else { return nil }
        var trough = recentLevels[start]
        for index in start..<recentLevels.count where recentLevels[index].db <= trough.db {
            trough = recentLevels[index]
        }
        return trough
    }

    private func recentLevelRise(levelDb: Double) -> Double {
        guard let trough = recentTrough() else { return 0 }
        return max(0, levelDb - trough.db)
    }

    private func resolveRepeatModeOnsetFrameIndex(frameIndex: Int) -> Int {
        let lookbackStart = frameIndex - repeatAttackLookbackFrames()
        var onsetFrameIndex = max(lastNoteOnFrame + 1, lookbackStart)
        let troughFrame = noteTroughAttackFrame >= 0 ? noteTroughAttackFrame : noteTroughFrame
        if troughFrame >= 0 {
            onsetFrameIndex = max(onsetFrameIndex, troughFrame + 1)
        }
        return onsetFrameIndex
    }

    private func tryRetrigger(
        _ events: inout [PitchInputEvent],
        levelDb: Double,
        attackLevelDb: Double,
        frameIndex: Int
    ) {
        guard currentNote >= 0 else { return }
        if frameIndex - lastNoteOnFrame < config.retriggerGuardFrames {
            if !isRepeatPitchClassActive(note: currentNote) {
                recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
            }
            return
        }

        if isRepeatPitchClassActive(note: currentNote) {
            if frameIndex - lastNoteOnFrame < repeatRetriggerGuardFrames() {
                recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
                return
            }
            if hasRepeatModeAttack(attackLevelDb: attackLevelDb, requirePeakRecovery: true) {
                let note = currentNote
                let onsetFrameIndex = resolveRepeatModeOnsetFrameIndex(frameIndex: frameIndex)
                emitNoteOff(&events, note: note, frameIndex: frameIndex)
                emitNoteOn(
                    &events,
                    note: note,
                    frameIndex: frameIndex,
                    onsetFrameIndex: onsetFrameIndex,
                    levelDb: levelDb,
                    attackLevelDb: attackLevelDb,
                    preserveAttackPeakReference: true
                )
            }
            return
        }

        recordLevels(levelDb: levelDb, attackLevelDb: attackLevelDb, frameIndex: frameIndex)
        if let trough = recentTrough(), levelDb - trough.db >= config.attackRiseDb {
            let note = currentNote
            let onsetFrameIndex = max(lastNoteOnFrame + 1, min(frameIndex, trough.frame + 1))
            emitNoteOff(&events, note: note, frameIndex: frameIndex)
            emitNoteOn(
                &events,
                note: note,
                frameIndex: frameIndex,
                onsetFrameIndex: onsetFrameIndex,
                levelDb: levelDb,
                attackLevelDb: attackLevelDb
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
