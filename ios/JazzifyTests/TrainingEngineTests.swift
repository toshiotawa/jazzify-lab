import XCTest
@testable import Jazzify

final class TrainingEngineTests: XCTestCase {
    func testShouldPlayTrainingRootOnCorrectOnlyForCompletedChordVoicing() {
        XCTAssertTrue(TrainingEngine.shouldPlayTrainingRootOnCorrect(
            kind: .chord, playRootOnCorrect: true, completed: true, rootMidi: 48
        ))
        XCTAssertTrue(TrainingEngine.shouldPlayTrainingRootOnCorrect(
            kind: .voicing, playRootOnCorrect: true, completed: true, rootMidi: 35
        ))
        XCTAssertFalse(TrainingEngine.shouldPlayTrainingRootOnCorrect(
            kind: .chord, playRootOnCorrect: true, completed: false, rootMidi: 48
        ))
        XCTAssertFalse(TrainingEngine.shouldPlayTrainingRootOnCorrect(
            kind: .noteReading, playRootOnCorrect: true, completed: true, rootMidi: 60
        ))
        XCTAssertFalse(TrainingEngine.shouldPlayTrainingRootOnCorrect(
            kind: .interval, playRootOnCorrect: true, completed: true, rootMidi: 60
        ))
        XCTAssertFalse(TrainingEngine.shouldPlayTrainingRootOnCorrect(
            kind: .scale, playRootOnCorrect: true, completed: true, rootMidi: 60
        ))
    }

    func testPerformDefeatActivatesDyingSlotAndSpawnsNextEnemy() {
        var runtime = TrainingEngine.createInitialRuntime()
        TrainingEngine.performDefeat(runtime: &runtime, nowSec: 1.5, guardPoseSec: 1)

        XCTAssertTrue(runtime.dyingEnemy.active)
        XCTAssertEqual(runtime.dyingEnemy.typeIndex, 0)
        XCTAssertEqual(runtime.dyingEnemy.alpha, 1)
        XCTAssertEqual(runtime.dyingEnemy.offsetX, 0)
        XCTAssertGreaterThan(runtime.dyingEnemy.slashUntilSec, 1.5)
        XCTAssertEqual(runtime.enemy.slashUntilSec, 0)
        XCTAssertEqual(runtime.enemy.typeIndex, 1)
        XCTAssertEqual(runtime.enemy.fadeAlpha, 1)
        XCTAssertEqual(runtime.guardPoseUntilSec, 2.5, accuracy: 0.001)
    }

    func testTickEnemyFadesDyingSlot() {
        var runtime = TrainingEngine.createInitialRuntime()
        TrainingEngine.performDefeat(runtime: &runtime, nowSec: 1.5, guardPoseSec: 0)

        TrainingEngine.tickEnemy(runtime: &runtime, nowSec: 1.6, dt: 0.5)
        XCTAssertLessThan(runtime.dyingEnemy.alpha, 1)
        XCTAssertGreaterThan(runtime.dyingEnemy.offsetX, 0)

        TrainingEngine.tickEnemy(runtime: &runtime, nowSec: 2.0, dt: 0.5)
        XCTAssertFalse(runtime.dyingEnemy.active)
    }

    func testOrderedInversionChordRequiresBottomUpInput() {
        let question = TrainingQuestion(
            questionKey: "inv",
            promptLabel: "C",
            notes: [
                TrainingQuestionNote(noteName: "E4", midi: 64, pitchClass: 4, staff: 1, isTarget: true),
                TrainingQuestionNote(noteName: "G4", midi: 67, pitchClass: 7, staff: 1, isTarget: true),
                TrainingQuestionNote(noteName: "C5", midi: 72, pitchClass: 0, staff: 1, isTarget: true),
            ],
            layout: .stacked,
            ordered: true,
            keyFifths: 0,
            rootMidi: 48
        )
        let wrong = TrainingEngine.evaluateNoteOn(
            question: question,
            correctIndices: [],
            midiNote: 67,
            sequential: false
        )
        XCTAssertFalse(wrong.accepted)
        let first = TrainingEngine.evaluateNoteOn(
            question: question,
            correctIndices: [],
            midiNote: 64,
            sequential: false
        )
        XCTAssertTrue(first.accepted)
        let second = TrainingEngine.evaluateNoteOn(
            question: question,
            correctIndices: first.newCorrectIndices,
            midiNote: 67,
            sequential: false
        )
        XCTAssertTrue(second.accepted)
        let third = TrainingEngine.evaluateNoteOn(
            question: question,
            correctIndices: second.newCorrectIndices,
            midiNote: 72,
            sequential: false
        )
        XCTAssertTrue(third.completed)
    }

    func testSequentialKeyboardHintsMatchOrderedAndVoiceRules() {
        let ordered = TrainingQuestion(
            questionKey: "ordered",
            promptLabel: "C",
            notes: [
                TrainingQuestionNote(noteName: "E4", midi: 64, pitchClass: 4, staff: 1, isTarget: true),
                TrainingQuestionNote(noteName: "G4", midi: 67, pitchClass: 7, staff: 1, isTarget: true),
                TrainingQuestionNote(noteName: "C5", midi: 72, pitchClass: 0, staff: 1, isTarget: true),
            ],
            layout: .stacked,
            ordered: true,
            keyFifths: 0,
            rootMidi: 48
        )
        XCTAssertTrue(TrainingEngine.shouldUseSequentialKeyboardHints(
            question: ordered,
            kind: .chord,
            voiceSequential: false
        ))
        XCTAssertEqual(
            TrainingEngine.sequentialKeyboardHints(
                question: ordered,
                correctIndices: [],
                voiceSequential: false
            ),
            TrainingSequentialKeyboardHints(nextMidis: [64], pendingMidis: [67, 72], completedMidis: [])
        )
        XCTAssertEqual(
            TrainingEngine.sequentialKeyboardHints(
                question: ordered,
                correctIndices: [0],
                voiceSequential: false
            ),
            TrainingSequentialKeyboardHints(nextMidis: [67], pendingMidis: [72], completedMidis: [64])
        )

        let chord = TrainingQuestion(
            questionKey: "chord",
            promptLabel: "C",
            notes: [
                TrainingQuestionNote(noteName: "C4", midi: 60, pitchClass: 0, staff: 1, isTarget: true),
                TrainingQuestionNote(noteName: "E4", midi: 64, pitchClass: 4, staff: 1, isTarget: true),
                TrainingQuestionNote(noteName: "G4", midi: 67, pitchClass: 7, staff: 1, isTarget: true),
            ],
            layout: .stacked,
            ordered: false,
            keyFifths: 0,
            rootMidi: 60
        )
        XCTAssertTrue(TrainingEngine.shouldUseSequentialKeyboardHints(
            question: chord,
            kind: .chord,
            voiceSequential: true
        ))
        XCTAssertEqual(
            TrainingEngine.sequentialKeyboardHints(
                question: chord,
                correctIndices: [],
                voiceSequential: true
            ),
            TrainingSequentialKeyboardHints(nextMidis: [60], pendingMidis: [64, 67], completedMidis: [])
        )
    }

    func testIntervalKeyboardHintsSplitReferenceAndTarget() {
        let question = TrainingQuestion(
            questionKey: "interval",
            promptLabel: "C テスト",
            notes: [
                TrainingQuestionNote(noteName: "C4", midi: 60, pitchClass: 0, staff: 1, isTarget: false),
                TrainingQuestionNote(noteName: "E4", midi: 64, pitchClass: 4, staff: 1, isTarget: true),
            ],
            layout: .stacked,
            ordered: false,
            keyFifths: 0,
            rootMidi: 60
        )
        XCTAssertEqual(TrainingEngine.keyboardReferenceMidis(question: question), [60])
        XCTAssertEqual(TrainingEngine.keyboardHintMidis(question: question, correctIndices: [], showHints: true), [64])
        XCTAssertEqual(TrainingEngine.keyboardHintMidis(question: question, correctIndices: [], showHints: false), [])
        XCTAssertEqual(
            TrainingEngine.staffDisplayNotes(question: question, practiceMode: false, kind: .interval).map(\.noteName),
            ["C4"]
        )
        XCTAssertEqual(
            TrainingEngine.staffHintedPitchClasses(
                question: question,
                correctIndices: [],
                practiceMode: true,
                kind: .interval
            ),
            [4]
        )
        XCTAssertEqual(
            TrainingEngine.staffHintedPitchClasses(
                question: question,
                correctIndices: [],
                practiceMode: false,
                kind: .interval
            ),
            []
        )
    }
}
