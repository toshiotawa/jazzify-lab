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

enum DefenseSeparateTracksValidation {
    static func validate(stage: DefenseStageDefinition) -> String? {
        guard stage.audioRegistrationMode == .sharedProgressionSeparateTracks else { return nil }
        guard let progressionBars = stage.progressionBars, progressionBars > 0 else {
            return "shared_progression_separate_tracks requires progressionBars"
        }
        guard [1, 2, 4].contains(stage.phraseBars) else {
            return "shared_progression_separate_tracks requires phraseBars in (1, 2, 4)"
        }
        guard progressionBars % stage.phraseBars == 0 else {
            return "progressionBars must be divisible by phraseBars"
        }
        guard let audioUrl = stage.audioUrl, !audioUrl.isEmpty else {
            return "shared_progression_separate_tracks requires audioUrl"
        }
        guard let melodyAudioUrl = stage.melodyAudioUrl, !melodyAudioUrl.isEmpty else {
            return "shared_progression_separate_tracks requires melodyAudioUrl"
        }
        let sorted = stage.phrases.sorted { $0.orderIndex < $1.orderIndex }
        for (rank, phrase) in sorted.enumerated() {
            let expectedStart = rank * stage.phraseBars + 1
            let expectedEnd = (rank + 1) * stage.phraseBars
            if phrase.loopStartMeasure != expectedStart || phrase.loopEndMeasure != expectedEnd {
                return "phrase rank \(rank) loop measures must be \(expectedStart)-\(expectedEnd)"
            }
            if !phrase.audioUrl.isEmpty {
                return "shared_progression_separate_tracks requires empty per-phrase audioUrl"
            }
        }
        return nil
    }
}
