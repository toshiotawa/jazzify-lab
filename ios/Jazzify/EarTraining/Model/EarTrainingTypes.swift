import Foundation
import CoreGraphics

/// Web 版 `EarTrainingGameState` ([src/types/index.ts L663-671]) と一致。
enum EarTrainingGameState: String, Sendable {
    case idle
    case countIn
    case playingPhrase
    case phraseComplete
    case phraseFail
    case transitionToNextPhrase
    case stageClear
    case gameOver
}

/// Web 版 `EarTrainingRank` と一致。
enum EarTrainingRank: String, Sendable {
    case perfect = "Perfect"
    case great = "Great"
    case good = "Good"
    case fail = "Fail"
}

/// SpriteKit シーンへ通知するエフェクト種別。Web `EarTrainingBattleEffectKind` と同義。
enum EarTrainingBattleEffectKind: String, Sendable {
    case correct
    case miss
    case complete
    case fail
    case voicingCast
    case quotaReached
    case osmdHammer
    case osmdHammerReflect
    case osmdMeteor
}

/// Web `EarTrainingBattleEffectCommand` と同等。
/// originPoint はシーン (SKScene) 座標。コード名→自キャラ間のエネルギー演出の起点に利用。
struct EarTrainingBattleEffectCommand: Sendable, Equatable {
    let id: Int
    let kind: EarTrainingBattleEffectKind
    let label: String?
    let damage: Int?
    let phraseNoteCount: Int?
    let originPoint: CGPoint?
    let relatedEffectId: Int?
    let travelDurationSec: Double?
    let precise: Bool

    init(
        id: Int,
        kind: EarTrainingBattleEffectKind,
        label: String? = nil,
        damage: Int? = nil,
        phraseNoteCount: Int? = nil,
        originPoint: CGPoint? = nil,
        relatedEffectId: Int? = nil,
        travelDurationSec: Double? = nil,
        precise: Bool = false
    ) {
        self.id = id
        self.kind = kind
        self.label = label
        self.damage = damage
        self.phraseNoteCount = phraseNoteCount
        self.originPoint = originPoint
        self.relatedEffectId = relatedEffectId
        self.travelDurationSec = travelDurationSec
        self.precise = precise
    }
}

/// Web `EarTrainingBattleHudLabels` と同等。
struct EarTrainingBattleHudLabels: Sendable, Equatable {
    let settings: String
    let backShort: String
    let practiceBadge: String
    let battleMode: String
    let practiceMode: String
    let lobbyBack: String
    let resultWin: String
    let resultLose: String
    let resultTimeOver: String

    static func make(isEnglish: Bool) -> EarTrainingBattleHudLabels {
        if isEnglish {
            return EarTrainingBattleHudLabels(
                settings: "Settings",
                backShort: "Back",
                practiceBadge: "Practice",
                battleMode: "Battle",
                practiceMode: "Practice",
                lobbyBack: "Back",
                resultWin: "You win",
                resultLose: "You lose",
                resultTimeOver: "Time over"
            )
        }
        return EarTrainingBattleHudLabels(
            settings: "設定",
            backShort: "戻る",
            practiceBadge: "練習",
            battleMode: "バトル",
            practiceMode: "練習",
            lobbyBack: "戻る",
            resultWin: "勝利",
            resultLose: "敗北",
            resultTimeOver: "タイムオーバー"
        )
    }
}

/// 試行中フレーズの状態。Web `EarTrainingPhraseAttempt` と同等。
struct EarTrainingPhraseAttempt: Sendable, Equatable {
    let phraseId: UUID
    var currentNoteIndex: Int
    var revealedNotes: [String]
    var missedNoteCounts: [Int: Int]
    let startedAtAudioTime: Double
    var completed: Bool
    var failed: Bool
}

/// 採点・ダメージ計算用の設定値。Web `EarTrainingDamageConfig` と同等。
struct EarTrainingDamageConfig: Sendable, Equatable {
    let perCorrectNote: Int
    let good: Int
    let great: Int
    let perfect: Int
    let miss: Int
    let fail: Int

    static let zero = EarTrainingDamageConfig(perCorrectNote: 0, good: 0, great: 0, perfect: 0, miss: 0, fail: 0)
}

/// 採点ランクのしきい値。Web `EarTrainingRankRule` と同等。
struct EarTrainingRankRule: Sendable, Equatable {
    let perfectMaxMisses: Int
    let greatMaxMisses: Int
}

/// HUD やシーンに渡す表示用コードチップ。Web `EarTrainingBattleChordView` と同等。
struct EarTrainingChordChip: Identifiable, Sendable, Equatable {
    let id: UUID
    let name: String
    let active: Bool
}

/// バトル UI の判定結果状態。Web の `resultState` と一致。
enum EarTrainingResultState: Sendable, Equatable {
    case win
    case lose
    case timeOver
}

/// レッスン進捗保存テキスト。
enum EarTrainingLessonProgressStatus: Sendable, Equatable {
    case saving
    case saved
}

/// SpriteKit シーンへ渡すスナップショット。Web `EarTrainingBattleSnapshot` と同義（HUD/結果は SwiftUI 側で描画するため必要最小限）。
struct EarTrainingBattleSceneSnapshot: Sendable, Equatable {
    let gameState: EarTrainingGameState
    let stageId: UUID
    let stageTitle: String
    let phraseIndex: Int
    let phraseRunId: Int
    /// フレーズ紹介テキストの再フェード制御用（コードクイズは正解のたびに phraseRunId が変わるため分離）
    let phraseIntroSeq: Int
    /// コードクイズ開始バナーなど、イントロを大きく長く表示する
    let phraseIntroEmphasis: Bool
    let totalPhrases: Int
    let phraseIntroLine: String
    let demoLoopActive: Bool
    let playerAvatarName: String
    let enemyAvatarName: String
    let enemyAvatarFlipX: Bool
    let fixedCharacterPositions: Bool
    let showLobbyControls: Bool
    let isEnglishCopy: Bool
}

/// レッスン起動コンテキスト。
struct EarTrainingLessonContext: Sendable {
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
    /// レッスン課題の `survival_lesson_overrides.bgmUrl`（コードクイズ BGM 上書き。未設定時は従来どおり）。
    let bgmUrl: String?
}
