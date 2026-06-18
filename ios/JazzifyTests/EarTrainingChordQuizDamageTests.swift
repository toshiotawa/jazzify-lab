import XCTest
@testable import Jazzify

final class EarTrainingChordQuizDamageTests: XCTestCase {
    func testEnemyHpAfterCorrectBoundaryValues() {
        XCTAssertEqual(
            EarTrainingChordQuiz.enemyHpAfterCorrect(correct: 0, required: 20, maxHp: 10_000),
            10_000
        )
        XCTAssertEqual(
            EarTrainingChordQuiz.enemyHpAfterCorrect(correct: 20, required: 20, maxHp: 10_000),
            0
        )
        XCTAssertEqual(
            EarTrainingChordQuiz.enemyHpAfterCorrect(correct: 10, required: 20, maxHp: 10_000),
            5_000
        )
    }

    func testEnemyHpAfterCorrectStepDamageSumsToMaxHp() {
        assertStepDamageSumsToMaxHp(required: 20, maxHp: 10_000)
        assertStepDamageSumsToMaxHp(required: 30, maxHp: 10_000)
    }

    func testEnemyHpAfterCorrectRequiredZeroGuard() {
        // required=0 でもゼロ除算せず（r=max(1,0)=1）、1問正解で 0 になる。
        XCTAssertEqual(
            EarTrainingChordQuiz.enemyHpAfterCorrect(correct: 1, required: 0, maxHp: 10_000),
            0
        )
    }

    private func assertStepDamageSumsToMaxHp(required: Int, maxHp: Int) {
        var totalDamage = 0
        var prevHp = maxHp
        for correct in 1...required {
            let nextHp = EarTrainingChordQuiz.enemyHpAfterCorrect(
                correct: correct,
                required: required,
                maxHp: maxHp
            )
            totalDamage += prevHp - nextHp
            prevHp = nextHp
        }
        XCTAssertEqual(totalDamage, maxHp)
        XCTAssertEqual(prevHp, 0)
    }
}
