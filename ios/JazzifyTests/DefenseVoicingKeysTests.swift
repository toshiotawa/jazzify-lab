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

    func testKeepsFMajorTwoFiveOneInTrainingRegister() {
        guard let fSet = TrainingTwoHandVoicingTables.abaSet(key: "F") else {
            XCTFail("missing F ABA set")
            return
        }
        func chord(id: String, order: Int, name: String, notes: [String], measure: Int) -> SurvivalPhraseChord {
            SurvivalPhraseChord(
                id: id,
                orderIndex: order,
                chordName: name,
                measureNumber: measure,
                notes: notes.enumerated().map { index, noteName in
                    SurvivalPhraseChordNote(
                        orderIndex: index,
                        pitchMidi: TrainingMusicTheory.parseVoicingMidi(noteName) ?? 0,
                        pitchClass: 0,
                        noteName: noteName,
                        staff: 2,
                        stepIndex: 0
                    )
                }
            )
        }
        let template = DefensePhraseDefinition(
            id: "p0",
            orderIndex: 0,
            title: "Template",
            audioUrl: "https://example.com/a.mp3",
            loopStartMeasure: 1,
            loopEndMeasure: 3,
            keyFifths: -1,
            requiredCompletionCount: nil,
            chords: [
                chord(id: "c0", order: 0, name: fSet.ii.name, notes: fSet.ii.notes, measure: 1),
                chord(id: "c1", order: 1, name: fSet.v.name, notes: fSet.v.notes, measure: 2),
                chord(id: "c2", order: 2, name: fSet.i.name, notes: fSet.i.notes, measure: 3),
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
            voicingMinLowestNote: "E3",
            playRootOnChordChange: true,
            phrases: [template],
            progressionChords: []
        )
        let keyState = DefenseVoicingKeys.createInitialKeyState(mode: .order, startKey: "F")
        let placed = DefenseVoicingKeys.buildActivePhrases(stage: stage, keyState: keyState)
        XCTAssertEqual(placed.first?.chords[0].notes.map(\.noteName), Array(fSet.ii.notes))
        XCTAssertEqual(placed.first?.chords[1].notes.map(\.noteName), Array(fSet.v.notes))
        XCTAssertEqual(placed.first?.chords[2].notes.map(\.noteName), Array(fSet.i.notes))
    }

    func testCollectKeyboardMidisIsStableAcrossKeys() {
        guard let fSet = TrainingTwoHandVoicingTables.abaSet(key: "F") else {
            XCTFail("missing F ABA set")
            return
        }
        let template = DefensePhraseDefinition(
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
                    chordName: fSet.ii.name,
                    measureNumber: 1,
                    notes: fSet.ii.notes.enumerated().map { index, noteName in
                        SurvivalPhraseChordNote(
                            orderIndex: index,
                            pitchMidi: TrainingMusicTheory.parseVoicingMidi(noteName) ?? 0,
                            pitchClass: 0,
                            noteName: noteName,
                            staff: 2,
                            stepIndex: 0
                        )
                    }
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
            phrases: [template],
            progressionChords: []
        )
        let fRange = DefenseKeyboardRange.resolvedDisplayRange(
            for: stage,
            phrases: DefenseVoicingKeys.buildActivePhrases(
                stage: stage,
                keyState: DefenseVoicingKeys.createInitialKeyState(mode: .order, startKey: "F")
            ),
            displayMode: .questionRangeFit
        )
        let keys = DefenseVoicingKeys.buildOrderedKeyCycle(startKey: "F")
        let cIndex = keys.firstIndex(of: "C") ?? 0
        let cRange = DefenseKeyboardRange.resolvedDisplayRange(
            for: stage,
            phrases: DefenseVoicingKeys.buildActivePhrases(
                stage: stage,
                keyState: DefenseVoicingKeyState(mode: .order, keys: keys, index: cIndex)
            ),
            displayMode: .questionRangeFit
        )
        XCTAssertEqual(fRange.minMidi, cRange.minMidi)
        XCTAssertEqual(fRange.maxMidi, cRange.maxMidi)
    }
}
