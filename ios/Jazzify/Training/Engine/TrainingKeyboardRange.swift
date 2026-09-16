import Foundation

enum TrainingKeyboardRange {
    static func questionMidis(from question: TrainingQuestion) -> [Int] {
        question.notes.map(\.midi)
    }

    static func stageRange(training: TrainingRow, ignoreNotationInstrument: Bool = false) -> PianoStagePitchRange? {
        let midis = TrainingQuestionBuilder.collectStageMidis(
            training: training,
            ignoreNotationInstrument: ignoreNotationInstrument
        )
        guard let minMidi = midis.min(), let maxMidi = midis.max() else {
            return nil
        }
        return PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: minMidi,
            maxNoteMidi: maxMidi
        )
    }

    static func resolvedDisplayRange(
        stageRange: PianoStagePitchRange?,
        displayMode: PianoKeyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    ) -> PianoStagePitchRange {
        switch displayMode {
        case .full88Keys:
            return .full88
        case .questionRangeFit:
            return stageRange ?? .full88
        }
    }
}
