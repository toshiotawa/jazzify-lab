import Foundation

/// Web `pickNextQuizIndex` / `isQuizClear`（[src/utils/earTrainingChordQuiz.ts] と同じ契約）。
enum EarTrainingChordQuiz {
    struct Question: Identifiable, Sendable {
        let id: String
        let orderIndex: Int
        let measureNumber: Int?
        let keyFifths: Int?
        let chords: [EarTrainingPhraseChordDetail]
    }

    enum QuestionOrder {
        case random
        case sequential

        init(sequential: Bool) {
            self = sequential ? .sequential : .random
        }
    }

    static func pickNextQuizIndex<Item>(
        items: [Item],
        order: QuestionOrder,
        prevIndex: Int?,
        rand: () -> Double
    ) -> Int {
        let n = items.count
        if n <= 0 {
            return 0
        }
        if n == 1 {
            return 0
        }
        if order == .sequential {
            return ((prevIndex ?? -1) + 1) % n
        }
        var next = Int(floor(rand() * Double(n)))
        if let prevIndex, next == prevIndex {
            var guardCount = 0
            while next == prevIndex && guardCount < 32 {
                next = Int(floor(rand() * Double(n)))
                guardCount += 1
            }
            if next == prevIndex {
                next = (prevIndex + 1) % n
            }
        }
        return next
    }

    static func isQuizClear(correct: Int, required: Int) -> Bool {
        correct >= max(0, required)
    }

    static func buildQuestions(stage: EarTrainingStageDetail) -> [Question] {
        let itemQuestions = buildQuestions(
            items: stage.sortedChordQuizItems(),
            syntheticPhraseId: stage.id
        )
        if !itemQuestions.isEmpty {
            return itemQuestions
        }
        return buildQuestions(phrases: stage.sortedPhrases())
    }

    static func activeChord(in question: Question?, completedChordIds: Set<UUID>?) -> EarTrainingPhraseChordDetail? {
        guard let question else { return nil }
        return question.chords.first { chord in
            chordHasPlayableVoicing(chord) && (completedChordIds?.contains(chord.id) ?? false) == false
        }
    }

    static func isQuestionCompleted(_ question: Question?, completedChordIds: Set<UUID>) -> Bool {
        guard let question, !question.chords.isEmpty else { return false }
        return question.chords.allSatisfy { chord in
            !chordHasPlayableVoicing(chord) || completedChordIds.contains(chord.id)
        }
    }

    private struct MutableGroup {
        let id: String
        var orderIndex: Int
        let measureNumber: Int?
        let keyFifths: Int?
        var chords: [EarTrainingPhraseChordDetail]
    }

    private static func chordHasPlayableVoicing(_ chord: EarTrainingPhraseChordDetail) -> Bool {
        !(chord.voicing ?? []).isEmpty
    }

    private static func normalizedPositiveInteger(_ value: Int?) -> Int? {
        guard let value, value >= 1 else { return nil }
        return value
    }

    private static func sortChordsForQuestion(
        _ lhs: EarTrainingPhraseChordDetail,
        _ rhs: EarTrainingPhraseChordDetail
    ) -> Bool {
        let lm = lhs.measureNumber ?? Int.max
        let rm = rhs.measureNumber ?? Int.max
        if lm != rm { return lm < rm }
        let lb = lhs.beatOffset ?? Double.greatestFiniteMagnitude
        let rb = rhs.beatOffset ?? Double.greatestFiniteMagnitude
        if lb != rb { return lb < rb }
        let ls = lhs.startTimeSec ?? Double.greatestFiniteMagnitude
        let rs = rhs.startTimeSec ?? Double.greatestFiniteMagnitude
        if ls != rs { return ls < rs }
        return lhs.orderIndex < rhs.orderIndex
    }

    private static func question(from group: MutableGroup) -> Question {
        Question(
            id: group.id,
            orderIndex: group.orderIndex,
            measureNumber: group.measureNumber,
            keyFifths: group.keyFifths,
            chords: group.chords.sorted(by: sortChordsForQuestion)
        )
    }

    private static func chord(from item: EarTrainingChordQuizItem, phraseId: UUID) -> EarTrainingPhraseChordDetail {
        EarTrainingPhraseChordDetail(
            id: item.id,
            phraseId: phraseId,
            orderIndex: item.orderIndex,
            chordName: item.chordName,
            measureNumber: item.measureNumber,
            beatOffset: item.beatOffset,
            durationBeats: item.durationBeats,
            startTimeSec: nil,
            endTimeSec: nil,
            voicing: item.voicing,
            voicingStaves: item.voicingStaves,
            quote: nil
        )
    }

    private static func buildQuestions(
        items: [EarTrainingChordQuizItem],
        syntheticPhraseId: UUID
    ) -> [Question] {
        var groups: [MutableGroup] = []
        var groupIndexByMeasure: [Int: Int] = [:]
        let sortedItems = items
            .filter { !$0.voicing.isEmpty }
            .sorted {
                let lhs = chord(from: $0, phraseId: syntheticPhraseId)
                let rhs = chord(from: $1, phraseId: syntheticPhraseId)
                return sortChordsForQuestion(lhs, rhs)
            }

        for item in sortedItems {
            guard let measureNumber = normalizedPositiveInteger(item.measureNumber) else {
                let phraseId = "chord-quiz-item-\(item.id.uuidString)"
                groups.append(
                    MutableGroup(
                        id: phraseId,
                        orderIndex: item.orderIndex,
                        measureNumber: nil,
                        keyFifths: nil,
                        chords: [chord(from: item, phraseId: syntheticPhraseId)]
                    )
                )
                continue
            }

            if let index = groupIndexByMeasure[measureNumber] {
                groups[index].orderIndex = min(groups[index].orderIndex, item.orderIndex)
                groups[index].chords.append(chord(from: item, phraseId: syntheticPhraseId))
            } else {
                groupIndexByMeasure[measureNumber] = groups.count
                groups.append(
                    MutableGroup(
                        id: "chord-quiz-measure-\(measureNumber)",
                        orderIndex: item.orderIndex,
                        measureNumber: measureNumber,
                        keyFifths: nil,
                        chords: [chord(from: item, phraseId: syntheticPhraseId)]
                    )
                )
            }
        }

        return groups
            .map { question(from: $0) }
            .sorted { $0.orderIndex < $1.orderIndex }
    }

    private static func buildQuestions(phrases: [EarTrainingPhraseDetail]) -> [Question] {
        var groups: [MutableGroup] = []
        for phrase in phrases {
            var groupIndexByMeasure: [Int: Int] = [:]
            let chords = (phrase.chords ?? [])
                .filter(chordHasPlayableVoicing)
                .sorted(by: sortChordsForQuestion)

            for chord in chords {
                guard let measureNumber = normalizedPositiveInteger(chord.measureNumber) else {
                    groups.append(
                        MutableGroup(
                            id: "\(phrase.id.uuidString)-chord-\(chord.id.uuidString)",
                            orderIndex: groups.count,
                            measureNumber: nil,
                            keyFifths: phrase.keyFifths,
                            chords: [chord]
                        )
                    )
                    continue
                }

                if let index = groupIndexByMeasure[measureNumber] {
                    groups[index].chords.append(chord)
                } else {
                    groupIndexByMeasure[measureNumber] = groups.count
                    groups.append(
                        MutableGroup(
                            id: "\(phrase.id.uuidString)-measure-\(measureNumber)",
                            orderIndex: groups.count,
                            measureNumber: measureNumber,
                            keyFifths: phrase.keyFifths,
                            chords: [chord]
                        )
                    )
                }
            }
        }
        return groups.map { question(from: $0) }
    }
}
