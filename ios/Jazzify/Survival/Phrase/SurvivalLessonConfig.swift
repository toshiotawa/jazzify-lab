import Foundation

struct SurvivalLessonCompositeDamageOverrides: Codable, Sendable, Equatable {
    let note: Int?
    let measureRange: Int?
    let finishPrimary: Int?
    let finishRepeat: Int?
}

struct SurvivalLessonCompositeChordInput: Codable, Sendable, Equatable {
    let chordName: String
    let measureNumber: Int?
    let noteNames: [String]
    let noteStaves: [Int]?
}

struct SurvivalLessonCompositePhraseInput: Codable, Sendable, Equatable {
    let title: String?
    let chords: [SurvivalLessonCompositeChordInput]
}

struct SurvivalLessonCompositeConfig: Codable, Sendable, Equatable {
    let bossType: String?
    let keyFifths: Int?
    let phrases: [SurvivalLessonCompositePhraseInput]
}

struct SurvivalLessonOverrides: Codable, Sendable, Equatable {
    let bossMaxHp: Int?
    let playerMaxHp: Int?
    let bgmUrl: String?
    let timeLimitSec: Int?
    let killQuota: Int?
    let enemyStatMultiplier: Double?
    let playerStatMultiplier: Double?
    let compositeDamage: SurvivalLessonCompositeDamageOverrides?
}

struct ResolvedSurvivalLessonCompositeDamage: Sendable, Equatable {
    let note: Int
    let measureRange: Int
    let finishPrimary: Int
    let finishRepeat: Int
}

struct ResolvedSurvivalLessonRuntime: Sendable, Equatable {
    let bossMaxHp: Int
    let playerMaxHp: Int
    let bgmUrl: URL?
    let timeLimitSec: TimeInterval
    let killQuota: Int
    let enemyStatMultiplier: Double
    let playerStatMultiplier: Double
    let compositeDamage: ResolvedSurvivalLessonCompositeDamage
}

enum SurvivalLessonConfig {
    private static let defaultCompositeDamage = ResolvedSurvivalLessonCompositeDamage(
        note: SurvivalCompositePhraseDamage.note,
        measureRange: SurvivalCompositePhraseDamage.measureRange,
        finishPrimary: SurvivalCompositePhraseDamage.phraseFinishPrimary,
        finishRepeat: SurvivalCompositePhraseDamage.phraseFinishRepeat
    )

    static func lessonSongHasInlineComposite(_ config: SurvivalLessonCompositeConfig?) -> Bool {
        guard let config, config.phrases.count >= 2 else { return false }
        return true
    }

    static func isLessonInlineCompositeStage(_ stage: SurvivalStageDefinition) -> Bool {
        stage.blockKey.rawValue == "lesson_composite"
    }

    private static func normalizeBossType(_ raw: String?) -> SurvivalBossType {
        switch raw?.uppercased() {
        case "A": return .A
        case "C": return .C
        default: return .B
        }
    }

    private static func positiveInt(_ value: Int?) -> Int? {
        guard let value, value > 0 else { return nil }
        return value
    }

    private static func positiveNumber(_ value: Double?) -> Double? {
        guard let value, value > 0 else { return nil }
        return value
    }

    static func buildSurvivalPhrasesFromLessonCompositeConfig(
        _ config: SurvivalLessonCompositeConfig,
        lessonSongId: UUID
    ) throws -> [SurvivalPhraseDefinition] {
        var phrases: [SurvivalPhraseDefinition] = []
        phrases.reserveCapacity(config.phrases.count)

        for (phraseIndex, phraseInput) in config.phrases.enumerated() {
            var chords: [SurvivalPhraseChord] = []
            chords.reserveCapacity(phraseInput.chords.count)

            for (chordIndex, chordInput) in phraseInput.chords.enumerated() {
                var notes: [SurvivalPhraseChordNote] = []
                notes.reserveCapacity(chordInput.noteNames.count)

                for (noteIndex, noteName) in chordInput.noteNames.enumerated() {
                    guard let pitchMidi = EarTrainingChordVoicingEngine.noteNameToMidi(noteName) else {
                        throw SurvivalLessonConfigError.invalidNoteName(noteName)
                    }
                    let staffRaw = chordInput.noteStaves?[safe: noteIndex] ?? 1
                    let staff = staffRaw == 2 ? 2 : 1
                    notes.append(
                        SurvivalPhraseChordNote(
                            orderIndex: noteIndex,
                            pitchMidi: pitchMidi,
                            pitchClass: ((pitchMidi % 12) + 12) % 12,
                            noteName: noteName.trimmingCharacters(in: .whitespacesAndNewlines),
                            staff: staff
                        )
                    )
                }

                chords.append(
                    SurvivalPhraseChord(
                        id: "lesson-\(lessonSongId.uuidString):p\(phraseIndex):c\(chordIndex)",
                        orderIndex: chordIndex,
                        chordName: chordInput.chordName,
                        measureNumber: chordInput.measureNumber ?? 1,
                        notes: notes
                    )
                )
            }

            let title = phraseInput.title?.trimmingCharacters(in: .whitespacesAndNewlines)
            phrases.append(
                SurvivalPhraseDefinition(
                    id: "lesson-\(lessonSongId.uuidString):phrase-\(phraseIndex)",
                    mapCategory: SurvivalMapCategory.phrases.rawValue,
                    stageNumber: phraseIndex + 1,
                    title: (title?.isEmpty == false ? title : nil) ?? "Phrase \(phraseIndex + 1)",
                    bgmUrl: nil,
                    keyFifths: config.keyFifths ?? 0,
                    chords: chords
                )
            )
        }

        return phrases
    }

    static func buildLessonCompositeStageDefinition(
        title: String,
        titleEn: String,
        config: SurvivalLessonCompositeConfig
    ) -> SurvivalStageDefinition {
        SurvivalStageDefinition(
            mapCategory: .phrases,
            stageNumber: 0,
            stageType: .progression,
            nameJa: title,
            nameEn: titleEn,
            difficulty: .easy,
            chordSuffix: "",
            chordDisplayJa: "Composite",
            chordDisplayEn: "Composite",
            rootPattern: nil,
            rootPatternJa: "",
            rootPatternEn: "",
            allowedChords: [],
            blockKey: SurvivalBlockKey(rawValue: "lesson_composite"),
            isMixedStage: false,
            chordProgression: nil,
            lessonOnly: true,
            compositePhraseSources: nil,
            compositePhraseBossType: normalizeBossType(config.bossType),
            compositePhraseKeyFifths: config.keyFifths ?? 0,
            compositePhraseBgmUrl: nil
        )
    }

    static func resolveCompositeDamageOverrides(
        _ raw: SurvivalLessonCompositeDamageOverrides?
    ) -> ResolvedSurvivalLessonCompositeDamage {
        ResolvedSurvivalLessonCompositeDamage(
            note: positiveInt(raw?.note) ?? defaultCompositeDamage.note,
            measureRange: positiveInt(raw?.measureRange) ?? defaultCompositeDamage.measureRange,
            finishPrimary: positiveInt(raw?.finishPrimary) ?? defaultCompositeDamage.finishPrimary,
            finishRepeat: positiveInt(raw?.finishRepeat) ?? defaultCompositeDamage.finishRepeat
        )
    }

    static func resolveSurvivalLessonRuntime(
        overrides: SurvivalLessonOverrides?,
        stage: SurvivalStageDefinition,
        baseConfig: SurvivalStageConfig,
        isBossStage: Bool,
        isCompositeBoss: Bool
    ) -> ResolvedSurvivalLessonRuntime {
        let defaultBossHp = stage.resolvedBossMaxHp
        let defaultPlayerHp: Int = {
            if isBossStage {
                return stage.mapCategory == .phrases
                    ? SurvivalConstants.phrasesBossPlayerMaxHp
                    : SurvivalConstants.bossPlayerMaxHp
            }
            return SurvivalConstants.stagePlayerMaxHp
        }()

        let bgmTrimmed = overrides?.bgmUrl?.trimmingCharacters(in: .whitespacesAndNewlines)
        let bgmUrl = (bgmTrimmed?.isEmpty == false) ? URL(string: bgmTrimmed!) : nil

        return ResolvedSurvivalLessonRuntime(
            bossMaxHp: positiveInt(overrides?.bossMaxHp) ?? defaultBossHp,
            playerMaxHp: positiveInt(overrides?.playerMaxHp) ?? defaultPlayerHp,
            bgmUrl: bgmUrl,
            timeLimitSec: TimeInterval(positiveInt(overrides?.timeLimitSec) ?? Int(SurvivalConstants.stageTimeLimitSec)),
            killQuota: positiveInt(overrides?.killQuota) ?? stage.stageKillQuota,
            enemyStatMultiplier: positiveNumber(overrides?.enemyStatMultiplier) ?? baseConfig.enemyStatMultiplier,
            playerStatMultiplier: positiveNumber(overrides?.playerStatMultiplier) ?? 1,
            compositeDamage: isCompositeBoss
                ? resolveCompositeDamageOverrides(overrides?.compositeDamage)
                : defaultCompositeDamage
        )
    }

    static func applyPlayerStatMultiplier(
        stats: SurvivalPlayerStats,
        multiplier: Double
    ) -> SurvivalPlayerStats {
        guard multiplier != 1 else { return stats }
        var updated = stats
        updated.aAtk = max(1, Int((Double(stats.aAtk) * multiplier).rounded()))
        updated.bAtk = max(1, Int((Double(stats.bAtk) * multiplier).rounded()))
        updated.cAtk = max(1, Int((Double(stats.cAtk) * multiplier).rounded()))
        return updated
    }

    static func configWithLessonRuntime(
        base: SurvivalStageConfig,
        runtime: ResolvedSurvivalLessonRuntime,
        stageType: SurvivalStageType
    ) -> SurvivalStageConfig {
        SurvivalStageConfig(
            difficulty: base.difficulty,
            displayName: base.displayName,
            description: base.description,
            descriptionEn: base.descriptionEn,
            allowedChords: base.allowedChords,
            enemySpawnRate: base.enemySpawnRate,
            enemySpawnCount: base.enemySpawnCount,
            enemyStatMultiplier: runtime.enemyStatMultiplier,
            expMultiplier: base.expMultiplier,
            itemDropRate: base.itemDropRate,
            bgmUrl: runtime.bgmUrl ?? base.bgmUrl ?? SurvivalBgmDefaults.url(for: stageType)
        )
    }
}

enum SurvivalLessonConfigError: Error {
    case invalidNoteName(String)
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
