import XCTest
@testable import Jazzify

final class DefenseEnemyDisplayConfigTests: XCTestCase {
    func testDisplaySpriteHeightScalesLogicalHeight() {
        let scale = DefenseEnemyConfig.battleDisplayScale
        XCTAssertEqual(DefenseEnemyConfig.displaySpriteHeight(for: .slime), 40 * scale, accuracy: 0.001)
        XCTAssertEqual(DefenseEnemyConfig.displaySpriteHeight(for: .dragon), 96 * scale, accuracy: 0.001)
    }

    func testDisplaySpriteWidthPreservesAspectRatio() {
        let slimeWidth = DefenseEnemyConfig.displaySpriteWidth(for: .slime)
        let slimeHeight = DefenseEnemyConfig.displaySpriteHeight(for: .slime)
        XCTAssertEqual(slimeWidth / slimeHeight, DefenseEnemyType.slime.aspectRatio, accuracy: 0.001)
    }

    func testDisplayFlyingYOffsetMatchesBattleScale() {
        XCTAssertEqual(
            DefenseEnemyConfig.displayFlyingYOffset,
            DefenseEnemyConfig.flyingYOffset * DefenseEnemyConfig.battleDisplayScale,
            accuracy: 0.001
        )
    }
}
