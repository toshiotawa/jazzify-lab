import Foundation

enum DefenseStaffLayout: String, Sendable {
    case treble
    case grand
}

struct DefensePhraseDefinition: Sendable, Equatable, Identifiable {
    let id: String
    let orderIndex: Int
    let title: String
    let audioUrl: String
    let keyFifths: Int?
    let requiredCompletionCount: Int?
    let chords: [SurvivalPhraseChord]
}

struct DefenseStageDefinition: Sendable, Equatable, Identifiable {
    let id: String
    let slug: String
    let stageNumber: Int
    let title: String
    let titleEn: String
    let bpm: Double
    let beatsPerBar: Int
    let phraseBars: Int
    let staffLayout: DefenseStaffLayout
    let keyFifths: Int
    let requiredCompletionCount: Int
    let difficultyLevel: Int
    let surviveSeconds: Int
    let playerHp: Int
    let productionStaffHintMode: String
    let productionKeyboardHintMode: String
    let phrases: [DefensePhraseDefinition]
}

struct DefenseDifficultyDefinition: Sendable, Equatable {
    let level: Int
    let enemyHp: Int
    let spawnIntervalSec: Double
    let maxEnemies: Int
    let enemySpeedPxPerSec: Double
    let enemyDamage: Int
    let attackIntervalSec: Double
    let attackRangePx: Double
}

enum DefenseEnemyType: String, Sendable, CaseIterable {
    case slime, bat, goblin, skeleton, ghost, mushroom, wolf, golem, mimic, dragon
}

struct DefenseEnemyState: Identifiable, Sendable {
    let id: UUID
    var isActive: Bool
    var type: DefenseEnemyType
    var x: CGFloat
    var y: CGFloat
    var hp: Int
    var maxHp: Int
    var knockbackVx: CGFloat
    /// Attack cycle start time (seconds); 0 = never attacked.
    var lastAttackAt: TimeInterval
    var isMoving: Bool
    var attackHitPending: Bool
    let slotIndex: Int
}

enum DefenseGameResult: Equatable {
    case playing
    case clear
    case gameOver
}

struct DefenseRuntimeState: Sendable {
    var elapsedSec: TimeInterval = 0
    var playerHp: Int
    var playerMaxHp: Int
    var surviveSeconds: TimeInterval
    var result: DefenseGameResult = .playing
    var enemiesDefeated: Int = 0
    var spawnTimerSec: TimeInterval = 0
    var nextEnemyIndex: Int = 0
    var enemies: [DefenseEnemyState]
    var impactAt: TimeInterval = DefenseEnemyConfig.noImpact
    var impactX: CGFloat = 80
    var impactY: CGFloat = 300
    var slashAt: TimeInterval = DefenseEnemyConfig.noSlash
    var slashFromX: CGFloat = 80
    var slashToX: CGFloat = 80
    var slashY: CGFloat = 300
    let playerX: CGFloat = 80
    let playerY: CGFloat = 300

    init(playerHp: Int, surviveSeconds: TimeInterval, maxEnemies: Int) {
        self.playerHp = playerHp
        self.playerMaxHp = playerHp
        self.surviveSeconds = surviveSeconds
        self.enemies = (0..<maxEnemies).map { index in
            DefenseEnemyState(
                id: UUID(),
                isActive: false,
                type: .slime,
                x: 760,
                y: 300,
                hp: 1,
                maxHp: 1,
                knockbackVx: 0,
                lastAttackAt: 0,
                isMoving: false,
                attackHitPending: false,
                slotIndex: index
            )
        }
    }
}

struct DefensePhraseJudgeState: Equatable {
    var phraseIndex: Int
    var chordIndex: Int
    var targetStepIndex: Int
    var correctNoteIndices: Set<Int>
    var revealedNoteIndices: Set<Int>
    var completionCount: Int
    var pendingSwitch: Bool
    let phrases: [DefensePhraseDefinition]
}

enum DefenseRunMode {
    case practice
    case performance
}
