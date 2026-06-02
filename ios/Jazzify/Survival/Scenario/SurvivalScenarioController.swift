import CoreGraphics
import Foundation

/// オンボーディングが `SurvivalGameSession` / `SurvivalGameLoop` を MainActor 上で操作するための薄いコントローラ。
@MainActor
final class SurvivalScenarioController: ObservableObject {
    private weak var session: SurvivalGameSession?

    func bind(session: SurvivalGameSession) {
        self.session = session
    }

    func applyMutation(_ body: (inout SurvivalScenarioRuntimeState) -> Void) {
        session?.gameLoop.applyScenarioMutation(body)
    }

    func setOverrides(_ overrides: SurvivalScenarioOverrides) {
        session?.gameLoop.applyScenarioMutation { $0 = overrides.toRuntimeState() }
    }

    func clearEnemies() {
        session?.gameLoop.scenarioClearEnemies()
    }

    func spawnStationaryEnemy(atX x: CGFloat, y: CGFloat) {
        session?.gameLoop.scenarioSpawnStationaryEnemy(atX: x, y: y)
    }

    func spawnStationaryRing(count: Int, radius: CGFloat) {
        session?.gameLoop.scenarioSpawnStationaryRing(count: count, radius: radius)
    }

    func spawnEnemyInFront(distance: CGFloat) {
        session?.gameLoop.scenarioSpawnEnemyInFront(distance: distance)
    }

    func spawnTutorialPerpendicularOffsets(distanceForward: CGFloat, perpOffsets: [CGFloat]) {
        session?.gameLoop.scenarioSpawnTutorialPerpendicularOffsets(
            distanceForward: distanceForward,
            perpOffsets: perpOffsets
        )
    }

    func emitAttackOnly(_ slot: SurvivalSlotIndex) {
        session?.gameLoop.scenarioEmitAttackOnly(attack: slot)
    }

    func emitSpecialShockwaveOnly() {
        session?.gameLoop.scenarioEmitSpecialShockwaveOnly()
    }

    func emitChordNameText(_ chordName: String) {
        session?.gameLoop.scenarioEmitChordNameText(chordName)
    }

    func setSlotBChord(_ chord: SurvivalResolvedChord?) {
        session?.gameLoop.scenarioSetSlotBChord(chord)
    }

    func setSlotAEnabled(_ enabled: Bool) {
        session?.gameLoop.scenarioSetSlotAEnabled(enabled)
    }

    func setSlotBEnabled(_ enabled: Bool) {
        session?.gameLoop.scenarioSetSlotBEnabled(enabled)
    }

    func setDemoKeyboardHints(_ midis: [Int]) {
        session?.gameLoop.applyScenarioMutation { $0.demoKeyboardMidis = midis }
    }
}
