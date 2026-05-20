import Foundation

/// Web 版 `resolveSurvivalPhrasePreviewUrl` と同一の URL 解決。
enum SurvivalPhrasePreviewURL {
    static func resolve(phraseBgmUrl: String?, phrasesStageBgmFromSettings: String) -> URL {
        let trimmedPhrase = phraseBgmUrl?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmedPhrase.isEmpty, let u = URL(string: trimmedPhrase) {
            return u
        }
        let trimmedDefault = phrasesStageBgmFromSettings.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedDefault.isEmpty, let u = URL(string: trimmedDefault) {
            return u
        }
        return SurvivalBgmDefaults.phrasesURL
    }
}
