import Foundation

typealias DefenseTutorialStaffGroup = EarTrainingChordVoicingStaffLayout.GroupInput

struct DefenseTutorialPhraseBuildResult: Equatable, Sendable {
    let stage: DefenseStageDefinition
    let phrase: DefensePhraseDefinition
    let chord: SurvivalPhraseChord
    let staffGroups: [DefenseTutorialStaffGroup]
    let concertMidis: [Int]
    let recommendedMidis: [Int]
    let writtenOctave: DefenseTutorialWrittenOctave
}

enum BuildDefenseTutorialPhrase {
    private static let concertNoteNames = [
        "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
    ]

    private static func midiFromWritten(octave: Int, pitchClass: Int) -> Int {
        (octave + 1) * 12 + pitchClass
    }

    private static func concertMidiToName(_ midi: Int) -> String {
        let pitchClass = ((midi % 12) + 12) % 12
        let octave = midi / 12 - 1
        return "\(concertNoteNames[pitchClass])\(octave)"
    }

    static func pickWrittenOctave(_ settings: DefenseTutorialNotationSettings) -> DefenseTutorialWrittenOctave {
        let writtenOffset = DefenseTutorialNotation.resolveWrittenOffset(settings)
        let candidates: [DefenseTutorialWrittenOctave] = [.three, .four, .five, .six]

        var bestOctave: DefenseTutorialWrittenOctave = .four
        var bestDistance = Int.max

        for octave in candidates {
            let concertMidiC = midiFromWritten(octave: octave.rawValue, pitchClass: 0) - writtenOffset
            let distance = abs(concertMidiC - DefenseTutorialConstants.targetConcertMidi)
            if distance < bestDistance || (distance == bestDistance && octave.rawValue > bestOctave.rawValue) {
                bestDistance = distance
                bestOctave = octave
            }
        }

        return bestOctave
    }

    private static let staffGroupIds: [UUID] = [
        UUID(uuidString: "00000000-0000-0000-0000-000000000001")!,
        UUID(uuidString: "00000000-0000-0000-0000-000000000002")!,
        UUID(uuidString: "00000000-0000-0000-0000-000000000003")!,
    ]

    private static func buildStaffGroups(
        writtenNoteNames: [String]
    ) -> [DefenseTutorialStaffGroup] {
        writtenNoteNames.enumerated().map { index, name in
            DefenseTutorialStaffGroup(
                id: staffGroupIds[index],
                chordName: DefenseTutorialConstants.solfegeLabels[index],
                voicing: [name],
                voicingStaves: [1],
                measureOffset: 0,
                isRest: false,
                noteValue: .whole,
                beatIndex: nil
            )
        }
    }

    static func build(
        settings: DefenseTutorialNotationSettings,
        audioUrl: String = DefenseTutorialConstants.audioUrl
    ) -> DefenseTutorialPhraseBuildResult {
        let writtenOctave = pickWrittenOctave(settings)
        let writtenOffset = DefenseTutorialNotation.resolveWrittenOffset(settings)
        let keyFifths = DefenseTutorialNotation.resolveConcertKeyFifths(settings)

        let writtenMidis = DefenseTutorialConstants.writtenPitchClasses.map { pc in
            midiFromWritten(octave: writtenOctave.rawValue, pitchClass: pc)
        }

        let concertMidis = writtenMidis.map { $0 - writtenOffset }

        let concertNoteNames = concertMidis.map { concertMidiToName($0) }

        let notes: [SurvivalPhraseChordNote] = concertMidis.enumerated().map { stepIndex, concertMidi in
            SurvivalPhraseChordNote(
                orderIndex: stepIndex,
                pitchMidi: concertMidi,
                pitchClass: ((concertMidi % 12) + 12) % 12,
                noteName: concertNoteNames[stepIndex],
                staff: 1,
                stepIndex: stepIndex
            )
        }

        let chord = SurvivalPhraseChord(
            id: "tutorial-cde-chord",
            orderIndex: 0,
            chordName: "ドレミ",
            measureNumber: 1,
            notes: notes
        )

        let phrase = DefensePhraseDefinition(
            id: "tutorial-cde-phrase",
            orderIndex: 0,
            title: "Input setup",
            audioUrl: audioUrl,
            keyFifths: keyFifths,
            requiredCompletionCount: 1,
            chords: [chord]
        )

        let stage = DefenseStageDefinition(
            id: "defense-tutorial-input-setup",
            slug: "defense-tutorial-input-setup",
            stageNumber: 0,
            title: "はじめての設定",
            titleEn: "First-time setup",
            bpm: DefenseTutorialConstants.bpm,
            beatsPerBar: DefenseTutorialConstants.beatsPerBar,
            phraseBars: 1,
            staffLayout: .treble,
            attackTrigger: .note,
            keyFifths: keyFifths,
            requiredCompletionCount: 1,
            difficultyLevel: 1,
            surviveSeconds: 9999,
            playerHp: 100,
            productionStaffHintMode: "off",
            productionKeyboardHintMode: "off",
            phrases: [phrase]
        )

        return DefenseTutorialPhraseBuildResult(
            stage: stage,
            phrase: phrase,
            chord: chord,
            staffGroups: buildStaffGroups(writtenNoteNames: concertNoteNames),
            concertMidis: concertMidis,
            recommendedMidis: concertMidis,
            writtenOctave: writtenOctave
        )
    }
}
