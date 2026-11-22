import Foundation

enum DefenseCallResponseClearGuard {
    private static let dryRunDtSec = 0.05
    private static let maxBinarySearchSteps = 8
    private static let guardSpeedFactor = 0.9
    private static let maxResponseSimSec = 600.0
    private static let minGuardedSpeedPx = 2.0

    private enum TimingMode {
        case frontDelayed
        case back
    }

    private struct AttackEvent {
        let timeSec: Double
        let isMeasureEnd: Bool
    }

    struct DryRunResult: Equatable {
        let cleared: Bool
        let playerHp: Int
    }

    private static func buildPhraseOffsets(
        attacks: Int,
        phraseSec: Double,
        eighthSec: Double,
        mode: TimingMode
    ) -> [Double] {
        let count = max(1, attacks)
        let step = min(eighthSec, phraseSec / Double(count))
        let span = Double(max(0, count - 1)) * step
        var offsets: [Double] = []
        offsets.reserveCapacity(count)
        switch mode {
        case .frontDelayed:
            let leadDelay = min(0.25, max(0, (phraseSec - span) * 0.2))
            for i in 0..<count {
                offsets.append(leadDelay + Double(i) * step)
            }
        case .back:
            let start = max(0, phraseSec - span - min(0.1, phraseSec * 0.05))
            for i in 0..<count {
                offsets.append(start + Double(i) * step)
            }
        }
        return offsets
    }

    private static func buildMeasureEndIndices(attackCount: Int, measureCount: Int) -> Set<Int> {
        var indices = Set<Int>()
        let mCount = max(1, measureCount)
        for m in 0..<mCount {
            let idx = min(attackCount - 1, Int(floor(Double((m + 1) * attackCount) / Double(mCount))) - 1)
            if idx >= 0 {
                indices.insert(idx)
            }
        }
        return indices
    }

    private static func runDryRun(
        stage: DefenseStageDefinition,
        phrases: [DefensePhraseDefinition],
        difficulty: DefenseDifficultyDefinition,
        targetKills: Int,
        mode: TimingMode
    ) -> DryRunResult {
        guard !phrases.isEmpty, targetKills > 0 else {
            return DryRunResult(cleared: false, playerHp: 0)
        }

        let bpm = max(1, stage.bpm)
        let beatsPerBar = max(1, stage.beatsPerBar)
        let barSec = (60 / bpm) * Double(beatsPerBar)
        let eighthSec = 30 / bpm
        let callBars = max(1, stage.callResponseBars ?? 1)
        let responseBars = max(1, stage.callResponseResponseBars ?? 1)
        let callSec = Double(callBars) * barSec
        let responseSec = Double(responseBars) * barSec
        let spEligible = stage.attackTrigger == .note && stage.playStyle != .chordVoicing

        var runtime = DefenseRuntimeState(
            playerHp: stage.playerHp,
            surviveSeconds: TimeInterval(stage.surviveSeconds),
            maxEnemies: difficulty.maxEnemies,
            practiceMode: false,
            tutorial: nil,
            attackTrigger: stage.attackTrigger
        )
        runtime.callResponseActive = true
        runtime.endlessPromptEnabled = false
        runtime.targetEnemiesDefeated = targetKills
        runtime.spawnTimerSec = difficulty.spawnIntervalSec * 0.8
        runtime.enemyBehavior = .approach
        DefenseGameLoop.spawnCallResponseInitialEnemy(runtime: &runtime, difficulty: difficulty)

        var totalResponseSec = 0.0
        var phraseIdx = 0

        while runtime.result == .playing, totalResponseSec < maxResponseSimSec {
            let phrase = phrases[phraseIdx % phrases.count]
            phraseIdx += 1

            let pBars = DefenseCallResponseTier.resolvePhraseBars(phrase, stagePhraseBars: stage.phraseBars)
            let phraseSec = Double(pBars) * barSec
            let attacks = DefenseCallResponseTier.countPhraseAttacks(phrase, attackTrigger: stage.attackTrigger)
            let measures = max(1, phrase.chords.count)
            let reqCount = max(1, phrase.requiredCompletionCount ?? stage.requiredCompletionCount)
            let repsPerResponse = max(1, responseBars / pBars)
            let offsets = buildPhraseOffsets(
                attacks: attacks,
                phraseSec: phraseSec,
                eighthSec: eighthSec,
                mode: mode
            )
            let measureEnds = buildMeasureEndIndices(attackCount: offsets.count, measureCount: measures)

            var repsLeft = reqCount
            while repsLeft > 0, runtime.result == .playing, totalResponseSec < maxResponseSimSec {
                let repsThisWindow = min(repsLeft, repsPerResponse)
                let isFinishingPhrase = repsThisWindow == repsLeft
                var events: [AttackEvent] = []
                events.reserveCapacity(repsThisWindow * offsets.count)
                for rep in 0..<repsThisWindow {
                    let baseT = Double(rep) * phraseSec
                    for (ni, offset) in offsets.enumerated() {
                        events.append(AttackEvent(timeSec: baseT + offset, isMeasureEnd: measureEnds.contains(ni)))
                    }
                }

                let lastEventTime = events.last?.timeSec ?? 0
                let windowDur = isFinishingPhrase ? lastEventTime + dryRunDtSec : responseSec

                runtime.enemyBehavior = .approach
                var eventIndex = 0
                var localT = 0.0
                while localT < windowDur, runtime.result == .playing {
                    let step = min(dryRunDtSec, windowDur - localT)
                    localT += step
                    totalResponseSec += step

                    while eventIndex < events.count, events[eventIndex].timeSec <= localT + 1e-9 {
                        _ = DefenseGameLoop.performSlash(runtime: &runtime, difficulty: difficulty)
                        if runtime.result != .playing { break }
                        if spEligible, events[eventIndex].isMeasureEnd {
                            _ = DefenseGameLoop.chargeSp(runtime: &runtime)
                        }
                        eventIndex += 1
                    }
                    if runtime.result != .playing { break }

                    DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: step)
                }

                if runtime.result != .playing { break }

                runtime.enemyBehavior = .dance
                for idx in runtime.enemies.indices where runtime.enemies[idx].isActive {
                    runtime.enemies[idx].knockbackVx = 0
                    runtime.enemies[idx].attackHitPending = false
                }
                runtime.elapsedSec += callSec
                repsLeft -= repsThisWindow
            }
        }

        return DryRunResult(cleared: runtime.result == .clear, playerHp: runtime.playerHp)
    }

    private static func passesGuardHpFloor(playerHp: Int, playerMaxHp: Int, minHpRatio: Double) -> Bool {
        playerHp >= max(1, Int(ceil(Double(playerMaxHp) * minHpRatio)))
    }

    static func applyClearGuard(
        stage: DefenseStageDefinition,
        phrases: [DefensePhraseDefinition],
        base: DefenseDifficultyDefinition
    ) -> DefenseDifficultyDefinition {
        let tier = DefenseCallResponseTier.tierPreset(for: base.level)
        guard let targetKills = DefenseCallResponseCombat.clearTarget(
            stage: stage,
            phrases: phrases,
            difficulty: base
        ), targetKills > 0 else {
            return base
        }

        let candidateSpeed = max(minGuardedSpeedPx, base.enemySpeedPxPerSec)

        func trySpeed(_ candidate: Double) -> Bool {
            let difficulty = DefenseDifficultyDefinition(
                level: base.level,
                enemyHp: base.enemyHp,
                spawnIntervalSec: base.spawnIntervalSec,
                maxEnemies: base.maxEnemies,
                enemySpeedPxPerSec: candidate,
                enemyDamage: base.enemyDamage,
                attackIntervalSec: base.attackIntervalSec,
                attackRangePx: base.attackRangePx
            )
            let front = runDryRun(
                stage: stage,
                phrases: phrases,
                difficulty: difficulty,
                targetKills: targetKills,
                mode: .frontDelayed
            )
            guard front.cleared,
                  passesGuardHpFloor(
                      playerHp: front.playerHp,
                      playerMaxHp: stage.playerHp,
                      minHpRatio: tier.minHpGuardRatio
                  ) else {
                return false
            }
            let back = runDryRun(
                stage: stage,
                phrases: phrases,
                difficulty: difficulty,
                targetKills: targetKills,
                mode: .back
            )
            return back.cleared
                && passesGuardHpFloor(
                    playerHp: back.playerHp,
                    playerMaxHp: stage.playerHp,
                    minHpRatio: tier.minHpGuardRatio
                )
        }

        if trySpeed(candidateSpeed) {
            return DefenseDifficultyDefinition(
                level: base.level,
                enemyHp: base.enemyHp,
                spawnIntervalSec: base.spawnIntervalSec,
                maxEnemies: base.maxEnemies,
                enemySpeedPxPerSec: candidateSpeed,
                enemyDamage: base.enemyDamage,
                attackIntervalSec: base.attackIntervalSec,
                attackRangePx: base.attackRangePx
            )
        }

        var low = minGuardedSpeedPx
        var high = candidateSpeed
        for _ in 0..<maxBinarySearchSteps {
            let mid = (low + high) / 2
            if trySpeed(mid) {
                low = mid
            } else {
                high = mid
            }
        }

        let guarded = max(minGuardedSpeedPx, low * guardSpeedFactor)
        return DefenseDifficultyDefinition(
            level: base.level,
            enemyHp: base.enemyHp,
            spawnIntervalSec: base.spawnIntervalSec,
            maxEnemies: base.maxEnemies,
            enemySpeedPxPerSec: guarded,
            enemyDamage: base.enemyDamage,
            attackIntervalSec: base.attackIntervalSec,
            attackRangePx: base.attackRangePx
        )
    }

    static func resolveGuardedDifficulty(
        stage: DefenseStageDefinition,
        phrases: [DefensePhraseDefinition],
        tierLevel: Int
    ) -> DefenseDifficultyDefinition {
        let base = DefenseCallResponseTier.buildBaseDifficulty(
            tierLevel: tierLevel,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            phraseBars: stage.phraseBars,
            attackTrigger: stage.attackTrigger,
            phrases: phrases
        )
        return applyClearGuard(stage: stage, phrases: phrases, base: base)
    }
}
