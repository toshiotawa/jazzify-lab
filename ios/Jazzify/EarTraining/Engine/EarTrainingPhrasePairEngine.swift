import Foundation

/// Web `src/utils/earTrainingPhrasePairEngine.ts` と同等の suffix-buffer マッチャ。
enum EarTrainingPhrasePairEngine {
    struct Pattern: Sendable, Equatable {
        let id: String
        let label: String
        let pcs: [Int]
        let familyId: String
        let carryTailLength: Int
        let priority: Int
        let voicing: [String]?
        let voicingStaves: [Int]?

        init(
            id: String,
            label: String,
            pcs: [Int],
            familyId: String,
            carryTailLength: Int,
            priority: Int = 0,
            voicing: [String]? = nil,
            voicingStaves: [Int]? = nil
        ) {
            self.id = id
            self.label = label
            self.pcs = pcs
            self.familyId = familyId
            self.carryTailLength = carryTailLength
            self.priority = priority
            self.voicing = voicing
            self.voicingStaves = voicingStaves
        }
    }

    enum NoteResult: Sendable, Equatable {
        case progress
        case complete
        case resync
        case miss
    }

    struct RuntimeState: Sendable, Equatable {
        var buffer: [Int]
        var lastCompletedPatternId: String?
    }

    struct Evaluation: Sendable, Equatable {
        let result: NoteResult
        let completedPattern: Pattern?
        let nextState: RuntimeState
    }

    static func createInitialState() -> RuntimeState {
        RuntimeState(buffer: [], lastCompletedPatternId: nil)
    }

    static let cm7Patterns: [Pattern] = [
        Pattern(id: "CM7-A-CD", label: "A", pcs: [0, 2], familyId: "CM7-A", carryTailLength: 0),
        Pattern(id: "CM7-A-DC", label: "A", pcs: [2, 0], familyId: "CM7-A", carryTailLength: 0),
        Pattern(id: "CM7-B-EG", label: "B", pcs: [4, 7], familyId: "CM7-B", carryTailLength: 0),
        Pattern(id: "CM7-B-GE", label: "B", pcs: [7, 4], familyId: "CM7-B", carryTailLength: 0),
        Pattern(id: "CM7-C-AB", label: "C", pcs: [9, 11], familyId: "CM7-C", carryTailLength: 0),
        Pattern(id: "CM7-C-BA", label: "C", pcs: [11, 9], familyId: "CM7-C", carryTailLength: 0),
        Pattern(id: "CM7-D-BC", label: "D", pcs: [11, 0], familyId: "CM7-D", carryTailLength: 1),
        Pattern(id: "CM7-Ap-DBC", label: "A'", pcs: [2, 11, 0], familyId: "CM7-Ap", carryTailLength: 1),
        Pattern(id: "CM7-Ap-BDC", label: "A'", pcs: [11, 2, 0], familyId: "CM7-Ap", carryTailLength: 1),
        Pattern(
            id: "CM7-App-BDDbBC",
            label: "A''",
            pcs: [11, 2, 1, 11, 0],
            familyId: "CM7-App",
            carryTailLength: 1
        ),
    ]

    static func maxPatternLength(_ patterns: [Pattern]) -> Int {
        patterns.reduce(0) { max($0, $1.pcs.count) }
    }

    static func isPrefixOfAny(_ buffer: [Int], patterns: [Pattern]) -> Bool {
        guard !buffer.isEmpty else { return false }
        for pattern in patterns {
            if buffer.count > pattern.pcs.count { continue }
            var ok = true
            for i in 0..<buffer.count where buffer[i] != pattern.pcs[i] {
                ok = false
                break
            }
            if ok { return true }
        }
        return false
    }

    static func patternMatchesSuffix(_ trial: [Int], pattern: Pattern) -> Bool {
        if pattern.pcs.count > trial.count { return false }
        let offset = trial.count - pattern.pcs.count
        for i in 0..<pattern.pcs.count where trial[offset + i] != pattern.pcs[i] {
            return false
        }
        return true
    }

    static func longestSuffixPrefix(_ trial: [Int], patterns: [Pattern]) -> [Int] {
        let maxLen = min(trial.count, max(0, maxPatternLength(patterns) - 1))
        guard maxLen >= 1 else { return [] }
        for len in stride(from: maxLen, through: 1, by: -1) {
            let suffix = Array(trial.suffix(len))
            if isPrefixOfAny(suffix, patterns: patterns) {
                return suffix
            }
        }
        return []
    }

    static func evaluateNoteOn(
        state: RuntimeState,
        pitchClass: Int,
        patterns: [Pattern]
    ) -> Evaluation {
        let normalizedPc = ((pitchClass % 12) + 12) % 12
        let trial = state.buffer + [normalizedPc]

        let completed = patterns
            .filter { patternMatchesSuffix(trial, pattern: $0) }
            .sorted { a, b in
                if a.pcs.count != b.pcs.count { return a.pcs.count > b.pcs.count }
                return a.priority > b.priority
            }

        if let chosen = completed.first {
            let carry: [Int]
            if chosen.carryTailLength > 0 {
                carry = Array(chosen.pcs.suffix(chosen.carryTailLength))
            } else {
                carry = []
            }
            let safeCarry = isPrefixOfAny(carry, patterns: patterns) ? carry : []

            return Evaluation(
                result: .complete,
                completedPattern: chosen,
                nextState: RuntimeState(
                    buffer: safeCarry,
                    lastCompletedPatternId: chosen.id
                )
            )
        }

        let nextBuffer = longestSuffixPrefix(trial, patterns: patterns)
        if !nextBuffer.isEmpty {
            let wasResync =
                !state.buffer.isEmpty
                && nextBuffer.count == 1
                && nextBuffer[0] == normalizedPc

            return Evaluation(
                result: wasResync ? .resync : .progress,
                completedPattern: nil,
                nextState: RuntimeState(
                    buffer: nextBuffer,
                    lastCompletedPatternId: state.lastCompletedPatternId
                )
            )
        }

        return Evaluation(
            result: .miss,
            completedPattern: nil,
            nextState: RuntimeState(
                buffer: [],
                lastCompletedPatternId: state.lastCompletedPatternId
            )
        )
    }

    static func handleChordChange(
        state: RuntimeState,
        nextPatterns: [Pattern]
    ) -> RuntimeState {
        RuntimeState(
            buffer: longestSuffixPrefix(state.buffer, patterns: nextPatterns),
            lastCompletedPatternId: state.lastCompletedPatternId
        )
    }
}
