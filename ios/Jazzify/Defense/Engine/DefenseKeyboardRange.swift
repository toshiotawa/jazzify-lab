import Foundation

enum DefenseKeyboardRange {
    static func allPitchMidis(in phrases: [DefensePhraseDefinition]) -> [Int] {
        var midis: [Int] = []
        for phrase in phrases {
            for chord in phrase.chords {
                for note in chord.notes {
                    midis.append(note.pitchMidi)
                }
            }
        }
        return midis
    }

    static func allPitchMidis(in stage: DefenseStageDefinition) -> [Int] {
        allPitchMidis(in: stage.phrases)
    }

    static func resolvedDisplayRange(
        for stage: DefenseStageDefinition,
        phrases: [DefensePhraseDefinition]? = nil,
        displayMode: PianoKeyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    ) -> PianoStagePitchRange {
        switch displayMode {
        case .full88Keys:
            return .full88
        case .questionRangeFit:
            let midis = allPitchMidis(in: phrases ?? stage.phrases)
            guard let minMidi = midis.min(), let maxMidi = midis.max() else {
                return .full88
            }
            let padded = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
                minNoteMidi: minMidi,
                maxNoteMidi: maxMidi
            )
            return PianoKeyboardScrollGeometry.ensureMinimumDisplaySpan(padded)
        }
    }
}
