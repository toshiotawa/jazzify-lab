import Foundation

// MARK: - Survival Tutorial V4 (manifest)
//
// Web の `src/components/survival/tutorial/v4/survivalTutorialV4Types.ts` に対応する Decodable 型。
// MusicXML+MIDI から生成された中間 JSON(manifest) をデコードする。
// - staff 3 は再生専用(bass)。描画・判定対象外。
// - sceneType: dialogue / demo / play。
// - UI overrides は V3 と同形のため `SurvivalTutorialV3UiOverrides` を再利用する。

struct SurvivalTutorialV4Position: Decodable, Sendable {
    let measure: Int
    let beat: Double
}

struct SurvivalTutorialV4MidiRange: Decodable, Sendable {
    let startTick: Int
    let endTick: Int
    let startSec: Double
    let endSec: Double
}

struct SurvivalTutorialV4SceneBgm: Decodable, Sendable {
    let url: String?
    let resetOnEnter: Bool
}

struct SurvivalTutorialV4Line: Decodable, Sendable {
    let ja: String
    let en: String
    let speaker: String?
    let startBeat: Double
    let durationBeats: Double?

    func text(_ locale: AppLocale) -> String {
        locale == .ja ? ja : en
    }
}

/// demo ロール和音: タイで段階的に増える 1 step。
struct SurvivalTutorialRollStep: Decodable, Sendable, Equatable {
    let startBeat: Double
    let newVoicing: [Int]
    let voicing: [Int]
    let voicingNames: [String]?
    let voicing_staves: [Int]?
    let newBass: [Int]?
    let bass: [Int]?
}

/// 音符 onset 単位の「塊」。notes=staff1/2(描画+判定+再生)、bass=staff3(再生のみ)。
struct SurvivalTutorialV4Chunk: Decodable, Sendable {
    let startBeat: Double
    let durationBeats: Double
    let measureNumber: Int
    let chordName: String
    let notes: [Int]
    let noteNames: [String]?
    let noteStaves: [Int]?
    let bass: [Int]
    let bassNames: [String]?
    let keyFifths: Int?
    let rollSteps: [SurvivalTutorialRollStep]?
}

struct SurvivalTutorialV4Assets: Decodable, Sendable {
    struct BgmRef: Decodable, Sendable {
        let url: String?
    }
    let midi: String?
    let bgm: BgmRef?
}

// MARK: - Scenes

struct SurvivalTutorialV4DialogueScene: Decodable, Sendable {
    let sceneType: String
    let id: String
    let start: SurvivalTutorialV4Position
    let end: SurvivalTutorialV4Position
    let bgm: SurvivalTutorialV4SceneBgm
    let keyFifths: Int
    let beatsPerMeasure: Int
    let bpm: Double
    let midi: SurvivalTutorialV4MidiRange
    let lines: [SurvivalTutorialV4Line]
}

struct SurvivalTutorialV4DemoScene: Decodable, Sendable {
    let sceneType: String
    let id: String
    let start: SurvivalTutorialV4Position
    let end: SurvivalTutorialV4Position
    let bgm: SurvivalTutorialV4SceneBgm
    let keyFifths: Int
    let beatsPerMeasure: Int
    let bpm: Double
    let midi: SurvivalTutorialV4MidiRange
    let chords: [SurvivalTutorialV4Chunk]
    let lines: [SurvivalTutorialV4Line]
}

struct SurvivalTutorialV4PlayScene: Decodable, Sendable {
    let sceneType: String
    let id: String
    let start: SurvivalTutorialV4Position
    let end: SurvivalTutorialV4Position
    let bgm: SurvivalTutorialV4SceneBgm
    let keyFifths: Int
    let beatsPerMeasure: Int
    let bpm: Double
    let midi: SurvivalTutorialV4MidiRange
    let questions: [SurvivalTutorialV4Chunk]
    let lines: [SurvivalTutorialV4Line]
}

enum SurvivalTutorialV4Scene: Decodable, Sendable {
    case dialogue(SurvivalTutorialV4DialogueScene)
    case demo(SurvivalTutorialV4DemoScene)
    case play(SurvivalTutorialV4PlayScene)

    private enum CodingKeys: String, CodingKey { case sceneType }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let type = try c.decode(String.self, forKey: .sceneType)
        switch type {
        case "dialogue":
            self = .dialogue(try SurvivalTutorialV4DialogueScene(from: decoder))
        case "demo":
            self = .demo(try SurvivalTutorialV4DemoScene(from: decoder))
        case "play":
            self = .play(try SurvivalTutorialV4PlayScene(from: decoder))
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .sceneType,
                in: c,
                debugDescription: "Unknown survival tutorial v4 scene type: \(type)"
            )
        }
    }

    var id: String {
        switch self {
        case let .dialogue(scene): return scene.id
        case let .demo(scene): return scene.id
        case let .play(scene): return scene.id
        }
    }
}

// MARK: - Manifest

struct SurvivalTutorialV4Manifest: Decodable, Sendable {
    let version: Int
    let id: String
    let assets: SurvivalTutorialV4Assets
    let bpm: Double
    let beatsPerMeasure: Int
    let keyFifths: Int
    let ui: SurvivalTutorialV3UiOverrides?
    let scenes: [SurvivalTutorialV4Scene]
}

extension SurvivalTutorialV4Manifest {
    var isInterpretedV4: Bool { version == 4 && !scenes.isEmpty }
}
