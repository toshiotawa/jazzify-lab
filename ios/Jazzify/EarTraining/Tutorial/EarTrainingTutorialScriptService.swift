import Foundation

enum EarTrainingTutorialScriptService {
    static func fetchScript(scriptId: String) async -> EarTrainingTutorialScriptPayload? {
        if let remote = try? await SupabaseService.shared.fetchEarTrainingTutorialScript(id: scriptId),
           remote.script.isValid {
            return remote.script
        }
        return EarTrainingTutorialScriptBundled.load(scriptId: scriptId)
    }
}

enum EarTrainingTutorialScriptBundled {
    static func load(scriptId: String) -> EarTrainingTutorialScriptPayload? {
        let resourceName: String?
        switch scriptId {
        case "developer-full-v1":
            resourceName = "ear-training-developer-full-v1.script"
        case "osmd-timing-adjustment-v1":
            resourceName = "ear-training-osmd-timing-adjustment-v1.script"
        default:
            resourceName = nil
        }
        guard let resourceName,
              let url = Bundle.main.url(forResource: resourceName, withExtension: "json"),
              let data = try? Data(contentsOf: url)
        else {
            return nil
        }
        let decoder = JSONDecoder()
        return try? decoder.decode(EarTrainingTutorialScriptPayload.self, from: data)
    }
}
