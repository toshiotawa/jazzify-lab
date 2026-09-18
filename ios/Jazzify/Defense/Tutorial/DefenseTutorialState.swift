import Foundation

enum DefenseTutorialScreen: Equatable, Sendable {
    case notation
    case notationConfirm
    case inputChoice
    case inputSetup
    case play
}

struct DefenseTutorialSessionState: Equatable, Sendable {
    var screen: DefenseTutorialScreen
    var notation: DefenseTutorialNotationSettings
    var inputMethod: NoteInputMethod?
    var phraseSucceeded: Bool
    var completionSaved: Bool
}

enum DefenseTutorialResetReason: Equatable, Sendable {
    case notation
    case inputMethod
    case micSensitivity
    case voiceFastResponse
}

enum DefenseTutorialState {
    static func createSession(
        notation: DefenseTutorialNotationSettings
    ) -> DefenseTutorialSessionState {
        DefenseTutorialSessionState(
            screen: .notation,
            notation: notation,
            inputMethod: nil,
            phraseSucceeded: false,
            completionSaved: false
        )
    }

    static func advanceScreen(
        _ state: DefenseTutorialSessionState,
        to next: DefenseTutorialScreen
    ) -> DefenseTutorialSessionState {
        var copy = state
        copy.screen = next
        return copy
    }

    static func retreatScreen(
        _ state: DefenseTutorialSessionState
    ) -> DefenseTutorialSessionState? {
        switch state.screen {
        case .notationConfirm:
            var copy = state
            copy.screen = .notation
            return copy
        case .inputChoice:
            var copy = state
            copy.screen = .notationConfirm
            return copy
        case .inputSetup:
            var copy = state
            copy.screen = .inputChoice
            copy.inputMethod = nil
            return copy
        case .play:
            var copy = state
            copy.screen = .inputSetup
            copy.phraseSucceeded = false
            return copy
        case .notation:
            return nil
        }
    }

    static func updateNotation(
        _ state: DefenseTutorialSessionState,
        notation: DefenseTutorialNotationSettings
    ) -> DefenseTutorialSessionState {
        var copy = state
        copy.notation = notation
        copy.phraseSucceeded = false
        return copy
    }

    static func selectInputMethod(
        _ state: DefenseTutorialSessionState,
        inputMethod: NoteInputMethod
    ) -> DefenseTutorialSessionState {
        var copy = state
        copy.inputMethod = inputMethod
        copy.phraseSucceeded = false
        return copy
    }

    static func markPhraseSucceeded(_ state: DefenseTutorialSessionState) -> DefenseTutorialSessionState {
        var copy = state
        copy.phraseSucceeded = true
        return copy
    }

    static func markCompletionSaved(_ state: DefenseTutorialSessionState) -> DefenseTutorialSessionState {
        var copy = state
        copy.completionSaved = true
        return copy
    }

    static func shouldResetPhraseProgress(reason: DefenseTutorialResetReason) -> Bool {
        switch reason {
        case .notation, .inputMethod, .micSensitivity, .voiceFastResponse:
            return true
        }
    }

    static func shouldSaveCompletionOnExit(_ state: DefenseTutorialSessionState) -> Bool {
        !state.completionSaved
    }
}
