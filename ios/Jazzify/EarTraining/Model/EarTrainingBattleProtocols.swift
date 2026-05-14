import Foundation
import Combine

// MARK: - SpriteKit 橋渡し

/// `EarTrainingBattleController` / `EarTrainingChordVoicingBattleController` が SpriteKit シーンへ接続するための最小 API。
@MainActor
protocol EarTrainingBattleSceneDriving: AnyObject {
    func attachScene(_ scene: EarTrainingBattleSceneHandle)
    func detachScene()
    func handleEffectImpact(effectId: Int)
}

// MARK: - ピアノ入力

/// 耳コピ用ピアノオーバーレイからの MIDI 入力を受け取る。
@MainActor
protocol EarTrainingPianoPlayable: ObservableObject {
    var midiHeldKeys: Set<Int> { get }
    /// 耳コピヴォイシング練習モード時の鍵盤ヒント。MIDI → 状態。
    /// 表示が不要なモードでは空辞書を返してよい。
    var voicingHintsByMidi: [Int: VoicingHintState] { get }

    func handleNoteOn(midi: Int, velocity: Int, playAudio: Bool)
    func handleNoteOff(midi: Int, playAudio: Bool)
}

// MARK: - ロビー / 結果オーバーレイ

/// `EarTrainingResultView` が単音／コードヴォイシングの両方で使う表示用 API。
@MainActor
protocol EarTrainingLobbyPresentable: ObservableObject {
    var showLobbyControls: Bool { get }
    var gameState: EarTrainingGameState { get }
    var resultState: EarTrainingResultState? { get }
    var lastRank: EarTrainingRank? { get }
    var resultRankLine: String? { get }
    var statusText: String { get }
    var startButtonLabel: String { get }
    var practiceMode: Bool { get }
    var canChangePracticeMode: Bool { get }
    var lessonProgressText: String? { get }
    var lessonProgressStatus: EarTrainingLessonProgressStatus? { get }
    var hudLabels: EarTrainingBattleHudLabels { get }
    var stageTitleForLobby: String { get }
    var isEnglishCopy: Bool { get }
    /// コードクイズ: ロビーモーダルに常時表示するルール文（他モードは nil）
    var quizRulesLine: String? { get }

    func startBattle()
    func handleBack()
    func setPracticeMode(_ value: Bool)
}
