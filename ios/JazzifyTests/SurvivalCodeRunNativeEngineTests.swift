import XCTest
@testable import Jazzify

final class SurvivalCodeRunNativeEngineTests: XCTestCase {
    private func makeEnemy(
        id: String = "slime-1",
        x: CGFloat = 100,
        vx: CGFloat = -1.25,
        minX: CGFloat = 68,
        maxX: CGFloat = 132,
        alive: Bool = true,
        anim: CGFloat = 0
    ) -> SurvivalCodeRunNativeEnemy {
        SurvivalCodeRunNativeEnemy(
            id: id,
            rect: CGRect(x: x, y: 348, width: 34, height: 34),
            vx: vx,
            minX: minX,
            maxX: maxX,
            alive: alive,
            anim: anim
        )
    }

    func testMoveEnemiesAdvancesAliveEnemy() {
        let enemies = [makeEnemy()]
        let next = SurvivalCodeRunNativeEngine.moveEnemies(enemies: enemies, solids: [], step: 1)
        XCTAssertEqual(next.count, 1)
        XCTAssertLessThan(next[0].rect.origin.x, enemies[0].rect.origin.x)
        XCTAssertGreaterThan(next[0].anim, enemies[0].anim)
    }

    func testMoveEnemiesDoesNotMoveDeadEnemy() {
        let enemies = [makeEnemy(alive: false, anim: 2)]
        let next = SurvivalCodeRunNativeEngine.moveEnemies(enemies: enemies, solids: [], step: 3)
        XCTAssertEqual(next[0].rect.origin.x, enemies[0].rect.origin.x)
        XCTAssertEqual(next[0].anim, enemies[0].anim)
    }

    func testMoveEnemiesReversesAtPatrolBoundary() {
        let enemies = [makeEnemy(x: 131, vx: 1.25, minX: 68, maxX: 132)]
        let next = SurvivalCodeRunNativeEngine.moveEnemies(enemies: enemies, solids: [], step: 2)
        XCTAssertEqual(next[0].vx, -1.25)
        XCTAssertLessThanOrEqual(next[0].rect.maxX, 132)
    }

    func testMoveEnemiesReversesOnSolidCollision() {
        let enemies = [makeEnemy(x: 90, vx: -1.25)]
        let solids = [
            SurvivalCodeRunNativeSolid(
                kind: .block,
                rect: CGRect(x: 80, y: 300, width: 48, height: 48)
            )
        ]
        let next = SurvivalCodeRunNativeEngine.moveEnemies(enemies: enemies, solids: solids, step: 4)
        XCTAssertEqual(next[0].vx, 1.25)
        XCTAssertEqual(next[0].rect.origin.x, enemies[0].rect.origin.x, accuracy: 0.001)
    }

    func testResolveEnemyContactStompsWhenFallingOntoEnemy() {
        let enemies = [makeEnemy(x: 96, minX: 0, maxX: 200)]
        let playerRect = CGRect(x: 96, y: 310, width: 34, height: 42)
        let outcome = SurvivalCodeRunNativeEngine.resolveEnemyContact(
            enemies: enemies,
            playerRect: playerRect,
            playerVy: 4,
            step: 1
        )
        guard case .stomped(let nextEnemies) = outcome else {
            return XCTFail("Expected stomp")
        }
        XCTAssertFalse(nextEnemies[0].alive)
    }

    func testResolveEnemyContactDamagesOnSideCollision() {
        let enemies = [makeEnemy(x: 96, minX: 0, maxX: 200)]
        let playerRect = CGRect(x: 96, y: 320, width: 34, height: 42)
        let outcome = SurvivalCodeRunNativeEngine.resolveEnemyContact(
            enemies: enemies,
            playerRect: playerRect,
            playerVy: 0,
            step: 1
        )
        guard case .damaged(let sourceX) = outcome else {
            return XCTFail("Expected damage")
        }
        XCTAssertEqual(sourceX, enemies[0].rect.midX, accuracy: 0.001)
    }
}
