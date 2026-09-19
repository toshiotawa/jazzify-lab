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
        if DefenseTutorialNotation.resolveClef(settings) == .bass {
            return DefenseTutorialWrittenOctave(rawValue: DefenseTutorialConstants.bassWrittenOctave) ?? .three
        }

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
        writtenNoteNames: [String],
        voicingStaff: Int
    ) -> [DefenseTutorialStaffGroup] {
        writtenNoteNames.enumerated().map { index, name in
            DefenseTutorialStaffGroup(
                id: staffGroupIds[index],
                chordName: DefenseTutorialConstants.solfegeLabels[index],
                voicing: [name],
                voicingStaves: [voicingStaff],
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
        let clef = DefenseTutorialNotation.resolveClef(settings)
        var offsetSettings = settings
        if clef == .bass {
            offsetSettings.notationOctaveShift = 0
        }
        let writtenOffset = DefenseTutorialNotation.resolveWrittenOffset(offsetSettings)
        let voicingStaff = DefenseTutorialNotation.resolveVoicingStaff(clef)

        let writtenMidis = DefenseTutorialConstants.writtenPitchClasses.map { pc in
            midiFromWritten(octave: writtenOctave.rawValue, pitchClass: pc)
        }

        let concertMidis = writtenMidis.map { $0 - writtenOffset }

        let writtenNoteNames = writtenMidis.map { concertMidiToName($0) }
        let concertNoteNames = concertMidis.map { concertMidiToName($0) }

        let notes: [SurvivalPhraseChordNote] = concertMidis.enumerated().map { stepIndex, concertMidi in
            SurvivalPhraseChordNote(
                orderIndex: stepIndex,
                pitchMidi: concertMidi,
                pitchClass: ((concertMidi % 12) + 12) % 12,
                noteName: concertNoteNames[stepIndex],
                staff: voicingStaff,
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
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: DefenseTutorialConstants.keyFifths,
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
            audioRegistrationMode: .perPhrase,
            audioUrl: nil,
            phraseBars: 1,
            staffLayout: .treble,
            attackTrigger: .note,
            keyFifths: DefenseTutorialConstants.keyFifths,
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
            staffGroups: buildStaffGroups(writtenNoteNames: writtenNoteNames, voicingStaff: voicingStaff),
            concertMidis: concertMidis,
            recommendedMidis: concertMidis,
            writtenOctave: writtenOctave
        )
    }
}
