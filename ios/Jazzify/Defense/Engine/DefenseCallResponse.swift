import Foundation

struct DefenseCallResponseConfig: Equatable, Sendable {
    let audioLoopBars: Int
    let callResponseBars: Int
}

enum DefenseCallResponsePhase: Equatable, Sendable {
    case call
    case response
    case transitionWait
}

enum DefenseEnemyBehavior: Equatable, Sendable {
    case approach
    case dance
    case pause
}

enum DefenseCallResponseCue: Equatable, Sendable {
    case listen
    case play
}

struct DefenseCallResponseSnapshot: Equatable, Sendable {
    let enabled: Bool
    let phase: DefenseCallResponsePhase
    let judgeActive: Bool
    let enemyBehavior: DefenseEnemyBehavior
    let cue: DefenseCallResponseCue?
    let barIndexInLoop: Int
    let danceBeatPhase: Double
}

enum DefenseCallResponse {
    static let leadSec = 0.03

    private static let disabledSnapshot = DefenseCallResponseSnapshot(
        enabled: false,
        phase: .response,
        judgeActive: true,
        enemyBehavior: .approach,
        cue: nil,
        barIndexInLoop: 0,
        danceBeatPhase: 0
    )

    static func config(for stage: DefenseStageDefinition) -> DefenseCallResponseConfig? {
        guard let callResponseBars = stage.callResponseBars,
              let audioLoopBars = stage.audioLoopBars,
              callResponseBars >= 1,
              audioLoopBars >= callResponseBars * 2,
              audioLoopBars % (callResponseBars * 2) == 0
        else { return nil }
        return DefenseCallResponseConfig(audioLoopBars: audioLoopBars, callResponseBars: callResponseBars)
    }

    static func resolve(
        config: DefenseCallResponseConfig?,
        elapsedFromPhraseStartSec: Double,
        barSec: Double,
        beatsPerBar: Int,
        transitionWaitUntilElapsedSec: Double?
    ) -> DefenseCallResponseSnapshot {
        guard let config else { return disabledSnapshot }

        let safeBarSec = max(1e-6, barSec)

        if let waitUntil = transitionWaitUntilElapsedSec,
           elapsedFromPhraseStartSec < waitUntil {
            let tWait = max(0, elapsedFromPhraseStartSec)
            let barIndex = Int(floor(tWait / safeBarSec))
            return DefenseCallResponseSnapshot(
                enabled: true,
                phase: .transitionWait,
                judgeActive: false,
                enemyBehavior: .pause,
                cue: nil,
                barIndexInLoop: barIndex % config.audioLoopBars,
                danceBeatPhase: 0
            )
        }

        if elapsedFromPhraseStartSec < 0 {
            return DefenseCallResponseSnapshot(
                enabled: true,
                phase: .call,
                judgeActive: false,
                enemyBehavior: .dance,
                cue: .listen,
                barIndexInLoop: 0,
                danceBeatPhase: 0
            )
        }

        let t = max(0, elapsedFromPhraseStartSec)
        let barIndex = Int(floor(t / safeBarSec))
        let barIndexInLoop = barIndex % config.audioLoopBars
        let cycleBars = config.callResponseBars * 2
        let posInCycle = barIndex % cycleBars
        let isCall = posInCycle < config.callResponseBars
        let phase: DefenseCallResponsePhase = isCall ? .call : .response
        let enemyBehavior: DefenseEnemyBehavior = isCall ? .dance : .approach
        let cue: DefenseCallResponseCue? = isCall ? .listen : .play

        var judgeActive = false
        if !isCall {
            judgeActive = true
        } else if posInCycle == config.callResponseBars - 1,
                  Double(barIndex + 1) * safeBarSec - t <= leadSec + 1e-9 {
            judgeActive = true
        }

        let danceBeatPhase = (t / safeBarSec) * Double(max(1, beatsPerBar))

        return DefenseCallResponseSnapshot(
            enabled: true,
            phase: phase,
            judgeActive: judgeActive,
            enemyBehavior: enemyBehavior,
            cue: cue,
            barIndexInLoop: barIndexInLoop,
            danceBeatPhase: danceBeatPhase
        )
    }

    static func transitionEndBarIndex(elapsedFromPhraseStartSec: Double, barSec: Double) -> Int {
        let safeBarSec = max(1e-6, barSec)
        return Int(floor(max(0, elapsedFromPhraseStartSec) / safeBarSec)) + 1
    }
}