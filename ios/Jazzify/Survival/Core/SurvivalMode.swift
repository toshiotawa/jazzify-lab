import Foundation

/// ランダム出題ステージかコード進行ステージか（プランどおり値で保持）。
enum SurvivalStageKind: Equatable {
    case random(allowedChords: [String])
    case progression(chords: [SurvivalResolvedChord])
}

enum SurvivalAssistMode: Equatable {
    case normal
    case hint
}

enum SurvivalEncounterMode: Equatable {
    case regular
    case boss(SurvivalBossType)
}

/// bool の組み合わせではなく、プレイモードを値として表現する。
struct SurvivalMode: Equatable {
    let stageKind: SurvivalStageKind
    let assist: SurvivalAssistMode
    let encounter: SurvivalEncounterMode

    static func resolve(stage: SurvivalStageDefinition, hintMode: Bool) -> SurvivalMode {
        let assist: SurvivalAssistMode = hintMode ? .hint : .normal
        let isBoss = SurvivalBossEngine.isBlockLastStage(stageNumber: stage.stageNumber, in: stage.mapCategory)
        let encounter: SurvivalEncounterMode
        if isBoss {
            encounter = .boss(SurvivalBossEngine.bossType(for: stage.blockKey, in: stage.mapCategory))
        } else {
            encounter = .regular
        }
        let stageKind: SurvivalStageKind
        if stage.stageType == .progression {
            let chords = SurvivalGameLoop.buildProgressionChords(for: stage)
            stageKind = .progression(chords: chords)
        } else {
            stageKind = .random(allowedChords: stage.allowedChords)
        }
        return SurvivalMode(stageKind: stageKind, assist: assist, encounter: encounter)
    }

    var isBossStage: Bool {
        if case .boss = encounter { return true }
        return false
    }

    var hintMode: Bool {
        assist == .hint
    }

    var isProgressionStage: Bool {
        if case .progression = stageKind { return true }
        return false
    }
}
