import Foundation

enum TutorialScriptService {
    enum LoadedSurvivalTutorial: Sendable {
        case interpretedV2(TutorialScriptPayload)
        case interpretedV3(SurvivalTutorialScriptPayloadV3)
    }

    /// リモート（なければバンドル v2 のみ）。
    static func fetchTutorialPayload(scriptId: String) async -> LoadedSurvivalTutorial? {
        if let remote = try? await SupabaseService.shared.fetchSurvivalTutorialScript(id: scriptId) {
            if let v3 = remote.script.interpretedV3, v3.isInterpretedV3 {
                return .interpretedV3(v3)
            }
            if let v2 = remote.script.interpretedV2, v2.isInterpretedV2 {
                return .interpretedV2(v2)
            }
        }
        if let bundled = TutorialScriptBundled.load(scriptId: scriptId) {
            return .interpretedV2(bundled)
        }
        return nil
    }

    static func fetchScript(scriptId: String) async -> TutorialScriptPayload? {
        switch await fetchTutorialPayload(scriptId: scriptId) {
        case let .interpretedV2(p)?:
            return p
        default:
            return TutorialScriptBundled.load(scriptId: scriptId)
        }
    }
}
