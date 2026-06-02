import CryptoKit
import Foundation

struct EarTrainingPhrasePairAdlibStep: Equatable, Sendable, Identifiable {
    let id: UUID
    let orderIndex: Int
    let chordName: String
    let patternGroupId: UUID
    let measureNumber: Int?
    let startTimeSec: Double
    let endTimeSec: Double
    let quote: String?
    let inputDisabled: Bool
}

struct EarTrainingPhrasePairAdlibBootstrap: Equatable, Sendable {
    let bgmUrl: String
    let keyFifths: Int
    let loopDurationSec: Double
    let steps: [EarTrainingPhrasePairAdlibStep]
    let patternsByGroupId: [UUID: [EarTrainingPhrasePairEngine.Pattern]]
}

enum EarTrainingPhrasePairTimeline {
    static func step(
        at loopTimeSec: Double,
        steps: [EarTrainingPhrasePairAdlibStep],
        loopDurationSec: Double
    ) -> EarTrainingPhrasePairAdlibStep? {
        guard !steps.isEmpty, loopDurationSec > 0 else { return nil }
        let normalized = loopTimeSec.truncatingRemainder(dividingBy: loopDurationSec)
        let safe = normalized < 0 ? normalized + loopDurationSec : normalized
        for step in steps where safe >= step.startTimeSec && safe < step.endTimeSec {
            return step
        }
        return steps.last
    }

    static func patterns(
        for step: EarTrainingPhrasePairAdlibStep?,
        patternsByGroupId: [UUID: [EarTrainingPhrasePairEngine.Pattern]]
    ) -> [EarTrainingPhrasePairEngine.Pattern] {
        guard let step else { return [] }
        return patternsByGroupId[step.patternGroupId] ?? []
    }

    static func nextBoundarySec(
        steps: [EarTrainingPhrasePairAdlibStep],
        loopTimeSec: Double,
        loopDurationSec: Double
    ) -> Double? {
        guard let current = step(at: loopTimeSec, steps: steps, loopDurationSec: loopDurationSec) else {
            return nil
        }
        if let next = steps.first(where: { $0.orderIndex == current.orderIndex + 1 }) {
            return next.startTimeSec
        }
        return loopDurationSec
    }
}

enum EarTrainingPhrasePairBattleEngine {
    static let maxFireballsPerStep = 16

    struct WindowState: Sendable, Equatable {
        var stepId: UUID?
        var fireCount: Int
    }

    struct NoteResult: Sendable, Equatable {
        let evaluation: EarTrainingPhrasePairEngine.Evaluation
        let nextMatcherState: EarTrainingPhrasePairEngine.RuntimeState
        let nextWindow: WindowState
        let shouldFire: Bool
        let enemyDamage: Int
        let playerDamage: Int
    }

    static func createWindow(stepId: UUID? = nil) -> WindowState {
        WindowState(stepId: stepId, fireCount: 0)
    }

    static func applyStepTransition(_ current: WindowState, stepId: UUID?) -> WindowState {
        if current.stepId == stepId { return current }
        return createWindow(stepId: stepId)
    }

    static func handleNoteOn(
        matcherState: EarTrainingPhrasePairEngine.RuntimeState,
        window: WindowState,
        patterns: [EarTrainingPhrasePairEngine.Pattern],
        midiNote: Int,
        damage: EarTrainingDamageConfig
    ) -> NoteResult {
        let evaluation = EarTrainingPhrasePairEngine.evaluateNoteOn(
            state: matcherState,
            pitchClass: midiNote,
            patterns: patterns
        )

        if evaluation.result == .miss {
            return NoteResult(
                evaluation: evaluation,
                nextMatcherState: evaluation.nextState,
                nextWindow: window,
                shouldFire: false,
                enemyDamage: 0,
                playerDamage: damage.miss
            )
        }

        let shouldFire =
            evaluation.result == .complete
            && window.fireCount < maxFireballsPerStep

        let nextWindow: WindowState
        if shouldFire {
            nextWindow = WindowState(stepId: window.stepId, fireCount: window.fireCount + 1)
        } else {
            nextWindow = window
        }

        return NoteResult(
            evaluation: evaluation,
            nextMatcherState: evaluation.nextState,
            nextWindow: nextWindow,
            shouldFire: shouldFire,
            enemyDamage: shouldFire ? damage.perCorrectNote : 0,
            playerDamage: 0
        )
    }
}

enum EarTrainingPhrasePairStaff {
    private static let noteNamesByPitchClass = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    static func pickLongestPattern(
        _ patterns: [EarTrainingPhrasePairEngine.Pattern]
    ) -> EarTrainingPhrasePairEngine.Pattern? {
        guard var best = patterns.first else { return nil }
        for candidate in patterns.dropFirst() {
            let lengthDiff = candidate.pcs.count - best.pcs.count
            if lengthDiff > 0 || (lengthDiff == 0 && candidate.priority > best.priority) {
                best = candidate
            }
        }
        return best
    }

    static func pickDisplayPattern(
        buffer: [Int],
        patterns: [EarTrainingPhrasePairEngine.Pattern]
    ) -> EarTrainingPhrasePairEngine.Pattern? {
        guard !buffer.isEmpty else { return nil }
        var best: EarTrainingPhrasePairEngine.Pattern?
        var bestPrefix = 0
        for pattern in patterns {
            let prefixLen = longestCommonPrefixLength(buffer, pattern.pcs)
            guard prefixLen > 0 else { continue }
            if let current = best {
                if prefixLen > bestPrefix
                    || (prefixLen == bestPrefix && pattern.pcs.count > current.pcs.count)
                    || (prefixLen == bestPrefix && pattern.pcs.count == current.pcs.count && pattern.priority > current.priority) {
                    best = pattern
                    bestPrefix = prefixLen
                }
            } else {
                best = pattern
                bestPrefix = prefixLen
            }
        }
        return best
    }

    static func buildStaffGroups(
        pattern: EarTrainingPhrasePairEngine.Pattern?,
        chordName: String,
        visibleNoteCount: Int? = nil,
        isRest: Bool = false
    ) -> [EarTrainingChordVoicingStaffLayout.GroupInput] {
        if isRest {
            return [EarTrainingChordVoicingStaffLayout.GroupInput(
                id: staffGroupUUID(patternId: "rest", noteIndex: 0),
                chordName: chordName,
                voicing: [],
                voicingStaves: [],
                measureOffset: 0,
                isRest: true
            )]
        }
        guard let pattern else { return [] }
        let voicing = resolvedVoicing(for: pattern)
        let staves = pattern.voicingStaves ?? []
        let noteCount = min(voicing.count, visibleNoteCount ?? voicing.count)
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        groups.reserveCapacity(noteCount)

        for index in 0..<noteCount {
            let noteName = voicing[index].trimmingCharacters(in: .whitespacesAndNewlines)
            if noteName.isEmpty { continue }
            let staff = staves.indices.contains(index) && staves[index] == 2 ? 2 : 1
            groups.append(EarTrainingChordVoicingStaffLayout.GroupInput(
                id: staffGroupUUID(patternId: pattern.id, noteIndex: index),
                chordName: groups.isEmpty ? chordName : "",
                voicing: [noteName],
                voicingStaves: [staff],
                measureOffset: 0,
                isRest: false
            ))
        }
        return groups
    }

    static func correctPitchClassesByGroup(
        pattern: EarTrainingPhrasePairEngine.Pattern?,
        buffer: [Int]
    ) -> [UUID: Set<Int>] {
        guard let pattern, !buffer.isEmpty else { return [:] }
        let matchedLength = longestCommonPrefixLength(buffer, pattern.pcs)
        guard matchedLength > 0 else { return [:] }
        let voicing = resolvedVoicing(for: pattern)
        var map: [UUID: Set<Int>] = [:]
        let limit = min(matchedLength, voicing.count, pattern.pcs.count)
        guard limit > 0 else { return [:] }
        for index in 0..<limit {
            let noteName = voicing[index].trimmingCharacters(in: .whitespacesAndNewlines)
            if noteName.isEmpty { continue }
            map[staffGroupUUID(patternId: pattern.id, noteIndex: index)] = [normalizePitchClass(pattern.pcs[index])]
        }
        return map
    }

    private static func longestCommonPrefixLength(_ a: [Int], _ b: [Int]) -> Int {
        let limit = min(a.count, b.count)
        guard limit > 0 else { return 0 }
        for index in 0..<limit where normalizePitchClass(a[index]) != normalizePitchClass(b[index]) {
            return index
        }
        return limit
    }

    private static func resolvedVoicing(for pattern: EarTrainingPhrasePairEngine.Pattern) -> [String] {
        if let voicing = pattern.voicing, !voicing.isEmpty {
            return voicing
        }
        var fallback: [String] = []
        fallback.reserveCapacity(pattern.pcs.count)
        for pc in pattern.pcs {
            fallback.append("\(noteNamesByPitchClass[normalizePitchClass(pc)])4")
        }
        return fallback
    }

    private static func normalizePitchClass(_ pitchClass: Int) -> Int {
        ((pitchClass % 12) + 12) % 12
    }

    private static func staffGroupUUID(patternId: String, noteIndex: Int) -> UUID {
        let payload = Data("\(patternId):n\(noteIndex)".utf8)
        let hash = SHA256.hash(data: payload)
        var uuidBytes = [UInt8]()
        uuidBytes.reserveCapacity(16)
        uuidBytes.append(contentsOf: hash.prefix(16))
        uuidBytes[6] = (uuidBytes[6] & 0x0F) | 0x40
        uuidBytes[8] = (uuidBytes[8] & 0x3F) | 0x80
        let tuple: uuid_t = (
            uuidBytes[0], uuidBytes[1], uuidBytes[2], uuidBytes[3],
            uuidBytes[4], uuidBytes[5], uuidBytes[6], uuidBytes[7],
            uuidBytes[8], uuidBytes[9], uuidBytes[10], uuidBytes[11],
            uuidBytes[12], uuidBytes[13], uuidBytes[14], uuidBytes[15]
        )
        return UUID(uuid: tuple)
    }
}
