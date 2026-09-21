import Foundation

enum DefenseAudioRegistrationMode: String, Sendable {
    case perPhrase = "per_phrase"
    case singleSource = "single_source"
    case sharedProgression = "shared_progression"
    case sharedProgressionSeparateTracks = "shared_progression_separate_tracks"
}

enum DefenseStaffLayout: String, Sendable {
    case treble
    case grand

    func displayStaves(for clef: NotationInstrumentClef) -> [Int] {
        if let staff = clef.singleStaffNumber {
            return [staff]
        }
        return self == .grand ? [1, 2] : [1]
    }
}

/// When player slash fires: each correct pitch (`.note`) or chord/measure complete (`.measure`).
enum DefenseAttackTrigger: String, Sendable {
    case note
    case measure
}

struct DefensePhraseDefinition: Sendable, Equatable, Identifiable {
    let id: String
    let orderIndex: Int
    let title: String
    let audioUrl: String
    let loopStartMeasure: Int?
    let loopEndMeasure: Int?
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
    let audioRegistrationMode: DefenseAudioRegistrationMode
    let audioUrl: String?
    let melodyAudioUrl: String?
    let progressionBars: Int?
    let phraseBars: Int
    let staffLayout: DefenseStaffLayout
    let attackTrigger: DefenseAttackTrigger
    let keyFifths: Int
    let requiredCompletionCount: Int
    let difficultyLevel: Int
    let surviveSeconds: Int
    let playerHp: Int
    let productionStaffHintMode: String
    let productionKeyboardHintMode: String
    let playStyle: DefensePlayStyle
    let voicingKeyMode: DefenseVoicingKeyMode?
    let voicingLowestKey: String?
    let voicingStartKey: String?
    let voicingMinLowestNote: String?
    let playRootOnChordChange: Bool
    let phrases: [DefensePhraseDefinition]
    let progressionChords: [DefenseStageProgressionChord]
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
    var speedPxPerSec: Double
    var damage: Int
    var attackIntervalSec: Double
    var attackRangePx: Double
    var knockbackMult: Double
    var knockbackVx: CGFloat
    /// Attack cycle start time (seconds); 0 = never attacked.
    var lastAttackAt: TimeInterval
    var isMoving: Bool
    var attackHitPending: Bool
    /// Elapsed seconds when hit flash started; -1 when inactive.
    var hitFlashAt: TimeInterval
    let slotIndex: Int
}

struct DefenseDamagePopupState: Sendable {
    var isActive: Bool = false
    var x: CGFloat = 0
    var y: CGFloat = 0
    var value: Int = 0
    var spawnedAt: TimeInterval = 0
}

struct DefenseFireballState: Sendable {
    var isActive: Bool = false
    var x: CGFloat = 0
    var y: CGFloat = 0
    var hitSlotMask: Int = 0
}

enum DefenseGameResult: Equatable {
    case playing
    case clear
    case gameOver
}

struct DefenseTutorialOptions: Equatable, Sendable {
    let key: String
    let enemyAttackEnabled: Bool
    let timedClearEnabled: Bool
    let autoAdvancePhrase: Bool
    let initialSpGauge: Int
    let maxEnemies: Int

    static let inputSetupV1 = DefenseTutorialOptions(
        key: DefenseTutorialConstants.key,
        enemyAttackEnabled: false,
        timedClearEnabled: false,
        autoAdvancePhrase: false,
        initialSpGauge: 4,
        maxEnemies: 2
    )
}

struct DefenseRuntimeState: Sendable {
    var elapsedSec: TimeInterval = 0
    var playerHp: Int
    var playerMaxHp: Int
    var surviveSeconds: TimeInterval
    var practiceMode: Bool
    var tutorial: DefenseTutorialOptions?
    var attackTrigger: DefenseAttackTrigger
    var result: DefenseGameResult = .playing
    var enemiesDefeated: Int = 0
    var spawnTimerSec: TimeInterval = 0
    var nextEnemyIndex: Int = 0
    var waveIndex: Int = 0
    var waveSpawnCount: Int = 0
    var waveStartedAt: TimeInterval = DefenseEnemyConfig.noWaveStart
    var enemies: [DefenseEnemyState]
    var impactAt: TimeInterval = DefenseEnemyConfig.noImpact
    var impactX: CGFloat = 80
    var impactY: CGFloat = 300
    var slashAt: TimeInterval = DefenseEnemyConfig.noSlash
    var slashFromX: CGFloat = 80
    var slashToX: CGFloat = 80
    var slashY: CGFloat = 300
    var guardPoseUntilSec: TimeInterval = 0
    var skillPoseStartSec: TimeInterval = DefenseEnemyConfig.noSkillPose
    var fireballSpawnAtSec: TimeInterval = DefenseEnemyConfig.noPendingFireball
    var spGauge: Int = 0
    var damagePopups: [DefenseDamagePopupState]
    var nextPopupIndex: Int = 0
    var fireballs: [DefenseFireballState]
    let playerX: CGFloat = 80
    let playerY: CGFloat = 300

    init(
        playerHp: Int,
        surviveSeconds: TimeInterval,
        maxEnemies: Int,
        practiceMode: Bool = false,
        tutorial: DefenseTutorialOptions? = nil,
        attackTrigger: DefenseAttackTrigger = .note,
        initialSpGauge: Int = 0
    ) {
        self.playerHp = playerHp
        self.playerMaxHp = playerHp
        self.surviveSeconds = surviveSeconds
        self.practiceMode = practiceMode
        self.tutorial = tutorial
        self.attackTrigger = attackTrigger
        self.spGauge = initialSpGauge
        self.waveStartedAt = practiceMode ? DefenseEnemyConfig.noWaveStart : 0
        self.damagePopups = Array(repeating: DefenseDamagePopupState(), count: DefenseEnemyConfig.damagePopupPoolSize)
        self.fireballs = Array(repeating: DefenseFireballState(), count: DefenseEnemyConfig.fireballPoolSize)
        self.enemies = (0..<maxEnemies).map { index in
            DefenseEnemyState(
                id: UUID(),
                isActive: false,
                type: .slime,
                x: 760,
                y: 300,
                hp: 1,
                maxHp: 1,
                speedPxPerSec: 40,
                damage: 1,
                attackIntervalSec: 3,
                attackRangePx: 48,
                knockbackMult: 1,
                knockbackVx: 0,
                lastAttackAt: 0,
                isMoving: false,
                attackHitPending: false,
                hitFlashAt: DefenseEnemyConfig.noHitFlash,
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

enum DefenseGamePhase: Equatable {
    case loading
    case loadError
    case countdown
    case playing
}

enum DefenseStartCountdown {
    static let durationSec: TimeInterval = 2.1
    static let firstStepSec: TimeInterval = 1.1
    static let secondStepSec: TimeInterval = 1.0

    static func displaySec(remaining: TimeInterval) -> Int {
        guard remaining > 0 else { return 0 }
        return min(2, Int(ceil(remaining)))
    }
}
