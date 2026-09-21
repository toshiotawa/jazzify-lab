import Foundation

enum DefenseStaffChordLabel {
    static func labels(for chord: SurvivalPhraseChord) -> [String] {
        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)
        let hasStaffChordNames = chord.notes.contains {
            !($0.staffChordName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true)
        }
        var previousStaffLabel = ""
        return steps.enumerated().map { stepPosition, step in
            var stepStaffLabel = ""
            for noteIndex in step.noteIndices {
                guard noteIndex < chord.notes.count else { continue }
                if let label = chord.notes[noteIndex].staffChordName?.trimmingCharacters(in: .whitespacesAndNewlines),
                   !label.isEmpty {
                    stepStaffLabel = label
                }
            }
            if hasStaffChordNames {
                if !stepStaffLabel.isEmpty, stepStaffLabel != previousStaffLabel {
                    previousStaffLabel = stepStaffLabel
                    return stepStaffLabel
                }
                return ""
            }
            if stepPosition == 0 {
                return chord.chordName
            }
            return ""
        }
    }

    static func label(for chord: SurvivalPhraseChord, stepIndex: Int) -> String {
        let all = labels(for: chord)
        guard stepIndex >= 0, stepIndex < all.count else { return "" }
        return all[stepIndex]
    }
}
