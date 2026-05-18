import Foundation

/// オンボーディング用 ii-V-I。譜面とコード表示はサバイバル Progression HINT と同じ経路を使う。
enum OnboardingChords {
    private static let entries: [SurvivalChordProgressionEntry] = [
        SurvivalChordProgressionEntry(
            name: "Dm7",
            voicing: [53, 57, 60, 64],
            voicingNames: ["F3", "A3", "C4", "E4"],
            keyFifths: 0
        ),
        SurvivalChordProgressionEntry(
            name: "G7",
            voicing: [53, 57, 59, 64],
            voicingNames: ["F3", "A3", "B3", "E4"],
            keyFifths: 0
        ),
        SurvivalChordProgressionEntry(
            name: "CM7",
            voicing: [52, 55, 59, 62],
            voicingNames: ["E3", "G3", "B3", "D4"],
            keyFifths: 0
        ),
    ]

    static let progressionChords: [SurvivalResolvedChord] = entries.enumerated().map { index, entry in
        SurvivalResolvedChord.fromProgressionEntry(entry, index: index)
    }

    static let dm7Voicing = progressionChords[0]
    static let g7Voicing = progressionChords[1]
    static let cm7Voicing = progressionChords[2]

    static let sceneThreeDm7Voicing = makeSceneThreeChord(
        index: 0,
        name: "Dm7",
        voicing: [60, 65],
        voicingNames: ["C4", "F4"]
    )
    static let sceneThreeG7Voicing = makeSceneThreeChord(
        index: 1,
        name: "G7",
        voicing: [59, 65],
        voicingNames: ["B3", "F4"]
    )
    static let sceneThreeCm7Voicing = makeSceneThreeChord(
        index: 2,
        name: "CM7",
        voicing: [59, 64],
        voicingNames: ["B3", "E4"]
    )
    static let sceneThreeProgressionChords: [SurvivalResolvedChord] = [
        sceneThreeDm7Voicing,
        sceneThreeG7Voicing,
        sceneThreeCm7Voicing,
    ]

    static let stageDefinition: SurvivalStageDefinition = {
        let base = SurvivalStageCatalog.stage(byNumber: 1) ?? fallbackBase
        return SurvivalStageDefinition(
            mapCategory: base.mapCategory,
            stageNumber: base.stageNumber,
            stageType: .progression,
            nameJa: "オンボーディング ii-V-I",
            nameEn: "Onboarding ii-V-I",
            difficulty: base.difficulty,
            chordSuffix: "",
            chordDisplayJa: "ii-V-I",
            chordDisplayEn: "ii-V-I",
            rootPattern: nil,
            rootPatternJa: "",
            rootPatternEn: "",
            allowedChords: [],
            blockKey: base.blockKey,
            isMixedStage: false,
            chordProgression: entries
        )
    }()

    static let stageConfig = SurvivalStageConfig(
        difficulty: "onboarding",
        displayName: "Onboarding",
        description: nil,
        descriptionEn: nil,
        allowedChords: [],
        enemySpawnRate: 3,
        enemySpawnCount: 2,
        enemyStatMultiplier: 1.0,
        expMultiplier: 1.0,
        itemDropRate: 0.1,
        bgmUrl: nil
    )

    private static let fallbackBase = SurvivalStageDefinition(
        mapCategory: .basic,
        stageNumber: 1,
        stageType: .progression,
        nameJa: "オンボーディング ii-V-I",
        nameEn: "Onboarding ii-V-I",
        difficulty: .easy,
        chordSuffix: "",
        chordDisplayJa: "ii-V-I",
        chordDisplayEn: "ii-V-I",
        rootPattern: nil,
        rootPatternJa: "",
        rootPatternEn: "",
        allowedChords: [],
        blockKey: "major",
        isMixedStage: false,
        chordProgression: entries
    )

    private static func makeSceneThreeChord(
        index: Int,
        name: String,
        voicing: [Int],
        voicingNames: [String]
    ) -> SurvivalResolvedChord {
        var pitchClasses: [Int] = []
        var seen = Set<Int>()
        for midi in voicing {
            let pc = ((midi % 12) + 12) % 12
            if seen.insert(pc).inserted {
                pitchClasses.append(pc)
            }
        }
        return SurvivalResolvedChord(
            id: "onboarding-scene3:\(index):\(name)",
            root: name,
            quality: .progression,
            midiNotes: voicing,
            pitchClasses: pitchClasses,
            displayName: name,
            progressionStaffVoicingNames: voicingNames,
            progressionStaffKeyFifths: 0
        )
    }
}
