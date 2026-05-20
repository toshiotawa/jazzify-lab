import Foundation

/// Web `buildTutorialStageFromSurvivalV3Content.ts` 相当。
enum SurvivalTutorialV3StageBuilder {
    static func progressionEntry(from def: SurvivalTutorialV3ChordDef) -> SurvivalChordProgressionEntry {
        SurvivalChordProgressionEntry(
            name: def.name,
            voicing: def.voicing,
            voicingNames: def.voicingNames,
            keyFifths: def.keyFifths,
            voicingStaves: def.voicing_staves
        )
    }

    /// Stable index は配列並びのみ。見かけ ID を `idPrefix` で統一したいときに使う。
    static func resolvedChord(
        from def: SurvivalTutorialV3ChordDef,
        stableIndex: Int,
        idPrefix: String
    ) -> SurvivalResolvedChord {
        let base = SurvivalResolvedChord.fromProgressionEntry(progressionEntry(from: def), index: stableIndex)
        let chordId = "\(idPrefix):\(stableIndex):\(def.name)"
        return SurvivalResolvedChord(
            id: chordId,
            root: base.root,
            quality: base.quality,
            midiNotes: base.midiNotes,
            pitchClasses: base.pitchClasses,
            displayName: base.displayName,
            progressionStaffVoicingNames: base.progressionStaffVoicingNames,
            progressionStaffVoicingStaves: base.progressionStaffVoicingStaves,
            progressionStaffKeyFifths: base.progressionStaffKeyFifths
        )
    }

    /// Web `pickRandomTutorialChords` と同様（低頻・チュートリアル限定）。
    static func pickRandomResolvedChords(
        block: SurvivalTutorialV3ProgressionContent,
        hard: Bool,
        count: Int
    ) -> [SurvivalResolvedChord] {
        var pool = hard ? block.randomChordPoolHard ?? [] : block.randomChordPoolEasy ?? []
        if hard, pool.isEmpty {
            pool = block.randomChordPoolEasy ?? []
        }
        guard !pool.isEmpty, count > 0 else { return [] }
        let poolLen = pool.count
        var out: [SurvivalResolvedChord] = []
        out.reserveCapacity(count)
        for idx in 0..<count {
            let randIdx = Int.random(in: 0..<poolLen)
            let def = pool[randIdx]
            out.append(Self.resolvedChord(from: def, stableIndex: idx, idPrefix: "tutorial-rand"))
        }
        return out
    }

    static func buildStageDefinition(from content: SurvivalTutorialV3ContentValue) -> SurvivalStageDefinition? {
        let base = SurvivalStageCatalog.stage(byNumber: 1) ?? OnboardingChords.stageDefinition
        switch content {
        case let .phraseStage(phraseStage):
            return SurvivalStageDefinition(
                mapCategory: .phrases,
                stageNumber: 0,
                stageType: .random,
                nameJa: phraseStage.stage.name,
                nameEn: phraseStage.stage.nameEn,
                difficulty: base.difficulty,
                chordSuffix: "",
                chordDisplayJa: phraseStage.stage.chordDisplayName,
                chordDisplayEn: phraseStage.stage.chordDisplayNameEn,
                rootPattern: nil,
                rootPatternJa: "",
                rootPatternEn: "",
                allowedChords: [],
                blockKey: "lesson_practice",
                isMixedStage: false,
                chordProgression: nil
            )
        case let .progressionRandom(block):
            let stageTy = SurvivalStageType(rawValue: block.stage.stageType) ?? .progression
            let chordProgressionEntries: [SurvivalChordProgressionEntry]? = {
                guard stageTy == .progression else { return nil }
                let raw = block.chordProgression ?? []
                return raw.map { progressionEntry(from: $0) }
            }()

            let easy = block.randomChordPoolEasy ?? []
            let hard = block.randomChordPoolHard ?? []
            let allowedUnique: [String] = {
                guard stageTy == .random else { return [] }
                let names = easy.map(\.name) + hard.map(\.name)
                var seen = Set<String>()
                var ordered: [String] = []
                for n in names where seen.insert(n).inserted {
                    ordered.append(n)
                }
                return ordered
            }()

            let mapCategory = SurvivalMapCategory(rawValue: block.stage.mapCategory ?? "lesson") ?? .lesson

            return SurvivalStageDefinition(
                mapCategory: mapCategory,
                stageNumber: 0,
                stageType: stageTy,
                nameJa: block.stage.name,
                nameEn: block.stage.nameEn,
                difficulty: base.difficulty,
                chordSuffix: "",
                chordDisplayJa: block.stage.chordDisplayName,
                chordDisplayEn: block.stage.chordDisplayNameEn,
                rootPattern: nil,
                rootPatternJa: "",
                rootPatternEn: "",
                allowedChords: allowedUnique,
                blockKey: "lesson_practice",
                isMixedStage: false,
                chordProgression: chordProgressionEntries
            )
        }
    }

    static func buildStageConfig(stage: SurvivalStageDefinition, content: SurvivalTutorialV3ContentValue) -> SurvivalStageConfig {
        switch content {
        case let .phraseStage(phraseStage):
            let phrase0 = phraseStage.phrases.first
            let trimmed = phrase0?.audio_url?.trimmingCharacters(in: .whitespacesAndNewlines)
            let url: URL?
            if let trimmed, !trimmed.isEmpty {
                url = URL(string: trimmed)
            } else {
                url = SurvivalBgmDefaults.url(for: .phrases)
            }
            return SurvivalStageConfig(
                difficulty: "easy",
                displayName: stage.nameJa,
                description: stage.nameJa,
                descriptionEn: stage.nameEn,
                allowedChords: [],
                enemySpawnRate: 3,
                enemySpawnCount: 2,
                enemyStatMultiplier: 0.5,
                expMultiplier: 0.5,
                itemDropRate: 0.1,
                bgmUrl: url
            )
        case let .progressionRandom(block):
            let stageTy = SurvivalStageType(rawValue: block.stage.stageType) ?? .progression
            let pool: [SurvivalTutorialV3ChordDef] =
                stageTy == .random
                    ? (block.randomChordPoolEasy ?? []) + (block.randomChordPoolHard ?? [])
                    : (block.chordProgression ?? [])
            var seen = Set<String>()
            let ids = pool.filter { seen.insert($0.name).inserted }.map(\.name)
            return SurvivalStageConfig(
                difficulty: "easy",
                displayName: stage.nameJa,
                description: stage.nameJa,
                descriptionEn: stage.nameEn,
                allowedChords: ids,
                enemySpawnRate: 3,
                enemySpawnCount: 2,
                enemyStatMultiplier: 0.5,
                expMultiplier: 0.5,
                itemDropRate: 0.1,
                bgmUrl: nil
            )
        }
    }

    static func buildInlinePhrase(from phraseStage: SurvivalTutorialV3PhraseStageContent) -> SurvivalPhraseDefinition? {
        guard let phrase0 = phraseStage.phrases.first else { return nil }
        guard !phrase0.chords.isEmpty else { return nil }

        var chordModels: [SurvivalPhraseChord] = []
        chordModels.reserveCapacity(phrase0.chords.count)
        for (chordIndex, ch) in phrase0.chords.enumerated() {
            let voicingNamesOrFallback = ch.voicingNames ?? ch.voicing.map { "M\($0)" }
            guard voicingNamesOrFallback.count == ch.voicing.count else { return nil }
            var notes: [SurvivalPhraseChordNote] = []
            notes.reserveCapacity(ch.voicing.count)
            for ni in ch.voicing.indices {
                let pitchMidi = ch.voicing[ni]
                let trimmed = voicingNamesOrFallback[ni].trimmingCharacters(in: .whitespacesAndNewlines)
                let noteName = trimmed.isEmpty ? "N\(ni)" : trimmed
                let pc = ((pitchMidi % 12) + 12) % 12
                let staffNum: Int = {
                    if let vs = ch.voicing_staves, vs.indices.contains(ni), vs[ni] == 1 {
                        return 1
                    }
                    return 2
                }()
                notes.append(
                    SurvivalPhraseChordNote(
                        orderIndex: ni,
                        pitchMidi: pitchMidi,
                        pitchClass: pc,
                        noteName: noteName,
                        staff: staffNum
                    )
                )
            }
            chordModels.append(
                SurvivalPhraseChord(
                    id: "tutorial-phrase:\(chordIndex):\(ch.name)",
                    orderIndex: chordIndex,
                    chordName: ch.name,
                    measureNumber: ch.measure_number,
                    notes: notes
                )
            )
        }

        let titleJa: String
        if let t = phrase0.title?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty {
            titleJa = t
        } else {
            titleJa = phraseStage.stage.name
        }
        let keyFf = phrase0.key_fifths ?? 0
        let audioTrimmed = phrase0.audio_url?.trimmingCharacters(in: .whitespacesAndNewlines)
        let bgm = audioTrimmed.flatMap { $0.isEmpty ? nil : $0 }

        return SurvivalPhraseDefinition(
            id: "tutorial-v3-inline-phrase",
            mapCategory: "phrases",
            stageNumber: 0,
            title: titleJa,
            bgmUrl: bgm,
            keyFifths: keyFf,
            chords: chordModels
        )
    }
}
