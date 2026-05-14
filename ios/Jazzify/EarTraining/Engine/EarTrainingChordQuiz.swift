import Foundation

/// Web `pickNextQuizIndex` / `isQuizClear`（[src/utils/earTrainingChordQuiz.ts] と同じ契約）。
enum EarTrainingChordQuiz {
    enum QuestionOrder {
        case random
        case sequential

        init(sequential: Bool) {
            self = sequential ? .sequential : .random
        }
    }

    static func pickNextQuizIndex(
        items: [EarTrainingChordQuizItem],
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
}
