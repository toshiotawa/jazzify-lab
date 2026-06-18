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

enum SurvivalTutorialV3DemoPlayAudioResolver {
    static let defaultVolume: Double = 0.35

    static func resolveUrlString(
        scene: SurvivalTutorialV3DemoPlayScene,
        script: SurvivalTutorialScriptPayloadV3,
        locale: AppLocale
    ) -> String? {
        let audio = scene.audio
        let drumLoop = script.audioTracks?.drum_loop
        let isEnglish = locale == .en

        let localeUrl: String? = {
            if isEnglish {
                return trimUrl(audio?.url_en) ?? trimUrl(audio?.url)
            }
            return trimUrl(audio?.url_ja) ?? trimUrl(audio?.url)
        }()

        return localeUrl ?? trimUrl(drumLoop?.url)
    }

    static func resolveVolume(
        scene: SurvivalTutorialV3DemoPlayScene,
        script: SurvivalTutorialScriptPayloadV3
    ) -> Float {
        let volume = scene.audio?.volume ?? script.audioTracks?.drum_loop?.volume ?? defaultVolume
        return Float(volume)
    }

    private static func trimUrl(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }
}
