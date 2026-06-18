import Foundation

/// レッスン Random 課題用カスタムヴォイシング（`lesson_songs.survival_random_chords`）。
struct SurvivalLessonRandomChordEntry: Codable, Sendable, Equatable {
    let name: String
    let voicing: [Int]
    let voicingNames: [String]?
    let voicingStaves: [Int]?
    let keyFifths: Int?

    enum CodingKeys: String, CodingKey {
        case name, voicing
        case voicingNames = "voicing_names"
        case voicingStaves = "voicing_staves"
        case keyFifths = "key_fifths"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = (try container.decode(String.self, forKey: .name)).trimmingCharacters(in: .whitespacesAndNewlines)
        voicing = Self.decodeVoicing(from: container)
        voicingNames = Self.decodeStringArray(from: container, key: .voicingNames)
        voicingStaves = Self.decodeStaves(from: container, voicingCount: voicing.count)
        if let raw = try container.decodeIfPresent(Int.self, forKey: .keyFifths) {
            keyFifths = Self.clampKeyFifths(raw)
        } else {
            keyFifths = nil
        }
    }

    init(
        name: String,
        voicing: [Int],
        voicingNames: [String]? = nil,
        voicingStaves: [Int]? = nil,
        keyFifths: Int? = nil
    ) {
        self.name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        self.voicing = voicing
        self.voicingNames = voicingNames
        self.voicingStaves = voicingStaves
        self.keyFifths = keyFifths.map(Self.clampKeyFifths)
    }

    private static func clampKeyFifths(_ value: Int) -> Int {
        min(5, max(-6, value))
    }

    private static func decodeVoicing(from container: KeyedDecodingContainer<CodingKeys>) -> [Int] {
        guard let raw = try? container.decode([Int].self, forKey: .voicing) else { return [] }
        return raw.map { Int($0) }
    }

    private static func decodeStringArray(
        from container: KeyedDecodingContainer<CodingKeys>,
        key: CodingKeys
    ) -> [String]? {
        guard let raw = try? container.decode([String].self, forKey: key) else { return nil }
        let trimmed = raw.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        return trimmed.isEmpty ? nil : trimmed
    }

    private static func decodeStaves(
        from container: KeyedDecodingContainer<CodingKeys>,
        voicingCount: Int
    ) -> [Int]? {
        guard voicingCount > 0,
              let raw = try? container.decode([Int].self, forKey: .voicingStaves),
              raw.count == voicingCount else {
            return nil
        }
        for value in raw where value != 1 && value != 2 {
            return nil
        }
        return raw
    }
}

struct AppliedSurvivalLessonRandomChords: Sendable, Equatable {
    let allowedChordIds: [String]
    let overrides: [String: SurvivalResolvedChord]
}

enum SurvivalLessonRandomChords {
    static func buildLessonRandomChord(
        from entry: SurvivalLessonRandomChordEntry
    ) -> SurvivalResolvedChord? {
        let name = entry.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty, !entry.voicing.isEmpty else { return nil }

        let voicingNames: [String]
        if let names = entry.voicingNames, names.count == entry.voicing.count {
            voicingNames = names
        } else {
            voicingNames = entry.voicing.map(String.init)
        }

        return SurvivalResolvedChord.fromExplicitTutorialVoicing(
            id: name,
            name: name,
            voicing: entry.voicing,
            voicingNames: voicingNames,
            keyFifths: entry.keyFifths ?? 0,
            progressionStaffVoicingStaves: entry.voicingStaves
        )
    }

    static func applyLessonRandomChords(
        stageAllowedChordIds: [String],
        entries: [SurvivalLessonRandomChordEntry]?,
        stageType: SurvivalStageType
    ) -> AppliedSurvivalLessonRandomChords {
        guard stageType == .random,
              let entries,
              !entries.isEmpty else {
            return AppliedSurvivalLessonRandomChords(
                allowedChordIds: stageAllowedChordIds,
                overrides: [:]
            )
        }

        var overrides: [String: SurvivalResolvedChord] = [:]
        var allowedIds: [String] = []
        allowedIds.reserveCapacity(entries.count)

        for entry in entries {
            let trimmedName = entry.name.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmedName.isEmpty else { continue }
            guard let resolved = buildLessonRandomChord(from: entry) else { continue }
            overrides[trimmedName] = resolved
            allowedIds.append(trimmedName)
        }

        return AppliedSurvivalLessonRandomChords(
            allowedChordIds: allowedIds.isEmpty ? stageAllowedChordIds : allowedIds,
            overrides: overrides
        )
    }

    static func applyLessonRandomChords(
        stageAllowedChordIds: [String],
        entries: [SurvivalLessonRandomChordEntry]?,
        stageType: BalloonRushStageDefinition.StageType
    ) -> AppliedSurvivalLessonRandomChords {
        let survivalType: SurvivalStageType = stageType == .progression ? .progression : .random
        return applyLessonRandomChords(
            stageAllowedChordIds: stageAllowedChordIds,
            entries: entries,
            stageType: survivalType
        )
    }

    static func survivalStage(
        _ stage: SurvivalStageDefinition,
        applied: AppliedSurvivalLessonRandomChords
    ) -> SurvivalStageDefinition {
        guard !applied.overrides.isEmpty else { return stage }
        return SurvivalStageDefinition(
            mapCategory: stage.mapCategory,
            stageNumber: stage.stageNumber,
            stageType: stage.stageType,
            nameJa: stage.nameJa,
            nameEn: stage.nameEn,
            difficulty: stage.difficulty,
            chordSuffix: stage.chordSuffix,
            chordDisplayJa: stage.chordDisplayJa,
            chordDisplayEn: stage.chordDisplayEn,
            rootPattern: stage.rootPattern,
            rootPatternJa: stage.rootPatternJa,
            rootPatternEn: stage.rootPatternEn,
            allowedChords: applied.allowedChordIds,
            blockKey: stage.blockKey,
            isMixedStage: stage.isMixedStage,
            chordProgression: stage.chordProgression,
            lessonOnly: stage.lessonOnly,
            grandStaffMode: stage.grandStaffMode,
            compositePhraseSources: stage.compositePhraseSources,
            compositePhraseBossType: stage.compositePhraseBossType,
            compositePhraseKeyFifths: stage.compositePhraseKeyFifths,
            compositePhraseBgmUrl: stage.compositePhraseBgmUrl,
            productionStaffHintMode: stage.productionStaffHintMode,
            productionKeyboardHintMode: stage.productionKeyboardHintMode,
            hideChordNamesInBattle: stage.hideChordNamesInBattle,
            playMode: stage.playMode,
            runMapId: stage.runMapId,
            runTimeLimitSec: stage.runTimeLimitSec,
            runDialogueScript: stage.runDialogueScript
        )
    }
}
