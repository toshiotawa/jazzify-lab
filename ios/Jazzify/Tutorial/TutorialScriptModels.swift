import Foundation

struct TutorialLocalizedText: Decodable, Sendable {
    let ja: String
    let en: String

    func localized(_ locale: AppLocale) -> String {
        locale == .ja ? ja : en
    }
}

struct TutorialChordDef: Decodable, Sendable {
    let name: String
    let voicing: [Int]
    let voicingNames: [String]?
    let keyFifths: Int?
}

struct TutorialStageDef: Decodable, Sendable {
    let name: String
    let nameEn: String
    let stageType: String
    let chordDisplayName: String
    let chordDisplayNameEn: String
    let chordProgression: [TutorialChordDef]
    let mapCategory: String?
    let lessonOnly: Bool?
}

struct TutorialSpawnStep: Decodable, Sendable {
    let kind: String
    let distance: CGFloat?
    let count: Int?
    let radius: CGFloat?
    let distanceForward: CGFloat?
    let offsets: [CGFloat]?
    let x: CGFloat?
    let y: CGFloat?
}

struct TutorialAttackStep: Decodable, Sendable {
    let slot: String?
    let special: Bool?
}

struct TutorialScriptStep: Decodable, Sendable {
    let type: String
    let seconds: Double?
    let text: TutorialLocalizedText?
    let clear: Bool?
    let preset: String?
    let aEnabled: Bool?
    let bEnabled: Bool?
    let bChord: String?
    let clearBChord: Bool?
    let resetBCompletion: Bool?
    let spawn: TutorialSpawnStep?
    let chord: String?
    let attack: TutorialAttackStep?
    let assistAttack: TutorialAttackStep?
    let completionAttack: TutorialAttackStep?
    let useSpecial: Bool?
    let timeoutSeconds: Double?
    let introCharacter: TutorialLocalizedText?
    let introDelaySeconds: Double?
    let successCharacter: TutorialLocalizedText?
    let successDelaySeconds: Double?
    let failCharacter: TutorialLocalizedText?
    let failDelaySeconds: Double?
    let midiWaitSeconds: Double?
    let systemImage: String?
    let imageAsset: String?
    let durationSeconds: Double?
    let show: Bool?
    let trackId: String?
    let action: String?
    let loop: Bool?
    let volume: Double?
}

struct TutorialScriptPayload: Decodable, Sendable {
    let version: Int
    let stage: TutorialStageDef?
    let chords: [String: TutorialChordDef]?
    let steps: [TutorialScriptStep]

    var isInterpretedV2: Bool {
        version == 2 && !steps.isEmpty
    }
}

enum SurvivalTutorialScriptPayload: Sendable {
    case v2(TutorialScriptPayload)
    case v3(SurvivalTutorialScriptPayloadV3)
}

extension SurvivalTutorialScriptPayload: Decodable {
    private enum CodingKeys: String, CodingKey { case version }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let version = try container.decode(Int.self, forKey: .version)
        switch version {
        case 3:
            self = .v3(try SurvivalTutorialScriptPayloadV3(from: decoder))
        default:
            self = .v2(try TutorialScriptPayload(from: decoder))
        }
    }
}

extension SurvivalTutorialScriptPayload {
    var interpretedV2: TutorialScriptPayload? {
        if case let .v2(p) = self { return p }
        return nil
    }

    var interpretedV3: SurvivalTutorialScriptPayloadV3? {
        if case let .v3(p) = self { return p }
        return nil
    }
}

struct SurvivalTutorialScriptRow: Decodable, Sendable {
    let id: String
    let title: String
    let title_en: String
    let script: SurvivalTutorialScriptPayload
}

enum TutorialScriptBundled {
    static func load(scriptId: String) -> TutorialScriptPayload? {
        guard scriptId == "onboarding-v1",
              let url = Bundle.main.url(forResource: "onboarding-v1.script", withExtension: "json"),
              let data = try? Data(contentsOf: url)
        else { return nil }
        return try? JSONDecoder().decode(TutorialScriptPayload.self, from: data)
    }
}

enum TutorialStageBuilder {
    static func buildStageDefinition(from script: TutorialScriptPayload) -> SurvivalStageDefinition {
        guard let stage = script.stage else {
            return OnboardingChords.stageDefinition
        }

        let base = SurvivalStageCatalog.stage(byNumber: 1) ?? OnboardingChords.stageDefinition
        let entries = stage.chordProgression.map {
            SurvivalChordProgressionEntry(
                name: $0.name,
                voicing: $0.voicing,
                voicingNames: $0.voicingNames,
                keyFifths: $0.keyFifths ?? 0,
                voicingStaves: nil
            )
        }
        let mapCategory = SurvivalMapCategory(rawValue: stage.mapCategory ?? "lesson") ?? .basic

        return SurvivalStageDefinition(
            mapCategory: mapCategory,
            stageNumber: 0,
            stageType: stage.stageType == "progression" ? .progression : .random,
            nameJa: stage.name,
            nameEn: stage.nameEn,
            difficulty: base.difficulty,
            chordSuffix: "",
            chordDisplayJa: stage.chordDisplayName,
            chordDisplayEn: stage.chordDisplayNameEn,
            rootPattern: nil,
            rootPatternJa: "",
            rootPatternEn: "",
            allowedChords: [],
            blockKey: base.blockKey,
            isMixedStage: false,
            chordProgression: entries,
            lessonOnly: stage.lessonOnly ?? true
        )
    }

    static func resolveChord(_ script: TutorialScriptPayload, ref: String) -> SurvivalResolvedChord? {
        guard let def = script.chords?[ref] else {
            return nil
        }
        guard let names = def.voicingNames, names.count == def.voicing.count else {
            let entry = SurvivalChordProgressionEntry(
                name: def.name,
                voicing: def.voicing,
                voicingNames: def.voicingNames,
                keyFifths: def.keyFifths ?? 0,
                voicingStaves: nil
            )
            return SurvivalResolvedChord.fromProgressionEntry(entry, index: 0)
        }
        return SurvivalResolvedChord.fromExplicitTutorialVoicing(
            id: "tutorial:\(ref):0:\(def.name)",
            name: def.name,
            voicing: def.voicing,
            voicingNames: names,
            keyFifths: def.keyFifths ?? 0
        )
    }
}
