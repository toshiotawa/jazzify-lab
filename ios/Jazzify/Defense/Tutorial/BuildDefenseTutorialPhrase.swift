import Foundation

typealias DefenseTutorialStaffGroup = EarTrainingChordVoicingStaffLayout.GroupInput

struct DefenseTutorialPhraseBuildResult: Equatable, Sendable {
    let stage: DefenseStageDefinition
    let phrase: DefensePhraseDefinition
    let chord: SurvivalPhraseChord
    let staffGroups: [DefenseTutorialStaffGroup]
    let concertMidis: [Int]
    let recommendedMidis: [Int]
}

enum BuildDefenseTutorialPhrase {
    private static let concertNoteNames = ["C", "D", "E"]

    private static func midiFromConcert(octave: DefenseTutorialConcertOctave, pitchClass: Int) -> Int {
        (octave.rawValue + 1) * 12 + pitchClass
    }

    static func pickConcertOctave(_ settings: DefenseTutorialNotationSettings) -> DefenseTutorialConcertOctave {
        let clef = DefenseTutorialNotation.resolveClef(settings)
        var layoutSettings = settings
        layoutSettings.notationOctaveShift = 0
        let writtenOffset = DefenseTutorialNotation.resolveWrittenOffset(layoutSettings)
        let preset = NotationInstrumentCatalog.preset(for: settings.notationInstrumentId)

        if clef == .bass {
            return .three
        }

        let trialOctaves: [DefenseTutorialConcertOctave] = [.four, .three, .five]
        for octave in trialOctaves {
            let writtenMidis = DefenseTutorialConstants.targetPitchClasses.map { pc in
                midiFromConcert(octave: octave, pitchClass: pc) + writtenOffset
            }
            let maxWritten = writtenMidis.max() ?? 0
            let minWritten = writtenMidis.min() ?? 0
            if clef == .treble, maxWritten <= 84, minWritten >= 55 {
                return octave
            }
            if maxWritten <= 84, minWritten >= 48 {
                return octave
            }
        }

        if preset.octaveOffset < 0 || writtenOffset >= 12 {
            return .three
        }
        return .four
    }

    private static let staffGroupIds: [UUID] = [
        UUID(uuidString: "00000000-0000-0000-0000-000000000001")!,
        UUID(uuidString: "00000000-0000-0000-0000-000000000002")!,
        UUID(uuidString: "00000000-0000-0000-0000-000000000003")!,
        UUID(uuidString: "00000000-0000-0000-0000-000000000004")!,
    ]

    private static func buildStaffGroups(
        writtenNoteNames: [String]
    ) -> [DefenseTutorialStaffGroup] {
        var groups: [DefenseTutorialStaffGroup] = writtenNoteNames.enumerated().map { index, name in
            DefenseTutorialStaffGroup(
                id: staffGroupIds[index],
                chordName: index == 0 ? "CDE" : "",
                voicing: [name],
                voicingStaves: [1],
                measureOffset: 0,
                isRest: false,
                noteValue: .quarter,
                beatIndex: index
            )
        }
        groups.append(
            DefenseTutorialStaffGroup(
                id: staffGroupIds[3],
                chordName: "",
                voicing: [],
                voicingStaves: [],
                measureOffset: 0,
                isRest: true,
                noteValue: .quarter,
                beatIndex: 3
            )
        )
        return groups
    }

    static func build(
        settings: DefenseTutorialNotationSettings,
        audioUrl: String = DefenseTutorialConstants.audioUrl
    ) -> DefenseTutorialPhraseBuildResult {
        let concertOctave = pickConcertOctave(settings)
        let writtenOffset = DefenseTutorialNotation.resolveWrittenOffset(settings)

        let concertMidis = DefenseTutorialConstants.targetPitchClasses.map { pc in
            midiFromConcert(octave: concertOctave, pitchClass: pc)
        }

        let writtenNoteNames = zip(concertMidis, concertNoteNames.enumerated()).map { concertMidi, pair in
            let (_, concertNameBase) = pair
            let concertName = "\(concertNameBase)\(concertOctave.rawValue)"
            return EarTrainingMusicXmlTransposer.transposeWrittenNoteName(
                concertName,
                semitones: writtenOffset,
                originalFifths: DefenseTutorialConstants.keyFifths
            )
        }

        let notes: [SurvivalPhraseChordNote] = DefenseTutorialConstants.targetPitchClasses.enumerated().map { stepIndex, pitchClass in
            SurvivalPhraseChordNote(
                orderIndex: stepIndex,
                pitchMidi: concertMidis[stepIndex],
                pitchClass: pitchClass,
                noteName: writtenNoteNames[stepIndex],
                staff: 1,
                stepIndex: stepIndex
            )
        }

        let chord = SurvivalPhraseChord(
            id: "tutorial-cde-chord",
            orderIndex: 0,
            chordName: "CDE",
            measureNumber: 1,
            notes: notes
        )

        let phrase = DefensePhraseDefinition(
            id: "tutorial-cde-phrase",
            orderIndex: 0,
            title: "Input setup",
            audioUrl: audioUrl,
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
            staffGroups: buildStaffGroups(writtenNoteNames: writtenNoteNames),
            concertMidis: concertMidis,
            recommendedMidis: concertMidis
        )
    }
}
