import XCTest
@testable import Jazzify

final class EarTrainingOsmdCombatStatsTests: XCTestCase {
    func testEnemyMaxHpIsTargetCountTimes100() {
        XCTAssertEqual(EarTrainingOsmdCombatStats.enemyMaxHp(targetCountPerLoop: 10), 1000)
        XCTAssertEqual(EarTrainingOsmdCombatStats.enemyMaxHp(targetCountPerLoop: 0), 0)
    }

    func testRollHitDamageWithinRange() {
        for _ in 0..<200 {
            let damage = EarTrainingOsmdCombatStats.rollHitDamage()
            XCTAssertGreaterThanOrEqual(damage, EarTrainingOsmdCombatStats.hitDamageMin)
            XCTAssertLessThanOrEqual(damage, EarTrainingOsmdCombatStats.hitDamageMax)
        }
    }
}
