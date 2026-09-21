import XCTest
@testable import Jazzify

final class DefenseVoicingKeysTests: XCTestCase {
    func testBuildActivePhrasesTransposesChordNamesFromFToC() {
        let templatePhrase = DefensePhraseDefinition(
            id: "p0",
            orderIndex: 0,
            title: "Template",
            audioUrl: "https://example.com/a.mp3",
            loopStartMeasure: 1,
            loopEndMeasure: 3,
            keyFifths: -1,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "c0",
                    orderIndex: 0,
                    chordName: "Gm7(9) | C7(9.13)",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(
                            orderIndex: 0,
                            pitchMidi: 53,
                            pitchClass: 5,
                            noteName: "F3",
                            staff: 2,
                            stepIndex: 0,
                            staffChordName: "Gm7(9)"
                        ),
                        SurvivalPhraseChordNote(
                            orderIndex: 1,
                            pitchMidi: 52,
                            pitchClass: 4,
                            noteName: "E3",
                            staff: 2,
                            stepIndex: 1,
                            staffChordName: "C7(9.13)"
                        ),
                    ]
                ),
            ]
        )
        let stage = DefenseStageDefinition(
            id: "s0",
            slug: "defense-dev-cv-test",
            stageNumber: 913,
            title: "Test",
            titleEn: "Test",
            bpm: 100,
            beatsPerBar: 4,
            audioRegistrationMode: .singleSource,
            audioUrl: "https://example.com/a.mp3",
            melodyAudioUrl: nil,
            progressionBars: nil,
            phraseBars: 1,
            staffLayout: .grand,
            attackTrigger: .measure,
            keyFifths: -1,
            requiredCompletionCount: 1,
            difficultyLevel: 3,
            surviveSeconds: 120,
            playerHp: 20,
            productionStaffHintMode: "always",
            productionKeyboardHintMode: "always",
            playStyle: .chordVoicing,
            voicingKeyMode: .order,
            voicingLowestKey: "F",
            voicingStartKey: "F",
            voicingMinLowestNote: "F3",
            playRootOnChordChange: true,
            phrases: [templatePhrase],
            progressionChords: []
        )
        let keys = DefenseVoicingKeys.buildOrderedKeyCycle(startKey: "F")
        let cIndex = keys.firstIndex(of: "C") ?? 0
        let keyState = DefenseVoicingKeyState(mode: .order, keys: keys, index: cIndex)
        let active = DefenseVoicingKeys.buildActivePhrases(stage: stage, keyState: keyState)
        XCTAssertEqual(active.count, 1)
        XCTAssertEqual(active[0].title, "C")
        XCTAssertEqual(active[0].chords.first?.chordName, "Dm7(9) | G7(9.13)")
        XCTAssertEqual(active[0].chords.first?.notes.first?.staffChordName, "Dm7(9)")
        XCTAssertEqual(active[0].chords.first?.notes.last?.staffChordName, "G7(9.13)")
    }
}
