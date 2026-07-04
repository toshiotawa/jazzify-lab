import Foundation

struct EarTrainingTutorialLocalizedText: Decodable, Sendable {
    let ja: String
    let en: String

    func localized(_ locale: AppLocale) -> String {
        locale == .ja ? ja : en
    }
}

enum EarTrainingTutorialDialogueSpeaker: String, Codable, Sendable {
    case player
    case partner
}

struct EarTrainingTutorialDialogueLine: Decodable, Sendable {
    let ja: String
    let en: String
    let speaker: EarTrainingTutorialDialogueSpeaker?

    func localized(_ locale: AppLocale) -> String {
        locale == .ja ? ja : en
    }

    var resolvedSpeaker: EarTrainingTutorialDialogueSpeaker {
        speaker ?? .player
    }
}

struct EarTrainingTutorialUiOverrides: Decodable, Sendable {
    let hidePlayerHpBar: Bool
    let hideSettingsButton: Bool
    let hideBackButton: Bool
    let hideLobby: Bool
    let hideMidiToggle: Bool
    let hidePhraseIntroQuota: Bool
    let showExitButton: Bool
    let playerInvincible: Bool
    let disableEnemyAttacks: Bool?
    let keyboardHintsDefault: Bool

    var noCombat: Bool {
        disableEnemyAttacks ?? playerInvincible
    }
}

struct EarTrainingTutorialScriptPayload: Decodable, Sendable {
    let version: Int
    let audioTracks: EarTrainingTutorialAudioTracks?
    let ui: EarTrainingTutorialUiOverrides
    let content: [String: EarTrainingTutorialContentRef]
    let scenes: [EarTrainingTutorialScene]
    let finish: EarTrainingTutorialFinishConfig?

    var isValid: Bool { version == 1 && !scenes.isEmpty }
}

struct EarTrainingTutorialAudioTracks: Decodable, Sendable {
    let drum_loop: EarTrainingTutorialDrumLoop?
}

struct EarTrainingTutorialDrumLoop: Decodable, Sendable {
    let url: String
    let volume: Double?
}

struct EarTrainingTutorialFinishConfig: Decodable, Sendable {
    let showCta: Bool?
}

struct EarTrainingTutorialContentPhrasePairAdlibStep: Decodable, Sendable {
    let order_index: Int
    let chord_name: String
    let pattern_group_key: String
    let measure_number: Int?
    let start_time_sec: Double
    let end_time_sec: Double
    let quote: EarTrainingTutorialLocalizedText?
    let input_disabled: Bool?
}

struct EarTrainingTutorialContentPhrasePairAdlibPattern: Decodable, Sendable {
    let group_key: String
    let label: String
    let pcs: [Int]
    let family_id: String
    let carry_tail_length: Int?
    let priority: Int?
    let voicing: [String]?
    let voicing_staves: [Int]?
}

struct EarTrainingTutorialContentPhrasePairAdlib: Decodable, Sendable {
    let bgm_url: String
    let key_fifths: Int?
    let loop_duration_sec: Double
    let steps: [EarTrainingTutorialContentPhrasePairAdlibStep]
    let patterns: [EarTrainingTutorialContentPhrasePairAdlibPattern]?
}

struct EarTrainingTutorialContentCompositeConfig: Decodable, Sendable {
    let bgm_url: String
    let key_fifths: Int?
    let source_phrase_order_indices: [Int]?
}

struct EarTrainingTutorialContentRef: Decodable, Sendable {
    let stage: EarTrainingTutorialContentStage
    let phrases: [EarTrainingTutorialContentPhrase]?
    let chord_quiz_items: [EarTrainingTutorialContentQuizItem]?
    let phrase_pair_adlib: EarTrainingTutorialContentPhrasePairAdlib?
    let composite_config: EarTrainingTutorialContentCompositeConfig?
}

struct EarTrainingTutorialContentStage: Decodable, Sendable {
    let slug: String
    let title: String
    let title_en: String?
    let bpm: Int
    let key_fifths: Int?
    let beats_per_measure: Int
    let beat_type: Int
    let loop_measures: Int
    let max_loops_per_phrase: Int
    let count_in_beats: Int
    let time_limit_sec: Int
    let player_hp: Int
    let enemy_hp: Int
    let per_correct_note_damage: Int?
    let good_completion_damage: Int?
    let great_completion_damage: Int?
    let perfect_completion_damage: Int?
    let miss_damage: Int?
    let fail_damage: Int?
    let perfect_max_misses: Int?
    let great_max_misses: Int?
    let background_theme: String?
    let mode: String
    let chord_voicing_self_paced: Bool?
    let chord_voicing_composite_phrase: Bool?
    let quiz_duration_seconds: Int?
    let quiz_question_order: String?
    let quiz_show_notation_in_battle: Bool?
    let hide_chord_names_in_battle: Bool?
    let quiz_required_correct_count: Int?
    let show_keyboard_hints_in_battle: Bool?
    let osmd_targets_from_score: Bool?
    let is_swing: Bool?
}

struct EarTrainingTutorialContentPhrase: Decodable, Sendable {
    let order_index: Int
    let title: String?
    let title_en: String?
    let music_xml_url: String?
    let audio_url: String?
    let loop_duration_sec: Double?
    let audio_duration_sec: Double?
    let note_count: Int?
    let key_fifths: Int?
    let notes: [EarTrainingTutorialContentPhraseNote]?
    let chords: [EarTrainingTutorialContentChord]?
}

struct EarTrainingTutorialContentPhraseNote: Decodable, Sendable {
    let note_index: Int
    let pitch_midi: Int
    let pitch_class: Int
    let note_name: String
    let octave: Int?
    let measure_number: Int?
    let beat_offset: Double?
    let tied_from_previous: Bool?
}

struct EarTrainingTutorialContentChord: Decodable, Sendable {
    let order_index: Int
    let chord_name: String
    let measure_number: Int?
    let beat_offset: Double?
    let duration_beats: Double?
    let start_time_sec: Double?
    let end_time_sec: Double?
    let voicing: [String]
    let voicing_staves: [Int]?
    /// ヴォイシング（コード）単位のチュートリアルセリフ。
    let quote: EarTrainingTutorialLocalizedText?
    let input_disabled: Bool?
}

struct EarTrainingTutorialContentQuizItem: Decodable, Sendable {
    let order_index: Int
    let chord_name: String
    let measure_number: Int?
    let voicing: [String]
    let voicing_staves: [Int]?
    let key_fifths: Int?
}

enum EarTrainingTutorialScene: Decodable, Sendable {
    case dialogueOnly(EarTrainingTutorialDialogueOnlyScene)
    case chordQuiz(EarTrainingTutorialChordQuizScene)
    case chordVoicingSelfPaced(EarTrainingTutorialSelfPacedScene)
    case chordOsmd(EarTrainingTutorialOsmdScene)
    case adlib(EarTrainingTutorialAdlibScene)
    case phrasePairAdlib(EarTrainingTutorialPhrasePairAdlibScene)
    case composite(EarTrainingTutorialCompositeScene)
    case finish

    private enum CodingKeys: String, CodingKey {
        case type
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "dialogue_only":
            self = .dialogueOnly(try EarTrainingTutorialDialogueOnlyScene(from: decoder))
        case "chord_quiz":
            self = .chordQuiz(try EarTrainingTutorialChordQuizScene(from: decoder))
        case "chord_voicing_self_paced":
            self = .chordVoicingSelfPaced(try EarTrainingTutorialSelfPacedScene(from: decoder))
        case "chord_osmd":
            self = .chordOsmd(try EarTrainingTutorialOsmdScene(from: decoder))
        case "adlib":
            self = .adlib(try EarTrainingTutorialAdlibScene(from: decoder))
        case "phrase_pair_adlib":
            self = .phrasePairAdlib(try EarTrainingTutorialPhrasePairAdlibScene(from: decoder))
        case "composite":
            self = .composite(try EarTrainingTutorialCompositeScene(from: decoder))
        case "finish":
            self = .finish
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown scene type: \(type)")
        }
    }
}

struct EarTrainingTutorialDialogueOnlyScene: Decodable, Sendable {
    let lines: [EarTrainingTutorialDialogueLine]
    let lineIntervalSeconds: Double?
}

struct EarTrainingTutorialChordQuizScene: Decodable, Sendable {
    let contentRef: String
    let order: String
    let questionCount: Int
    let answerTimeoutSeconds: Double
    let dialogue: EarTrainingTutorialQuizDialogue
}

struct EarTrainingTutorialQuizDialogue: Decodable, Sendable {
    let onQuestion: EarTrainingTutorialLocalizedText
    let onCorrect: EarTrainingTutorialLocalizedText
    let onAutoAnswer: EarTrainingTutorialLocalizedText
}

struct EarTrainingTutorialSelfPacedScene: Decodable, Sendable {
    let contentRef: String
    let requiredSuccessfulLoops: Int
    let dialogue: EarTrainingTutorialSelfPacedDialogue
}

struct EarTrainingTutorialSelfPacedDialogue: Decodable, Sendable {
    let onSceneStart: EarTrainingTutorialLocalizedText?
    let onLoopSuccess: EarTrainingTutorialLocalizedText?
    let timedLines: [EarTrainingTutorialSelfPacedTimedLine]?
}

struct EarTrainingTutorialSelfPacedTimedLine: Decodable, Sendable {
    let afterLoopStartSeconds: Double
    let text: EarTrainingTutorialLocalizedText
}

struct EarTrainingTutorialOsmdScene: Decodable, Sendable {
    let contentRef: String
    /// JSON 後方互換用（未使用）。
    let playMode: String?
    let requiredLoops: Int
    let timedLines: [EarTrainingTutorialOsmdTimedLine]?
}

struct EarTrainingTutorialAdlibScene: Decodable, Sendable {
    let contentRef: String
    let requiredMeasures: Int
    let timedLines: [EarTrainingTutorialOsmdTimedLine]?
}

struct EarTrainingTutorialPhrasePairAdlibScene: Decodable, Sendable {
    let contentRef: String
    let requiredLoops: Int
    let timedLines: [EarTrainingTutorialOsmdTimedLine]?
}

struct EarTrainingTutorialCompositeScene: Decodable, Sendable {
    let contentRef: String
    let requiredLoops: Int
    let timedLines: [EarTrainingTutorialOsmdTimedLine]?
}

enum EarTrainingTutorialOsmdTimedLine: Decodable, Sendable {
    case countIn(loop: Int?, beat: Int, text: EarTrainingTutorialLocalizedText)
    case at(loop: Int, measure: Int, beat: Int, text: EarTrainingTutorialLocalizedText)

    private enum CodingKeys: String, CodingKey {
        case phase, loop, beat, at, text
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let phase = try container.decodeIfPresent(String.self, forKey: .phase), phase == "count_in" {
            let loop = try container.decodeIfPresent(Int.self, forKey: .loop)
            let beat = try container.decode(Int.self, forKey: .beat)
            let text = try container.decode(EarTrainingTutorialLocalizedText.self, forKey: .text)
            self = .countIn(loop: loop, beat: beat, text: text)
            return
        }
        if let at = try container.decodeIfPresent(EarTrainingTutorialOsmdAt.self, forKey: .at) {
            let text = try container.decode(EarTrainingTutorialLocalizedText.self, forKey: .text)
            self = .at(loop: at.loop, measure: at.measure, beat: at.beat, text: text)
            return
        }
        throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Invalid OSMD timed line"))
    }
}

struct EarTrainingTutorialOsmdAt: Decodable, Sendable {
    let loop: Int
    let measure: Int
    let beat: Int
}

struct EarTrainingTutorialScriptRow: Decodable, Sendable {
    let id: String
    let title: String
    let title_en: String
    let script: EarTrainingTutorialScriptPayload
}

/// コードクイズチュートリアル用（Web `answerTimeoutSeconds` + 自動回答）。
struct EarTrainingTutorialQuizSceneHooks {
    let useProgressionOrder: Bool
    let onQuestionText: String
    let onCorrectText: String
}

/// チュートリアル各シーンからゲームコントローラへ渡すコールバック。
struct EarTrainingTutorialSceneHooks {
    let ui: EarTrainingTutorialUiOverrides
    let noCombat: Bool
    let onCharacterText: (String) -> Void
    let onSceneComplete: () -> Void
    var requiredSuccessfulLoops: Int = 1
    var onLoopSuccess: (() -> Void)?
    var quiz: EarTrainingTutorialQuizSceneHooks?
    /// OSMD `timedLines`（Web の `scheduleOsmdTimedLinesForLoop` と同用途）。
    var osmdTimedLines: [EarTrainingTutorialOsmdTimedLine]? = nil
    /// チュートリアル共通のドラム BGM URL（フレーズと併用）。
    var tutorialDrumLoopUrl: String? = nil
    /// `chord_voicing_self_paced` の `dialogue.timedLines` をフレーズ再生開始からのオフセットで表示する。
    var selfPacedTimedLines: [EarTrainingTutorialSelfPacedTimedLine]? = nil
    /// `adlib` の小節数クリア条件。
    var requiredMeasures: Int? = nil
    /// `phrase_pair_adlib` / `composite` の BGM ループ回数クリア条件。
    var requiredLoops: Int? = nil
}

/// OSMD チュートリアル: 会話用 `drum_loop` ではなく content のフレーズ MP3（count-in 等）を補助ループ URL に使う。
enum EarTrainingTutorialOsmdDrumLoopResolver {
    static func resolveTutorialOsmdDrumLoopUrl(
        content: [String: EarTrainingTutorialContentRef],
        contentRef: String
    ) -> String? {
        let trimmed = content[contentRef]?.phrases?.first?.audio_url?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }

    /// Web `shouldStartTutorialOsmdDrumLoop` と同じ。フレーズ MP3 があるときは補助ドラムループを開始しない。
    static func shouldStartTutorialOsmdDrumLoop(
        phraseAudioUrl: String?,
        drumLoopUrl: String?
    ) -> Bool {
        let phrase = phraseAudioUrl?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let drum = drumLoopUrl?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if drum.isEmpty { return false }
        if !phrase.isEmpty { return false }
        return phrase != drum
    }
}
