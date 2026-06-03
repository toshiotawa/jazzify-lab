import Foundation

enum SurvivalTutorialV3DrumLoopSource: Equatable {
    case remote(URL)
    case bundled
    case none
}

/// DB `audioTracks.drum_loop.url` とバンドル `DrumLoop.mp3` の優先順位を決める。
enum SurvivalTutorialV3DrumLoopSourceResolver {
    static func resolve(urlString: String?, hasBundledDrumLoop: Bool) -> SurvivalTutorialV3DrumLoopSource {
        let trimmed = urlString?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmed.isEmpty, let remote = URL(string: trimmed) {
            return .remote(remote)
        }
        if hasBundledDrumLoop {
            return .bundled
        }
        return .none
    }

    static func resolve(urlString: String?) -> SurvivalTutorialV3DrumLoopSource {
        resolve(urlString: urlString, hasBundledDrumLoop: bundledDrumLoopURL() != nil)
    }

    static func bundledDrumLoopURL() -> URL? {
        Bundle.main.url(forResource: "DrumLoop", withExtension: "mp3")
    }
}
