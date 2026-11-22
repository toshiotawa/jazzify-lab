import Foundation

enum DefenseCallResponseCombat {
    static let minClearNotes = 50

    static func countPhraseNotes(_ phrase: DefensePhraseDefinition) -> Int {
        phrase.chords.reduce(0) { sum, chord in sum + chord.notes.count }
    }

    private static func countPhraseMeasures(_ phrase: DefensePhraseDefinition) -> Int {
        max(1, phrase.chords.count)
    }

    private struct LapTotals {
        let notesPerLap: Int
        let measuresPerLap: Int
        let laps: Int
    }

    private static func resolveEffectiveLaps(
        stage: DefenseStageDefinition,
        phrases: [DefensePhraseDefinition]
    ) -> LapTotals? {
        var notesPerLap = 0
        var measuresPerLap = 0
        for phrase in phrases {
            let req = max(1, phrase.requiredCompletionCount ?? stage.requiredCompletionCount)
            notesPerLap += countPhraseNotes(phrase) * req
            measuresPerLap += countPhraseMeasures(phrase) * req
        }
        guard notesPerLap > 0 else { return nil }
        let configuredLaps = max(1, stage.callResponseLaps ?? 1)
        let minLapsForNotes = max(1, Int(ceil(Double(minClearNotes) / Double(notesPerLap))))
        let laps = max(configuredLaps, minLapsForNotes)
        return LapTotals(notesPerLap: notesPerLap, measuresPerLap: measuresPerLap, laps: laps)
    }

    private static func waveKillBandStart(targetKills: Int, waveIndex: Int) -> Int {
        guard targetKills > 0, waveIndex > 0 else { return 0 }
        return Int(ceil(Double(waveIndex * targetKills) / Double(DefenseEnemyConfig.waveCount)))
    }

    private static func minSlashHitsForKillCount(
        targetKills: Int,
        difficulty: DefenseDifficultyDefinition,
        totalFireballs: Int,
        isWaveScaling: Bool
    ) -> Int {
        guard targetKills > 0 else { return 0 }
        var hitBudgetPerEnemy: [Int] = []
        hitBudgetPerEnemy.reserveCapacity(targetKills)
        for index in 0..<targetKills {
            let waveIndex = waveIndex(enemiesDefeated: index, targetEnemiesDefeated: targetKills)
            let spawnInWave = max(0, index - waveKillBandStart(targetKills: targetKills, waveIndex: waveIndex))
            var hpMult = isWaveScaling ? DefenseEnemyConfig.waveHpMult(for: waveIndex) : 1
            if isWaveScaling, waveIndex > 0, spawnInWave < difficulty.maxEnemies - 1 {
                hpMult = DefenseEnemyConfig.waveHpMult(for: waveIndex - 1)
            }
            let enemyType = DefenseEnemyConfig.pickWaveEnemyType(
                waveIndex: waveIndex,
                spawnCount: spawnInWave,
                cumulative: isWaveScaling
            )
            let resolved = DefenseEnemyConfig.resolveEnemyStats(
                type: enemyType,
                difficulty: difficulty,
                hpMult: hpMult
            )
            let slashDamage = DefenseEnemyConfig.slashDamage(waveIndex: waveIndex, scaling: isWaveScaling)
            let hits = max(1, Int(ceil(Double(resolved.hp) / Double(slashDamage))))
            hitBudgetPerEnemy.append(hits)
        }

        let totalHits = hitBudgetPerEnemy.reduce(0, +)
        var remaining = hitBudgetPerEnemy
        var slashSaved = 0
        var slots = totalFireballs * difficulty.maxEnemies
        while slots > 0 {
            var bestIndex = -1
            var bestHits = 0
            for (index, hits) in remaining.enumerated() where hits > bestHits {
                bestHits = hits
                bestIndex = index
            }
            if bestIndex < 0 || bestHits <= 0 { break }
            let saved = min(bestHits, DefenseEnemyConfig.fireballDamageMult)
            slashSaved += saved
            remaining[bestIndex] = bestHits - saved
            slots -= 1
        }
        return max(0, totalHits - slashSaved)
    }

    private static func resolveAttackBudget(
        stage: DefenseStageDefinition,
        totals: LapTotals
    ) -> (totalSlashes: Int, totalFireballs: Int) {
        let slashEventsPerLap = stage.attackTrigger == .note ? totals.notesPerLap : totals.measuresPerLap
        let totalSlashes = max(1, slashEventsPerLap * totals.laps)
        let spEligible = stage.attackTrigger == .note && stage.playStyle != .chordVoicing
        let totalFireballs = spEligible
            ? (totals.measuresPerLap * totals.laps) / DefenseEnemyConfig.spMax
            : 0
        return (totalSlashes, totalFireballs)
    }

    static func clearTarget(
        stage: DefenseStageDefinition,
        phrases: [DefensePhraseDefinition],
        difficulty: DefenseDifficultyDefinition
    ) -> Int? {
        guard DefenseCallResponse.config(for: stage) != nil, !phrases.isEmpty else { return nil }
        guard let totals = resolveEffectiveLaps(stage: stage, phrases: phrases) else { return nil }
        let budget = resolveAttackBudget(stage: stage, totals: totals)
        let isWaveScaling = stage.attackTrigger == .note
        var low = 1
        var high = max(budget.totalSlashes * DefenseEnemyConfig.damageUnit, 32)
        while minSlashHitsForKillCount(
            targetKills: high,
            difficulty: difficulty,
            totalFireballs: budget.totalFireballs,
            isWaveScaling: isWaveScaling
        ) < budget.totalSlashes {
            high *= 2
            if high > 1_000_000 { break }
        }
        while low < high {
            let mid = (low + high) / 2
            let need = minSlashHitsForKillCount(
                targetKills: mid,
                difficulty: difficulty,
                totalFireballs: budget.totalFireballs,
                isWaveScaling: isWaveScaling
            )
            if need >= budget.totalSlashes {
                high = mid
            } else {
                low = mid + 1
            }
        }
        return low
    }

    static func resolveEnemySpeed(
        difficulty: DefenseDifficultyDefinition,
        cycleBars: Int,
        responseBars: Int
    ) -> Double {
        let floorSpeed = max(difficulty.enemySpeedPxPerSec, 34 + Double(difficulty.level) * 6)
        let approachShare = Double(responseBars) / Double(max(1, cycleBars))
        let mult = min(1.5, 1 / max(approachShare, 1e-6))
        return floorSpeed * mult
    }

    static func applyDifficulty(
        _ difficulty: DefenseDifficultyDefinition,
        cycleBars: Int,
        responseBars: Int
    ) -> DefenseDifficultyDefinition {
        DefenseDifficultyDefinition(
            level: difficulty.level,
            enemyHp: difficulty.enemyHp,
            spawnIntervalSec: difficulty.spawnIntervalSec,
            maxEnemies: difficulty.maxEnemies,
            enemySpeedPxPerSec: resolveEnemySpeed(
                difficulty: difficulty,
                cycleBars: cycleBars,
                responseBars: responseBars
            ),
            enemyDamage: difficulty.enemyDamage,
            attackIntervalSec: difficulty.attackIntervalSec,
            attackRangePx: difficulty.attackRangePx
        )
    }

    static func waveIndex(enemiesDefeated: Int, targetEnemiesDefeated: Int) -> Int {
        guard targetEnemiesDefeated > 0 else { return 0 }
        let ratio = min(1, Double(enemiesDefeated) / Double(targetEnemiesDefeated))
        let index = Int(floor(ratio * Double(DefenseEnemyConfig.waveCount)))
        return min(DefenseEnemyConfig.waveCount - 1, max(0, index))
    }
}