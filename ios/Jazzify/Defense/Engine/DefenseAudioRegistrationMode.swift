import Foundation

enum DefenseAudioRegistrationModeParser {
    static func parse(_ value: String) -> DefenseAudioRegistrationMode? {
        DefenseAudioRegistrationMode(rawValue: value)
    }
}

enum DefenseSharedProgressionValidation {
    static func validate(stage: DefenseStageDefinition) -> String? {
        guard stage.audioRegistrationMode == .sharedProgression else { return nil }
        guard let progressionBars = stage.progressionBars, progressionBars > 0 else {
            return "shared_progression requires progressionBars"
        }
        guard [1, 2, 4].contains(stage.phraseBars) else {
            return "shared_progression requires phraseBars in (1, 2, 4)"
        }
        guard progressionBars % stage.phraseBars == 0 else {
            return "progressionBars must be divisible by phraseBars"
        }
        return nil
    }
}
