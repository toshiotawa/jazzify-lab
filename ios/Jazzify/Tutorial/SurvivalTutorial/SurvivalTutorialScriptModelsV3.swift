import Foundation

// MARK: - Localized

struct SurvivalTutorialV3LocalizedText: Decodable, Sendable {
    let ja: String
    let en: String
    let speaker: String?

    func text(_ locale: AppLocale) -> String {
        locale == .ja ? ja : en
    }

    func interpolateRemaining(locale: AppLocale, remaining: Int) -> String {
        text(locale).replacingOccurrences(of: "{{remaining}}", with: "\(remaining)")
    }
}

// MARK: - Root metadata

struct SurvivalTutorialV3AudioTracks: Decodable, Sendable {
    let drum_loop: SurvivalTutorialV3DrumLoop?
}

struct SurvivalTutorialV3DrumLoop: Decodable, Sendable {
    let url: String
    let volume: Double?
}

struct SurvivalTutorialV3FinishConfig: Decodable, Sendable {
    let showCta: Bool?
}

struct SurvivalTutorialV3UiOverrides: Decodable, Sendable {
    let hidePlayerHpBar: Bool
    let hideSettingsButton: Bool
    let hideBackButton: Bool
    let hideMidiToggle: Bool?
    let showExitButton: Bool?
    let playerInvincible: Bool
    let disableEnemyAttacks: Bool
    let keyboardHintsDefault: Bool
}

// MARK: - Chord & content blocks

struct SurvivalTutorialV3ChordDef: Decodable, Sendable {
    let name: String
    let voicing: [Int]
    let voicingNames: [String]?
    let keyFifths: Int?
    let voicing_staves: [Int]?
}

struct SurvivalTutorialV3ProgressionContent: Decodable, Sendable {
    struct Stage: Decodable, Sendable {
        let name: String
        let nameEn: String
        let stageType: String
        let mapCategory: String?
        let chordDisplayName: String
        let chordDisplayNameEn: String
        let lessonOnly: Bool?
    }

    let stage: Stage
    let chordProgression: [SurvivalTutorialV3ChordDef]?
    let randomChordPoolEasy: [SurvivalTutorialV3ChordDef]?
    let randomChordPoolHard: [SurvivalTutorialV3ChordDef]?
}

struct SurvivalTutorialV3PhraseChordDef: Decodable, Sendable {
    let name: String
    let voicing: [Int]
    let voicingNames: [String]?
    let keyFifths: Int?
    let voicing_staves: [Int]?
    let measure_number: Int
    let quote: SurvivalTutorialV3LocalizedText?
}

struct SurvivalTutorialV3PhraseDef: Decodable, Sendable {
    let order_index: Int
    let title: String?
    let title_en: String?
    let audio_url: String?
    let loop_duration_sec: Double?
    let key_fifths: Int?
    let chords: [SurvivalTutorialV3PhraseChordDef]
}

struct SurvivalTutorialV3PhraseStageContent: Decodable, Sendable {
    struct Stage: Decodable, Sendable {
        let name: String
        let nameEn: String
        let stageType: String
        let mapCategory: String
        let chordDisplayName: String
        let chordDisplayNameEn: String
        let lessonOnly: Bool?
    }

    let stage: Stage
    let phrases: [SurvivalTutorialV3PhraseDef]
}

enum SurvivalTutorialV3ContentValue: Sendable {
    case progressionRandom(SurvivalTutorialV3ProgressionContent)
    case phraseStage(SurvivalTutorialV3PhraseStageContent)
}

struct SurvivalTutorialV3BattleDialogue: Decodable, Sendable {
    let intro: SurvivalTutorialV3LocalizedText
    let onReveal: SurvivalTutorialV3LocalizedText
    let onCorrectRemaining: SurvivalTutorialV3LocalizedText
}

// MARK: - Scenes

struct SurvivalTutorialV3DialogueOnlyScene: Decodable, Sendable {
    let type: String
    let lines: [SurvivalTutorialV3LocalizedText]
    let lineIntervalSeconds: Double?

    var hasJajiiSpeaker: Bool {
        lines.contains { SurvivalTutorialV3LineRouter.resolvedSpeaker($0, context: .dialogueOnly) == .jajii }
    }
}

struct SurvivalTutorialV3ProgressionBattleScene: Decodable, Sendable {
    let type: String
    let contentRef: String
    let loopCount: Int
    let introDelaySeconds: Double?
    let dialogue: SurvivalTutorialV3BattleDialogue
}

struct SurvivalTutorialV3RandomBattleScene: Decodable, Sendable {
    let type: String
    let contentRef: String
    let questionCount: Int
    let hardQuestions: Bool?
    let introDelaySeconds: Double?
    let dialogue: SurvivalTutorialV3BattleDialogue
}

struct SurvivalTutorialV3PhraseBattleScene: Decodable, Sendable {
    let type: String
    let contentRef: String
    let requiredLoops: Int
    let introDelaySeconds: Double?
    let dialogue: SurvivalTutorialV3BattleDialogue
}

struct SurvivalTutorialV3FinishScene: Decodable, Sendable {
    let type: String
}

struct SurvivalTutorialV3DemoChordEvent: Decodable, Sendable {
    let startBeat: Double
    let durationBeats: Double
    let chordName: String
    let voicing: [Int]
    let voicingNames: [String]?
    let keyFifths: Int?
    let voicing_staves: [Int]?
    let measure_number: Int
}

struct SurvivalTutorialV3DemoLine: Decodable, Sendable {
    let ja: String
    let en: String
    let speaker: String?
    let startBeat: Double
    let durationBeats: Double?
}

struct SurvivalTutorialV3DemoPlayScene: Decodable, Sendable {
    let type: String
    let bpm: Double
    let beatsPerMeasure: Double?
    let keyFifths: Int?
    let introLines: [SurvivalTutorialV3LocalizedText]?
    let chords: [SurvivalTutorialV3DemoChordEvent]
    let lines: [SurvivalTutorialV3DemoLine]
    let endHoldBeats: Double?
}

enum SurvivalTutorialV3Scene: Decodable, Sendable {
    case dialogueOnly(SurvivalTutorialV3DialogueOnlyScene)
    case progressionBattle(SurvivalTutorialV3ProgressionBattleScene)
    case randomBattle(SurvivalTutorialV3RandomBattleScene)
    case phraseBattle(SurvivalTutorialV3PhraseBattleScene)
    case demoPlay(SurvivalTutorialV3DemoPlayScene)
    case finish(SurvivalTutorialV3FinishScene)

    private enum CodingKeys: String, CodingKey { case type }

    enum SceneDecodingError: Error {
        case unknownType(String)
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let t = try c.decode(String.self, forKey: .type)
        switch t {
        case "dialogue_only":
            self = .dialogueOnly(try SurvivalTutorialV3DialogueOnlyScene(from: decoder))
        case "progression_battle":
            self = .progressionBattle(try SurvivalTutorialV3ProgressionBattleScene(from: decoder))
        case "random_battle":
            self = .randomBattle(try SurvivalTutorialV3RandomBattleScene(from: decoder))
        case "phrase_battle":
            self = .phraseBattle(try SurvivalTutorialV3PhraseBattleScene(from: decoder))
        case "demo_play":
            self = .demoPlay(try SurvivalTutorialV3DemoPlayScene(from: decoder))
        case "finish":
            self = .finish(try SurvivalTutorialV3FinishScene(from: decoder))
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: c, debugDescription: "Unknown survival tutorial scene type: \(t)")
        }
    }
}

private struct SurvivalTutorialV3ContentEntry: Decodable, Sendable {
    let value: SurvivalTutorialV3ContentValue

    private enum CodingKeys: String, CodingKey { case phrases }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if c.contains(.phrases) {
            value = .phraseStage(try SurvivalTutorialV3PhraseStageContent(from: decoder))
        } else {
            value = .progressionRandom(try SurvivalTutorialV3ProgressionContent(from: decoder))
        }
    }
}

// MARK: - Payload

struct SurvivalTutorialScriptPayloadV3: Decodable, Sendable {
    let version: Int
    let audioTracks: SurvivalTutorialV3AudioTracks?
    let ui: SurvivalTutorialV3UiOverrides
    let content: [String: SurvivalTutorialV3ContentValue]
    let scenes: [SurvivalTutorialV3Scene]
    let finish: SurvivalTutorialV3FinishConfig?

    enum CodingKeys: String, CodingKey {
        case version
        case audioTracks
        case ui
        case content
        case scenes
        case finish
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        version = try c.decode(Int.self, forKey: .version)
        audioTracks = try c.decodeIfPresent(SurvivalTutorialV3AudioTracks.self, forKey: .audioTracks)
        ui = try c.decode(SurvivalTutorialV3UiOverrides.self, forKey: .ui)
        finish = try c.decodeIfPresent(SurvivalTutorialV3FinishConfig.self, forKey: .finish)

        let entries = try c.decode([String: SurvivalTutorialV3ContentEntry].self, forKey: .content)
        content = entries.mapValues(\.value)
        scenes = try c.decode([SurvivalTutorialV3Scene].self, forKey: .scenes)
    }
}

extension SurvivalTutorialScriptPayloadV3 {
    var isInterpretedV3: Bool { version == 3 && !scenes.isEmpty }
}
