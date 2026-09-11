import Foundation

enum DefenseKeyboardRange {
    static func allPitchMidis(in stage: DefenseStageDefinition) -> [Int] {
        var midis: [Int] = []
        for phrase in stage.phrases {
            for chord in phrase.chords {
                for note in chord.notes {
                    midis.append(note.pitchMidi)
                }
            }
        }
        return midis
    }

    static func resolvedDisplayRange(
        for stage: DefenseStageDefinition,
        displayMode: PianoKeyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    ) -> PianoStagePitchRange {
        switch displayMode {
        case .full88Keys:
            return .full88
        case .questionRangeFit:
            let midis = allPitchMidis(in: stage)
            guard let minMidi = midis.min(), let maxMidi = midis.max() else {
                return .full88
            }
            return PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
                minNoteMidi: minMidi,
                maxNoteMidi: maxMidi
            )
        }
    }
}
