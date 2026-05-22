import Foundation

/// Web `scheduleSurvivalStageIntroLines` 相当。
@MainActor
final class SurvivalStageIntroPlayer {
    private var workItems: [DispatchWorkItem] = []
    private var displayGeneration = 0

    func cancel(setLineEmpty: (@MainActor () -> Void)?) {
        workItems.forEach { $0.cancel() }
        workItems.removeAll()
        displayGeneration = 0
        setLineEmpty?()
    }

    func schedule(
        script: SurvivalStageIntroScriptPayload,
        usesEnglishCopy: Bool,
        onFaiLine: @escaping @MainActor (String) -> Void,
        onJajiiLine: @escaping @MainActor (String) -> Void
    ) {
        let clearAll = {
            onFaiLine("")
            onJajiiLine("")
        }
        cancel(setLineEmpty: clearAll)

        let durationSec = max(0.1, script.lineDurationSeconds)

        for line in script.lines {
            let showSec = max(0, line.atSeconds)
            let text = usesEnglishCopy ? line.text.en : line.text.ja

            let showWork = DispatchWorkItem { [weak self] in
                guard let self else { return }
                self.displayGeneration += 1
                let genSnap = self.displayGeneration
                switch line.resolvedSpeaker {
                case .fai:
                    onJajiiLine("")
                    onFaiLine(text)
                case .jajii:
                    onFaiLine("")
                    onJajiiLine(text)
                }

                let hideWork = DispatchWorkItem { [weak self] in
                    guard let self else { return }
                    if self.displayGeneration == genSnap {
                        clearAll()
                    }
                }
                self.workItems.append(hideWork)
                DispatchQueue.main.asyncAfter(deadline: .now() + durationSec, execute: hideWork)
            }

            workItems.append(showWork)
            DispatchQueue.main.asyncAfter(deadline: .now() + showSec, execute: showWork)
        }
    }
}
