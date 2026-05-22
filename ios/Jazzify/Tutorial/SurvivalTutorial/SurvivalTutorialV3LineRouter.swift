import Foundation

/// v3 台詞の話者。`dialogue_only` 省略時 fai、バトル dialogue 省略時 jajii。
enum SurvivalTutorialV3DialogueSpeaker: String, Sendable {
    case fai
    case jajii
    case narration

    static func resolve(raw: String?, context: SurvivalTutorialV3LineContext) -> SurvivalTutorialV3DialogueSpeaker {
        guard let raw, let speaker = SurvivalTutorialV3DialogueSpeaker(rawValue: raw) else {
            return context.defaultSpeaker
        }
        return speaker
    }
}

enum SurvivalTutorialV3LineContext: Sendable {
    case dialogueOnly
    case battle

    var defaultSpeaker: SurvivalTutorialV3DialogueSpeaker {
        switch self {
        case .dialogueOnly: return .fai
        case .battle: return .jajii
        }
    }
}

enum SurvivalTutorialV3LineRouter {
    static func localized(_ text: SurvivalTutorialV3LocalizedText, locale: AppLocale) -> String {
        locale == .ja ? text.ja : text.en
    }

    static func resolvedSpeaker(_ text: SurvivalTutorialV3LocalizedText, context: SurvivalTutorialV3LineContext) -> SurvivalTutorialV3DialogueSpeaker {
        SurvivalTutorialV3DialogueSpeaker.resolve(raw: text.speaker, context: context)
    }

    static func present(
        text: SurvivalTutorialV3LocalizedText,
        locale: AppLocale,
        context: SurvivalTutorialV3LineContext,
        onFai: (String) -> Void,
        onJajii: (String) -> Void,
        onNarration: (String) -> Void
    ) {
        clear(onFai: onFai, onJajii: onJajii, onNarration: onNarration)
        let line = localized(text, locale: locale)
        switch resolvedSpeaker(text, context: context) {
        case .fai:
            onFai(line)
        case .jajii:
            onJajii(line)
        case .narration:
            onNarration(line)
        }
    }

    static func clear(
        onFai: (String) -> Void,
        onJajii: (String) -> Void,
        onNarration: (String) -> Void
    ) {
        onFai("")
        onJajii("")
        onNarration("")
    }

    static func presentResolvedLine(
        text: SurvivalTutorialV3LocalizedText,
        line: String,
        context: SurvivalTutorialV3LineContext,
        onFai: (String) -> Void,
        onJajii: (String) -> Void,
        onNarration: (String) -> Void
    ) {
        clear(onFai: onFai, onJajii: onJajii, onNarration: onNarration)
        switch resolvedSpeaker(text, context: context) {
        case .fai:
            onFai(line)
        case .jajii:
            onJajii(line)
        case .narration:
            onNarration(line)
        }
    }
}
