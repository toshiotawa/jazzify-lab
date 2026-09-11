import XCTest
@testable import Jazzify

final class TrainingEngineTests: XCTestCase {
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
