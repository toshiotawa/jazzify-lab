import Foundation

enum TutorialScriptService {
    static func fetchScript(scriptId: String) async -> TutorialScriptPayload? {
        if let remote = try? await SupabaseService.shared.fetchSurvivalTutorialScript(id: scriptId),
           remote.script.isInterpretedV2 {
            return remote.script
        }
        return TutorialScriptBundled.load(scriptId: scriptId)
    }
}
