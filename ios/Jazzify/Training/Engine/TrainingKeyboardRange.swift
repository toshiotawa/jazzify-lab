import Foundation

enum TrainingKeyboardRange {
    static func questionMidis(from question: TrainingQuestion) -> [Int] {
        question.notes.map(\.midi)
    }

    static func expandRange(
        accumulated: PianoStagePitchRange?,
        questionMidis: [Int]
    ) -> PianoStagePitchRange? {
        guard !questionMidis.isEmpty else { return accumulated }
        guard let minMidi = questionMidis.min(), let maxMidi = questionMidis.max() else {
            return accumulated
        }
        let nextMin = min(accumulated?.minMidi ?? minMidi, minMidi)
        let nextMax = max(accumulated?.maxMidi ?? maxMidi, maxMidi)
        return PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: nextMin,
            maxNoteMidi: nextMax
        )
    }

    static func resolvedDisplayRange(
        accumulated: PianoStagePitchRange?,
        displayMode: PianoKeyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    ) -> PianoStagePitchRange {
        switch displayMode {
        case .full88Keys:
            return .full88
        case .questionRangeFit:
            return accumulated ?? .full88
        }
    }
}
