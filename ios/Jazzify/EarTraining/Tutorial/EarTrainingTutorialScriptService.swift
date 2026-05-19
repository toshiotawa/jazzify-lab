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
        guard scriptId == "developer-full-v1",
              let url = Bundle.main.url(forResource: "ear-training-developer-full-v1.script", withExtension: "json"),
              let data = try? Data(contentsOf: url)
        else {
            return nil
        }
        let decoder = JSONDecoder()
        return try? decoder.decode(EarTrainingTutorialScriptPayload.self, from: data)
    }
}
