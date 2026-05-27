import Foundation

/// `SurvivalGameContent` / `SurvivalScene` が要求するプレイセッション API（サバイバル本編・風船ラッシュ共通）。
@MainActor
protocol SurvivalPlaySession: AnyObject, ObservableObject, SurvivalSceneDriver {
    var viewModel: SurvivalViewModel { get }
    var input: SurvivalInputBuffer { get }
    var playLoopFacade: SurvivalPlayLoopFacade { get }
    var currentHintMode: Bool { get }
    var allowsGameplayWatchdog: Bool { get }
    func togglePause()
    func chordPadNoteOn(_ midi: Int, velocity: Int)
    func chordPadNoteOff(_ midi: Int)
    func midiGameNoteOn(_ midi: Int, velocity: Int)
    func midiGameNoteOff(_ midi: Int)
    func restartSameStage(hintMode: Bool?)
    func requestExit()
    func dispose()
    func start()
}

/// HUD・結果画面用のループ参照（風船ラッシュは `BalloonRushGameLoop` を包む）。
@MainActor
protocol SurvivalPlayLoopFacade: AnyObject {
    var effectiveStageKillQuota: Int { get }
    func phraseStaffSnapshot() -> SurvivalPhraseStaffSnapshot?
    var isPhraseMode: Bool { get }
}
