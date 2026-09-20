import Foundation

struct DefenseSeparateTracksPhrasePcm: Sendable {
    let left: [Float]
    let right: [Float]
}

struct DefenseSeparateTracksPreparedSet: Sendable {
    let grid: DefenseSeparateTracksGrid
    let bgmLeft: [Float]
    let bgmRight: [Float]
    let phrasePcms: [DefenseSeparateTracksPhrasePcm]
    let speedPercent: Int
    let setId: Int
}

struct DefenseSeparateTracksPhraseRequest: Sendable {
    let phraseIndex: Int
    let revision: Int
    let generation: UInt64
}

struct DefenseSeparateTracksTempoRequest: Sendable {
    let preparedSet: DefenseSeparateTracksPreparedSet
    let tempoRevision: Int
    let generation: UInt64
}

final class DefenseSeparateTracksMixerState: @unchecked Sendable {
    var sessionGeneration: UInt64 = 0
    var absoluteCycle: Int = 0
    var phaseFrame: Int = 0
    var audiblePhraseIndex: Int = 0
    var desiredPhraseIndex: Int = 0
    var scheduled: DefensePhraseSchedule?
    var scheduledConfirmed = false
    var activeSet: DefenseSeparateTracksPreparedSet
    var pendingTempoSet: DefenseSeparateTracksPreparedSet?
    var pendingTempoRevision = 0
    var paused = false
    var bgmGain: Float = 0.5
    var melodyGain: Float = 0.5
    var tempoCrossfadeFramesRemaining = 0
    var tempoCrossfadePreviousSet: DefenseSeparateTracksPreparedSet?

    init(preparedSet: DefenseSeparateTracksPreparedSet, sessionGeneration: UInt64, initialPhraseIndex: Int) {
        self.activeSet = preparedSet
        self.sessionGeneration = sessionGeneration
        self.audiblePhraseIndex = initialPhraseIndex
        self.desiredPhraseIndex = initialPhraseIndex
    }
}

enum DefenseSeparateTracksMix {
    private static let tempoCrossfadeFrames = 220

    static func renderBlock(
        state: DefenseSeparateTracksMixerState,
        outputLeft: UnsafeMutablePointer<Float>,
        outputRight: UnsafeMutablePointer<Float>,
        blockFrames: Int,
        leadFrames: Int,
        phraseRequest: DefenseSeparateTracksPhraseRequest?,
        tempoRequest: DefenseSeparateTracksTempoRequest?
    ) -> (appliedPhrase: Bool, appliedTempo: Bool) {
        ingestPhraseRequest(state: state, request: phraseRequest, leadFrames: leadFrames)
        ingestTempoRequest(state: state, request: tempoRequest)

        if state.paused {
            for i in 0..<blockFrames {
                outputLeft[i] = 0
                outputRight[i] = 0
            }
            return (false, false)
        }

        var appliedPhrase = false
        var appliedTempo = false
        let safeF = max(1, state.activeSet.grid.cycleFrames)

        for i in 0..<blockFrames {
            if state.phaseFrame == 0,
               state.scheduled != nil || state.pendingTempoSet != nil {
                let hadTempo = state.pendingTempoSet != nil
                let hadPhrase = state.scheduled != nil && state.absoluteCycle == state.scheduled?.targetCycle
                applyBoundaryActions(state: state)
                if hadTempo { appliedTempo = true }
                if hadPhrase { appliedPhrase = true }
            }

            updateScheduleConfirmation(state: state, leadFrames: leadFrames)

            let bgmFrame = DefenseSeparateTracksTransport.bgmReadFrame(
                absoluteCycle: state.absoluteCycle,
                phaseFrame: state.phaseFrame,
                cycleFrames: state.activeSet.grid.cycleFrames,
                cyclesPerForm: state.activeSet.grid.cyclesPerForm
            )

            let bgm = mixBgmSample(set: state.activeSet, frame: bgmFrame)
            let melody = mixPhraseSample(
                set: state.activeSet,
                phraseIndex: state.audiblePhraseIndex,
                frame: state.phaseFrame
            )

            var outL = bgm.left * state.bgmGain + melody.left * state.melodyGain
            var outR = bgm.right * state.bgmGain + melody.right * state.melodyGain

            if state.tempoCrossfadeFramesRemaining > 0,
               let previous = state.tempoCrossfadePreviousSet {
                let prevBgmFrame = DefenseSeparateTracksTransport.bgmReadFrame(
                    absoluteCycle: state.absoluteCycle,
                    phaseFrame: state.phaseFrame,
                    cycleFrames: previous.grid.cycleFrames,
                    cyclesPerForm: previous.grid.cyclesPerForm
                )
                let prevBgm = mixBgmSample(set: previous, frame: prevBgmFrame)
                let prevMelody = mixPhraseSample(
                    set: previous,
                    phraseIndex: state.audiblePhraseIndex,
                    frame: state.phaseFrame
                )
                let fadeOut = Float(state.tempoCrossfadeFramesRemaining) / Float(tempoCrossfadeFrames)
                let fadeIn = 1 - fadeOut
                outL = (prevBgm.left * state.bgmGain + prevMelody.left * state.melodyGain) * fadeOut + outL * fadeIn
                outR = (prevBgm.right * state.bgmGain + prevMelody.right * state.melodyGain) * fadeOut + outR * fadeIn
                state.tempoCrossfadeFramesRemaining -= 1
                if state.tempoCrossfadeFramesRemaining <= 0 {
                    state.tempoCrossfadePreviousSet = nil
                }
            }

            outputLeft[i] = outL
            outputRight[i] = outR
            state.phaseFrame += 1
            if state.phaseFrame >= safeF {
                state.phaseFrame = 0
                state.absoluteCycle += 1
            }
        }

        return (appliedPhrase, appliedTempo)
    }

    private static func mixBgmSample(set: DefenseSeparateTracksPreparedSet, frame: Int) -> (left: Float, right: Float) {
        let safeFrame = max(0, min(frame, set.grid.bgmFrames - 1))
        return (
            sample(set.bgmLeft, frame: safeFrame),
            sample(set.bgmRight, frame: safeFrame)
        )
    }

    private static func mixPhraseSample(
        set: DefenseSeparateTracksPreparedSet,
        phraseIndex: Int,
        frame: Int
    ) -> (left: Float, right: Float) {
        guard !set.phrasePcms.isEmpty else { return (0, 0) }
        let count = set.phrasePcms.count
        let safeIndex = ((phraseIndex % count) + count) % count
        let phrase = set.phrasePcms[safeIndex]
        let safeFrame = max(0, min(frame, set.grid.cycleFrames - 1))
        return (sample(phrase.left, frame: safeFrame), sample(phrase.right, frame: safeFrame))
    }

    private static func sample(_ data: [Float], frame: Int) -> Float {
        guard frame >= 0, frame < data.count else { return 0 }
        return data[frame]
    }

    private static func ingestPhraseRequest(
        state: DefenseSeparateTracksMixerState,
        request: DefenseSeparateTracksPhraseRequest?,
        leadFrames: Int
    ) {
        guard let request, request.generation == state.sessionGeneration else { return }
        let count = max(1, state.activeSet.phrasePcms.count)
        let nextDesired = ((request.phraseIndex % count) + count) % count
        state.desiredPhraseIndex = nextDesired

        let planned = DefenseSeparateTracksTransport.planPhraseReservation(
            absoluteCycle: state.absoluteCycle,
            phaseFrame: state.phaseFrame,
            cycleFrames: state.activeSet.grid.cycleFrames,
            leadFrames: leadFrames,
            phraseIndex: nextDesired,
            revision: request.revision,
            generation: request.generation
        )

        if let existing = state.scheduled, state.scheduledConfirmed {
            state.scheduled = DefensePhraseSchedule(
                targetCycle: existing.targetCycle,
                phraseIndex: nextDesired,
                revision: request.revision,
                generation: request.generation
            )
            return
        }

        if let existing = state.scheduled,
           !state.scheduledConfirmed,
           existing.targetCycle == planned.targetCycle {
            state.scheduled = DefensePhraseSchedule(
                targetCycle: existing.targetCycle,
                phraseIndex: nextDesired,
                revision: request.revision,
                generation: request.generation
            )
            return
        }

        state.scheduled = planned
        state.scheduledConfirmed = false
    }

    private static func ingestTempoRequest(
        state: DefenseSeparateTracksMixerState,
        request: DefenseSeparateTracksTempoRequest?
    ) {
        guard let request, request.generation == state.sessionGeneration else { return }
        if request.preparedSet.setId == state.activeSet.setId { return }
        if state.pendingTempoRevision >= request.tempoRevision { return }
        state.pendingTempoSet = request.preparedSet
        state.pendingTempoRevision = request.tempoRevision
    }

    private static func applyBoundaryActions(state: DefenseSeparateTracksMixerState) {
        if let pending = state.pendingTempoSet {
            let previous = state.activeSet
            state.activeSet = pending
            state.pendingTempoSet = nil
            state.phaseFrame = 0
            state.tempoCrossfadeFramesRemaining = tempoCrossfadeFrames
            state.tempoCrossfadePreviousSet = previous
        }

        if let scheduled = state.scheduled, state.absoluteCycle == scheduled.targetCycle {
            let count = max(1, state.activeSet.phrasePcms.count)
            state.audiblePhraseIndex = ((scheduled.phraseIndex % count) + count) % count
            state.scheduled = nil
            state.scheduledConfirmed = false
        }

        if state.scheduled == nil, state.desiredPhraseIndex != state.audiblePhraseIndex {
            state.scheduled = DefenseSeparateTracksTransport.planPhraseReservation(
                absoluteCycle: state.absoluteCycle,
                phaseFrame: state.phaseFrame,
                cycleFrames: state.activeSet.grid.cycleFrames,
                leadFrames: 0,
                phraseIndex: state.desiredPhraseIndex,
                revision: 0,
                generation: state.sessionGeneration
            )
            state.scheduledConfirmed = false
        }
    }

    private static func updateScheduleConfirmation(
        state: DefenseSeparateTracksMixerState,
        leadFrames: Int
    ) {
        guard let scheduled = state.scheduled, !state.scheduledConfirmed else { return }
        let safeF = max(1, state.activeSet.grid.cycleFrames)
        let remaining = safeF - state.phaseFrame
        let cyclesUntil = scheduled.targetCycle - (state.absoluteCycle + 1)
        let framesUntil = remaining + max(0, cyclesUntil) * safeF
        if framesUntil < leadFrames {
            state.scheduledConfirmed = true
        }
    }
}
