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
    /// staff3(ベース) の実音高 MIDI。塊を正解した瞬間にアプリ音源で発音(play 専用)。
    let bass: [Int]?
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

struct SurvivalTutorialV3SceneBgm: Decodable, Sendable, Equatable {
    let url: String?
    let resetOnEnter: Bool?
}

// MARK: - Scenes

struct SurvivalTutorialV3DialogueOnlyScene: Decodable, Sendable {
    let type: String
    let bgm: SurvivalTutorialV3SceneBgm?
    let lines: [SurvivalTutorialV3LocalizedText]
    let lineIntervalSeconds: Double?

    var hasJajiiSpeaker: Bool {
        lines.contains { SurvivalTutorialV3LineRouter.resolvedSpeaker($0, context: .dialogueOnly) == .jajii }
    }
}

struct SurvivalTutorialV3ProgressionBattleScene: Decodable, Sendable {
    let type: String
    let bgm: SurvivalTutorialV3SceneBgm?
    let contentRef: String
    let loopCount: Int
    let introDelaySeconds: Double?
    let dialogue: SurvivalTutorialV3BattleDialogue
}

struct SurvivalTutorialV3RandomBattleScene: Decodable, Sendable {
    let type: String
    let bgm: SurvivalTutorialV3SceneBgm?
    let contentRef: String
    let questionCount: Int
    let hardQuestions: Bool?
    let introDelaySeconds: Double?
    let dialogue: SurvivalTutorialV3BattleDialogue
}

struct SurvivalTutorialV3PhraseBattleScene: Decodable, Sendable {
    let type: String
    let bgm: SurvivalTutorialV3SceneBgm?
    let contentRef: String
    let requiredLoops: Int
    let introDelaySeconds: Double?
    let dialogue: SurvivalTutorialV3BattleDialogue
    /// true のとき「一緒に弾かせる(V4 play)」モード。塊ごとに quote セリフ/休符自動送り/正解時 bass。
    let playAlong: Bool?
}

struct SurvivalTutorialV3FinishScene: Decodable, Sendable {
    let type: String
}

struct SurvivalTutorialV3DemoRollStep: Decodable, Sendable, Equatable {
    let startBeat: Double
    let newVoicing: [Int]
    let voicing: [Int]
    let voicingNames: [String]?
    let voicing_staves: [Int]?
    let newBass: [Int]?
    let bass: [Int]?
}

struct SurvivalTutorialV3DemoChordEvent: Decodable, Sendable, Equatable {
    let startBeat: Double
    let durationBeats: Double
    let chordName: String
    /// MIDI 番号。空配列は休符小節（空の五線譜）を表す。
    let voicing: [Int]
    let voicingNames: [String]?
    let keyFifths: Int?
    let voicing_staves: [Int]?
    /// DB / Web: `measureNumber`。phrase 系は `measure_number` のため demo_play のみ別キー。
    let measure_number: Int
    /// staff3(ベース) の MIDI。表示はせず livePlayback 時にアプリ音源で再生する。
    let bass: [Int]?
    let rollSteps: [SurvivalTutorialV3DemoRollStep]?

    private enum CodingKeys: String, CodingKey {
        case startBeat
        case durationBeats
        case chordName
        case voicing
        case voicingNames
        case keyFifths
        case voicing_staves
        case measureNumber
        case measure_number
        case bass
        case rollSteps
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        startBeat = try c.decode(Double.self, forKey: .startBeat)
        durationBeats = try c.decode(Double.self, forKey: .durationBeats)
        chordName = try c.decode(String.self, forKey: .chordName)
        voicing = try c.decode([Int].self, forKey: .voicing)
        voicingNames = try c.decodeIfPresent([String].self, forKey: .voicingNames)
        keyFifths = try c.decodeIfPresent(Int.self, forKey: .keyFifths)
        voicing_staves = try c.decodeIfPresent([Int].self, forKey: .voicing_staves)
        bass = try c.decodeIfPresent([Int].self, forKey: .bass)
        rollSteps = try c.decodeIfPresent([SurvivalTutorialV3DemoRollStep].self, forKey: .rollSteps)
        if let n = try c.decodeIfPresent(Int.self, forKey: .measureNumber) {
            measure_number = n
        } else {
            measure_number = try c.decode(Int.self, forKey: .measure_number)
        }
    }
}

struct SurvivalTutorialV3DemoLine: Decodable, Sendable {
    let ja: String
    let en: String
    let speaker: String?
    let startBeat: Double
    let durationBeats: Double?
}

struct SurvivalTutorialV3DemoPlayAudio: Decodable, Sendable {
    let url: String?
    let url_ja: String?
    let url_en: String?
    let volume: Double?
}

struct SurvivalTutorialV3DemoPlayScene: Decodable, Sendable {
    let type: String
    let bgm: SurvivalTutorialV3SceneBgm?
    let bpm: Double
    let beatsPerMeasure: Double?
    let keyFifths: Int?
    let introLines: [SurvivalTutorialV3LocalizedText]?
    let chords: [SurvivalTutorialV3DemoChordEvent]
    let lines: [SurvivalTutorialV3DemoLine]
    let endHoldBeats: Double?
    let audio: SurvivalTutorialV3DemoPlayAudio?
    /// true のとき各和音開始でアプリ音源(ピアノ)で voicing+bass を発音する。V4 由来。
    let livePlayback: Bool?
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

    var isPhraseBattle: Bool {
        if case .phraseBattle = self { return true }
        return false
    }

    var isDemoPlay: Bool {
        if case .demoPlay = self { return true }
        return false
    }

    var isFinish: Bool {
        if case .finish = self { return true }
        return false
    }

    var bgm: SurvivalTutorialV3SceneBgm? {
        switch self {
        case let .dialogueOnly(scene): scene.bgm
        case let .progressionBattle(scene): scene.bgm
        case let .randomBattle(scene): scene.bgm
        case let .phraseBattle(scene): scene.bgm
        case let .demoPlay(scene): scene.bgm
        case .finish: nil
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
