import Foundation

/// `EarTrainingChordQuizGameView` のウォーム用（MIDI は View 側で付与）。
struct EarTrainingTutorialPrewarmedQuizPack {
    let audio: EarTrainingAudio
    let controller: EarTrainingChordQuizBattleController
}

struct EarTrainingTutorialPrewarmedVoicingPack {
    let audio: EarTrainingAudio
    let controller: EarTrainingChordVoicingBattleController
}

struct EarTrainingTutorialPrewarmedOsmdPack {
    let audio: EarTrainingAudio
    let controller: EarTrainingChordOSMDBattleController
}

@MainActor
enum EarTrainingTutorialBattleWarmup {
    static func nextRunnableSceneIndex(scenes: [EarTrainingTutorialScene], fromIndex: Int) -> Int? {
        var i = fromIndex + 1
        while i < scenes.count {
            switch scenes[i] {
            case .dialogueOnly, .finish:
                i += 1
            case .chordQuiz, .chordVoicingSelfPaced, .chordOsmd:
                return i
            }
        }
        return nil
    }

    static func buildChordQuizPack(
        stage: EarTrainingStageDetail,
        locale: AppLocale,
        lessonContext: EarTrainingLessonContext?,
        tutorialHooks: EarTrainingTutorialSceneHooks?,
        tutorialQuestionTarget: Int,
        onClose: @escaping () -> Void
    ) throws -> EarTrainingTutorialPrewarmedQuizPack {
        let items = stage.sortedChordQuizItems()
        guard !items.isEmpty else {
            throw NSError(
                domain: "EarTrainingTutorialWarmup",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "No quiz items"]
            )
        }
        let audioInstance = EarTrainingAudio()
        audioInstance.prefetchPhraseItem(url: EarTrainingChordQuizBattleController.drumLoopURLForTutorial)

        let createdController = EarTrainingChordQuizBattleController(
            stage: stage,
            lessonContext: lessonContext,
            isEnglishCopy: locale == .en,
            enemyId: stage.id.uuidString,
            audio: audioInstance,
            initialPracticeMode: false,
            onExit: onClose
        )
        if let tutorialHooks {
            createdController.tutorialNoCombat = tutorialHooks.noCombat
            createdController.tutorialHooks = tutorialHooks
            createdController.tutorialQuestionTarget = tutorialQuestionTarget
        }
        return EarTrainingTutorialPrewarmedQuizPack(audio: audioInstance, controller: createdController)
    }

    static func buildChordVoicingPack(
        stage: EarTrainingStageDetail,
        locale: AppLocale,
        lessonContext: EarTrainingLessonContext?,
        tutorialHooks: EarTrainingTutorialSceneHooks?,
        onClose: @escaping () -> Void
    ) throws -> EarTrainingTutorialPrewarmedVoicingPack {
        let phrases = stage.sortedPhrases()
        guard !phrases.isEmpty else {
            throw NSError(
                domain: "EarTrainingTutorialWarmup",
                code: 2,
                userInfo: [NSLocalizedDescriptionKey: "No phrases"]
            )
        }
        let audioInstance = EarTrainingAudio()
        if let first = phrases.first, let url = URL(string: first.audioUrl), !first.audioUrl.isEmpty {
            audioInstance.preloadPhrase(url: url)
        }

        let createdController = EarTrainingChordVoicingBattleController(
            stage: stage,
            phrases: phrases,
            lessonContext: lessonContext,
            isEnglishCopy: locale == .en,
            enemyId: stage.id.uuidString,
            enemyName: stage.localizedTitle(locale),
            audio: audioInstance,
            initialPracticeMode: false,
            onExit: onClose
        )
        if let tutorialHooks {
            createdController.tutorialNoCombat = tutorialHooks.noCombat
            createdController.tutorialHooks = tutorialHooks
        }
        return EarTrainingTutorialPrewarmedVoicingPack(audio: audioInstance, controller: createdController)
    }

    static func buildOsmdPack(
        stage: EarTrainingStageDetail,
        locale: AppLocale,
        lessonContext: EarTrainingLessonContext?,
        tutorialHooks: EarTrainingTutorialSceneHooks?,
        initialPracticeMode: Bool,
        onClose: @escaping () -> Void
    ) throws -> EarTrainingTutorialPrewarmedOsmdPack {
        let phrases = stage.sortedPhrases()
        guard !phrases.isEmpty else {
            throw NSError(
                domain: "EarTrainingTutorialWarmup",
                code: 3,
                userInfo: [NSLocalizedDescriptionKey: "No phrases"]
            )
        }
        guard phrases.contains(where: { $0.musicXmlUrl != nil }) else {
            throw NSError(
                domain: "EarTrainingTutorialWarmup",
                code: 4,
                userInfo: [NSLocalizedDescriptionKey: "No MusicXML"]
            )
        }
        let audioInstance = EarTrainingAudio()
        if let first = phrases.first, let url = URL(string: first.audioUrl), !first.audioUrl.isEmpty {
            audioInstance.preloadPhrase(url: url)
        }

        let createdController = EarTrainingChordOSMDBattleController(
            stage: stage,
            phrases: phrases,
            lessonContext: lessonContext,
            isEnglishCopy: locale == .en,
            enemyId: stage.id.uuidString,
            enemyName: stage.localizedTitle(locale),
            audio: audioInstance,
            initialPracticeMode: initialPracticeMode,
            onExit: onClose
        )
        if let tutorialHooks {
            createdController.tutorialNoCombat = tutorialHooks.noCombat
            createdController.tutorialHooks = tutorialHooks
        }
        return EarTrainingTutorialPrewarmedOsmdPack(audio: audioInstance, controller: createdController)
    }
}
