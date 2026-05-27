import Foundation

@MainActor
final class BalloonRushPlayLoopFacade: SurvivalPlayLoopFacade {
    private let loop: BalloonRushGameLoop
    private let popQuota: Int

    init(loop: BalloonRushGameLoop, popQuota: Int) {
        self.loop = loop
        self.popQuota = popQuota
    }

    var effectiveStageKillQuota: Int { popQuota }

    var isPhraseMode: Bool { false }

    func phraseStaffSnapshot() -> SurvivalPhraseStaffSnapshot? { nil }
}
