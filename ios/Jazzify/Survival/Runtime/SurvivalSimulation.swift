import Foundation

/// SpriteKit / SwiftUI を知らないシミュレーション ステップ。`SurvivalGameLoop.tick` の薄いラッパ。
@MainActor
final class SurvivalSimulation {
    private let gameLoop: SurvivalGameLoop

    init(gameLoop: SurvivalGameLoop) {
        self.gameLoop = gameLoop
    }

    func step(currentTime: TimeInterval, frameInput: SurvivalFrameInput, isPaused: Bool)
        -> (events: [SurvivalFrameEvent], snapshot: SurvivalSceneSnapshot) {
        let events = gameLoop.tick(
            currentTime: currentTime,
            frameInput: frameInput,
            isPaused: isPaused
        )
        let snapshot = SurvivalSceneSnapshot(runtime: gameLoop.runtime, bossBattle: gameLoop.bossBattle)
        return (events, snapshot)
    }
}
