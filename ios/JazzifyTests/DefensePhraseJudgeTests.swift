import XCTest
@testable import Jazzify

final class DefensePhraseJudgeTests: XCTestCase {
    private let phrase = DefensePhraseDefinition(
        id: "a",
        orderIndex: 0,
        title: "A",
        audioUrl: "https://example.com/a.mp3",
        loopStartMeasure: nil,
        loopEndMeasure: nil,
        keyFifths: nil,
        requiredCompletionCount: nil,
        chords: [
            SurvivalPhraseChord(
                id: "c0",
                orderIndex: 0,
                chordName: "Dm7",
                measureNumber: 1,
                notes: [
                    SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1, stepIndex: 0),
                    SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 64, pitchClass: 4, noteName: "E4", staff: 1, stepIndex: 1),
                ]
            ),
            SurvivalPhraseChord(
                id: "c1",
                orderIndex: 1,
                chordName: "G7",
                measureNumber: 2,
                notes: [
                    SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: "G4", staff: 1, stepIndex: 0),
                ]
            ),
        ]
    )

    func testMeasureModeFiresAttackOnlyOnMeasureComplete() {
        var state = DefensePhraseJudge.createInitialState(phrases: [phrase])
        let first = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 2,
            attackTrigger: .measure
        )
        XCTAssertFalse(first.attack)
        state = first.nextState
        let second = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 4,
            attackTrigger: .measure
        )
        XCTAssertTrue(second.attack)
        state = second.nextState
        let final = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            attackTrigger: .measure
        )
        XCTAssertTrue(final.attack)
        XCTAssertTrue(final.phraseCompleted)
        XCTAssertTrue(final.pendingSwitch)
    }

    func testPhraseCompletionSetsPendingSwitch() {
        var state = DefensePhraseJudge.createInitialState(phrases: [phrase])
        let first = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 2)
        XCTAssertTrue(first.attack)
        state = first.nextState
        let second = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 4)
        XCTAssertTrue(second.attack)
        state = second.nextState
        let final = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 7)
        XCTAssertTrue(final.attack)
        XCTAssertTrue(final.phraseCompleted)
        XCTAssertTrue(final.pendingSwitch)
    }

    func testAutoAdvanceFalseDoesNotSetPendingSwitch() {
        var state = DefensePhraseJudge.createInitialState(phrases: [phrase])
        let first = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 2,
            autoAdvance: false
        )
        state = first.nextState
        let second = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 4,
            autoAdvance: false
        )
        state = second.nextState
        let final = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            autoAdvance: false
        )
        XCTAssertTrue(final.phraseCompleted)
        XCTAssertEqual(final.completionCount, 1)
        XCTAssertFalse(final.pendingSwitch)
        XCTAssertFalse(final.nextState.pendingSwitch)
    }

    func testRejectsG7OnlyPitchClassesBeforeDm7Complete() {
        let grandPhrase = DefensePhraseDefinition(
            id: "grand",
            orderIndex: 0,
            title: "Dm7 | G7",
            audioUrl: "https://example.com/grand.mp3",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "dm7",
                    orderIndex: 0,
                    chordName: "Dm7",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 50, pitchClass: 2, noteName: "D3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 53, pitchClass: 5, noteName: "F3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 57, pitchClass: 9, noteName: "A3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 3, pitchMidi: 60, pitchClass: 0, noteName: "C4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 4, pitchMidi: 65, pitchClass: 5, noteName: "F4", staff: 1, stepIndex: 0),
                    ]
                ),
                SurvivalPhraseChord(
                    id: "g7",
                    orderIndex: 1,
                    chordName: "G7",
                    measureNumber: 2,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 43, pitchClass: 7, noteName: "G2", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 53, pitchClass: 5, noteName: "F3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 59, pitchClass: 11, noteName: "B3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 3, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 4, pitchMidi: 65, pitchClass: 5, noteName: "F4", staff: 1, stepIndex: 0),
                    ]
                ),
            ]
        )
        let initial = DefensePhraseJudge.createInitialState(phrases: [grandPhrase])

        let gOnly = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 7
        )
        XCTAssertFalse(gOnly.attack)
        XCTAssertEqual(gOnly.nextState.correctNoteIndices.count, 0)
        XCTAssertEqual(gOnly.nextState.chordIndex, 0)

        let bOnly = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 11
        )
        XCTAssertFalse(bOnly.attack)
        XCTAssertEqual(bOnly.nextState.correctNoteIndices.count, 0)

        let commonF = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 5
        )
        XCTAssertTrue(commonF.attack)
        XCTAssertEqual(commonF.nextState.chordIndex, 0)
        XCTAssertTrue(commonF.nextState.correctNoteIndices.contains(1))
        XCTAssertTrue(commonF.nextState.correctNoteIndices.contains(4))
        XCTAssertFalse(commonF.nextState.correctNoteIndices.contains(0))

        var state = commonF.nextState
        for pc in [2, 9] {
            let step = DefensePhraseJudge.evaluateNoteOn(
                state: state,
                stageRequiredCompletionCount: 1,
                pitchClass: pc
            )
            XCTAssertEqual(step.nextState.chordIndex, 0)
            state = step.nextState
        }
        let afterDm7 = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 0
        )
        XCTAssertTrue(afterDm7.measureCompleted)
        XCTAssertEqual(afterDm7.nextState.chordIndex, 1)
        XCTAssertTrue(afterDm7.nextState.correctNoteIndices.isEmpty)
    }

    func testChordVoicingFiresAttackOnlyWhenVoicingCompletes() {
        let voicingPhrase = DefensePhraseDefinition(
            id: "cv",
            orderIndex: 0,
            title: "CV",
            audioUrl: "https://example.com/cv.mp3",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "cv0",
                    orderIndex: 0,
                    chordName: "Gm7(9)",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 53, pitchClass: 5, noteName: "F3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 58, pitchClass: 10, noteName: "Bb3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 3, pitchMidi: 69, pitchClass: 9, noteName: "A4", staff: 1, stepIndex: 0),
                    ]
                ),
            ]
        )
        let initial = DefensePhraseJudge.createInitialState(phrases: [voicingPhrase])

        let first = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 5,
            attackTrigger: .measure,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertFalse(first.attack)

        var state = first.nextState
        let second = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 10,
            attackTrigger: .measure,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertFalse(second.attack)
        state = second.nextState

        let third = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 2,
            attackTrigger: .measure,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertFalse(third.attack)
        state = third.nextState

        let complete = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 9,
            attackTrigger: .measure,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertTrue(complete.attack)
        XCTAssertTrue(complete.measureCompleted)
    }

    func testChordVoicingFiresAttackOnCompleteEvenWhenAttackTriggerIsNote() {
        let voicingPhrase = DefensePhraseDefinition(
            id: "cv",
            orderIndex: 0,
            title: "CV",
            audioUrl: "https://example.com/cv.mp3",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "cv0",
                    orderIndex: 0,
                    chordName: "Gm7(9)",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 53, pitchClass: 5, noteName: "F3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 58, pitchClass: 10, noteName: "Bb3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 3, pitchMidi: 69, pitchClass: 9, noteName: "A4", staff: 1, stepIndex: 0),
                    ]
                ),
            ]
        )
        let initial = DefensePhraseJudge.createInitialState(phrases: [voicingPhrase])

        let first = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 5,
            attackTrigger: .note,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertFalse(first.attack)

        var state = first.nextState
        let second = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 10,
            attackTrigger: .note,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertFalse(second.attack)
        state = second.nextState

        let third = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 2,
            attackTrigger: .note,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertFalse(third.attack)
        state = third.nextState

        let complete = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 9,
            attackTrigger: .note,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertTrue(complete.attack)
    }

    func testChordVoicingFiresAttackPerStepInOneMeasure() {
        let twoStepPhrase = DefensePhraseDefinition(
            id: "two-step",
            orderIndex: 0,
            title: "Dm7 G7",
            audioUrl: "https://example.com/two.mp3",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "dm7-g7",
                    orderIndex: 0,
                    chordName: "Dm7 | G7",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 50, pitchClass: 2, noteName: "D3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 53, pitchClass: 5, noteName: "F3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 57, pitchClass: 9, noteName: "A3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 3, pitchMidi: 60, pitchClass: 0, noteName: "C4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 4, pitchMidi: 43, pitchClass: 7, noteName: "G2", staff: 2, stepIndex: 1),
                        SurvivalPhraseChordNote(orderIndex: 5, pitchMidi: 53, pitchClass: 5, noteName: "F3", staff: 2, stepIndex: 1),
                        SurvivalPhraseChordNote(orderIndex: 6, pitchMidi: 59, pitchClass: 11, noteName: "B3", staff: 2, stepIndex: 1),
                        SurvivalPhraseChordNote(orderIndex: 7, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1, stepIndex: 1),
                    ]
                ),
            ]
        )
        var state = DefensePhraseJudge.createInitialState(phrases: [twoStepPhrase])

        for pc in [2, 5, 9] {
            let step = DefensePhraseJudge.evaluateNoteOn(
                state: state,
                stageRequiredCompletionCount: 1,
                pitchClass: pc,
                attackTrigger: .measure,
                playStyle: .chordVoicing,
                playRootOnChordChange: true
            )
            XCTAssertFalse(step.attack)
            state = step.nextState
        }

        let dm7Complete = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 0,
            attackTrigger: .measure,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertTrue(dm7Complete.attack)
        XCTAssertFalse(dm7Complete.measureCompleted)
        state = dm7Complete.nextState

        for pc in [7, 5, 11] {
            let step = DefensePhraseJudge.evaluateNoteOn(
                state: state,
                stageRequiredCompletionCount: 1,
                pitchClass: pc,
                attackTrigger: .measure,
                playStyle: .chordVoicing,
                playRootOnChordChange: true
            )
            XCTAssertFalse(step.attack)
            state = step.nextState
        }

        let g7Complete = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 2,
            attackTrigger: .measure,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertTrue(g7Complete.attack)
        XCTAssertTrue(g7Complete.measureCompleted)
    }

    func testPlaysRootOnlyWhenLabeledVoicingCompletesInChordVoicingMode() {
        let voicingPhrase = DefensePhraseDefinition(
            id: "cv",
            orderIndex: 0,
            title: "CV",
            audioUrl: "https://example.com/cv.mp3",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "cv0",
                    orderIndex: 0,
                    chordName: "Gm7(9)",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 53, pitchClass: 5, noteName: "F3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 58, pitchClass: 10, noteName: "Bb3", staff: 2, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 3, pitchMidi: 69, pitchClass: 9, noteName: "A4", staff: 1, stepIndex: 0),
                    ]
                ),
            ]
        )
        let initial = DefensePhraseJudge.createInitialState(phrases: [voicingPhrase])

        let first = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 5,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertNil(first.playRootMidi)

        var state = first.nextState
        let second = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 10,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertNil(second.playRootMidi)
        state = second.nextState

        let third = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 2,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertNil(third.playRootMidi)
        state = third.nextState

        let complete = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 9,
            playStyle: .chordVoicing,
            playRootOnChordChange: true
        )
        XCTAssertNotNil(complete.playRootMidi)
        XCTAssertTrue(complete.measureCompleted)
    }

    func testVoiceSequentialRequiresLowestMidiFirst() {
        let chordPhrase = DefensePhraseDefinition(
            id: "c",
            orderIndex: 0,
            title: "C",
            audioUrl: "https://example.com/c.mp3",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "c-sim",
                    orderIndex: 0,
                    chordName: "C",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: "G4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 60, pitchClass: 0, noteName: "C4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 64, pitchClass: 4, noteName: "E4", staff: 1, stepIndex: 0),
                    ]
                ),
            ]
        )
        let initial = DefensePhraseJudge.createInitialState(phrases: [chordPhrase])
        let skipHigh = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            sequential: true
        )
        XCTAssertFalse(skipHigh.attack)
        XCTAssertEqual(skipHigh.nextState.correctNoteIndices.count, 0)

        let midiAnyOrder = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            sequential: false
        )
        XCTAssertEqual(midiAnyOrder.nextState.correctNoteIndices.count, 1)

        var state = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 0,
            sequential: true
        ).nextState
        XCTAssertEqual(state.correctNoteIndices.count, 1)
        state = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 4,
            sequential: true
        ).nextState
        let top = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            sequential: true
        )
        XCTAssertTrue(top.attack)
        XCTAssertTrue(top.phraseCompleted)

        let hints = DefensePhraseJudge.keyboardHints(state: initial, sequential: true)
        XCTAssertEqual(hints.nextMidis, [60])
        XCTAssertTrue(hints.pendingMidis.contains(64))
        XCTAssertTrue(hints.pendingMidis.contains(67))
    }
}
