import Foundation

struct DefenseCallResponseTierPreset: Equatable, Sendable {
    let level: Int
    let reachBars: Double
    let enemyHp: Int
    let maxEnemies: Int
    let spawnPressure: Double
    let enemyDamage: Int
    let attackIntervalSec: Double
    let attackRangePx: Double
    let minHpGuardRatio: Double
}

enum DefenseCallResponseTier {
    static let endlessSpeedAccelPerSec = 0.025
    static let endlessSpawnAccelPerSec = 0.025
    static let endlessHpAccelPerSec = 0.015

    private static let tierPresets: [DefenseCallResponseTierPreset] = [
        DefenseCallResponseTierPreset(
            level: 1, reachBars: 8.5, enemyHp: 2, maxEnemies: 4, spawnPressure: 0.45,
            enemyDamage: 1, attackIntervalSec: 2.8, attackRangePx: 48, minHpGuardRatio: 0.85
        ),
        DefenseCallResponseTierPreset(
            level: 2, reachBars: 6.8, enemyHp: 3, maxEnemies: 5, spawnPressure: 0.62,
            enemyDamage: 2, attackIntervalSec: 2.4, attackRangePx: 50, minHpGuardRatio: 0.75
        ),
        DefenseCallResponseTierPreset(
            level: 3, reachBars: 5.2, enemyHp: 3, maxEnemies: 6, spawnPressure: 0.8,
            enemyDamage: 2, attackIntervalSec: 2.0, attackRangePx: 52, minHpGuardRatio: 0.65
        ),
        DefenseCallResponseTierPreset(
            level: 4, reachBars: 4.0, enemyHp: 4, maxEnemies: 8, spawnPressure: 0.98,
            enemyDamage: 2, attackIntervalSec: 1.6, attackRangePx: 54, minHpGuardRatio: 0.55
        ),
        DefenseCallResponseTierPreset(
            level: 5, reachBars: 3.1, enemyHp: 5, maxEnemies: 10, spawnPressure: 1.15,
            enemyDamage: 3, attackIntervalSec: 1.3, attackRangePx: 56, minHpGuardRatio: 0.5
        ),
    ]

    private static let minSpawnIntervalSec = 0.8
    private static let minCandidateSpeedPx = 2.0
    private static let referenceNotesPerBar = 6.0
    private static let referenceMeasuresPerBar = 1.0
    private static let playerX: Double = 80
    private static let spawnX: Double = 760

    static func clampTierLevel(_ level: Int) -> Int {
        min(5, max(1, level))
    }

    static func tierPreset(for level: Int) -> DefenseCallResponseTierPreset {
        let clamped = clampTierLevel(level)
        return tierPresets[clamped - 1]
    }

    static func resolvePhraseBars(_ phrase: DefensePhraseDefinition, stagePhraseBars: Int) -> Int {
        max(1, max(stagePhraseBars, phrase.chords.count))
    }

    static func countPhraseAttacks(
        _ phrase: DefensePhraseDefinition,
        attackTrigger: DefenseAttackTrigger
    ) -> Int {
        if attackTrigger == .note {
            return max(1, DefenseCallResponseCombat.countPhraseNotes(phrase))
        }
        return max(1, phrase.chords.count)
    }

    /// Layer 1: Smooth speed reduction for sparse phrases / long silence gaps
    /// relative to the 6-notes-per-bar reference at the same BPM.
    static func phraseDensityScale(
        phrases: [DefensePhraseDefinition],
        bpm: Double,
        beatsPerBar: Int,
        phraseBars stagePhraseBars: Int,
        attackTrigger: DefenseAttackTrigger
    ) -> Double {
        guard !phrases.isEmpty else { return 1 }
        let safeBpm = max(1, bpm)
        let safeBeats = max(1, beatsPerBar)
        let barSec = (60 / safeBpm) * Double(safeBeats)
        let eighthSec = 30 / safeBpm
        let isNote = attackTrigger == .note
        let refPerBar = isNote ? referenceNotesPerBar : referenceMeasuresPerBar
        let refGapSec = isNote ? barSec * 0.375 : barSec

        var worstScale = 1.0
        for phrase in phrases {
            let pBars = resolvePhraseBars(phrase, stagePhraseBars: stagePhraseBars)
            let phraseSec = Double(pBars) * barSec
            let attacks = countPhraseAttacks(phrase, attackTrigger: attackTrigger)

            let notesPerBar = Double(attacks) / Double(pBars)
            let densityRatio = min(1, notesPerBar / refPerBar)
            let estGapSec: Double = isNote
                ? max(phraseSec / Double(attacks), phraseSec - Double(max(0, attacks - 1)) * eighthSec)
                : phraseSec / Double(attacks)
            let gapRatio = min(1, (refGapSec + 0.5) / (estGapSec + 0.5))
            let scale = sqrt(max(1e-6, densityRatio * gapRatio))
            if scale < worstScale {
                worstScale = scale
            }
        }
        return min(1, max(0.1, worstScale))
    }

    static func buildBaseDifficulty(
        tierLevel: Int,
        bpm: Double,
        beatsPerBar: Int,
        phraseBars stagePhraseBars: Int,
        attackTrigger: DefenseAttackTrigger,
        phrases: [DefensePhraseDefinition]
    ) -> DefenseDifficultyDefinition {
        let tier = tierPreset(for: tierLevel)
        let isNote = attackTrigger == .note
        let safeBpm = max(1, bpm)
        let safeBeats = max(1, beatsPerBar)
        let barSec = (60 / safeBpm) * Double(safeBeats)
        let lanePx = max(1, spawnX - playerX - tier.attackRangePx)
        let barBasedSpeed = lanePx / (tier.reachBars * barSec)

        let densityScale = phraseDensityScale(
            phrases: phrases,
            bpm: safeBpm,
            beatsPerBar: safeBeats,
            phraseBars: stagePhraseBars,
            attackTrigger: attackTrigger
        )
        let candidateSpeed = max(minCandidateSpeedPx, barBasedSpeed * densityScale)

        var totalAttacks = 0
        var totalPhraseSec = 0.0
        for phrase in phrases {
            let pBars = resolvePhraseBars(phrase, stagePhraseBars: stagePhraseBars)
            totalAttacks += countPhraseAttacks(phrase, attackTrigger: attackTrigger)
            totalPhraseSec += Double(pBars) * barSec
        }
        let attacksPerSec = totalPhraseSec > 0
            ? Double(totalAttacks) / totalPhraseSec
            : (isNote ? referenceNotesPerBar / barSec : 1 / barSec)

        let enemyHp = isNote ? tier.enemyHp : max(1, Int(ceil(Double(tier.enemyHp) / 2)))
        let avgHitsWave0 = isNote ? max(1, Double(enemyHp) * 0.95) : max(1, Double(enemyHp))
        let killSec = avgHitsWave0 / max(0.05, attacksPerSec)
        let spawnIntervalSec = max(minSpawnIntervalSec, killSec / tier.spawnPressure)

        return DefenseDifficultyDefinition(
            level: tier.level,
            enemyHp: enemyHp,
            spawnIntervalSec: spawnIntervalSec,
            maxEnemies: tier.maxEnemies,
            enemySpeedPxPerSec: candidateSpeed,
            enemyDamage: tier.enemyDamage,
            attackIntervalSec: tier.attackIntervalSec,
            attackRangePx: tier.attackRangePx
        )
    }

    static func starRank(playerHp: Int, playerMaxHp: Int) -> Int {
        if playerHp >= playerMaxHp { return 3 }
        if playerHp * 2 >= playerMaxHp { return 2 }
        return 1
    }

    static func formatStarRank(_ rank: Int?) -> String {
        guard let rank, (1...3).contains(rank) else { return "☆☆☆" }
        return String(repeating: "★", count: rank) + String(repeating: "☆", count: 3 - rank)
    }

    struct EndlessAccel: Equatable, Sendable {
        let speedMult: Double
        let spawnMult: Double
        let hpMult: Double
    }

    struct EndlessAccelCap: Equatable, Sendable {
        let maxSpeedMult: Double
        let maxSpawnMult: Double
        let maxHpMult: Double
        let startSpeedMult: Double

        static let targetMaxSpeedMult = 1.65
        static let targetMaxSpawnMult = 1.65
        static let targetMaxHpMult = 1.40
        static let accelTimeConstantSec = 90.0

        static func scaled(maxScale: Double, startSpeedMult: Double = 1) -> EndlessAccelCap {
            let scale = min(1, max(0, maxScale))
            return EndlessAccelCap(
                maxSpeedMult: 1 + scale * (targetMaxSpeedMult - 1),
                maxSpawnMult: 1 + scale * (targetMaxSpawnMult - 1),
                maxHpMult: 1 + scale * (targetMaxHpMult - 1),
                startSpeedMult: min(1, max(0.25, startSpeedMult))
            )
        }
    }

    static func endlessProgress(elapsedSec: Double) -> Double {
        let t = max(0, elapsedSec)
        return 1 - exp(-t / EndlessAccelCap.accelTimeConstantSec)
    }

    static func endlessAccel(elapsedSec: Double, cap: EndlessAccelCap) -> EndlessAccel {
        let progress = endlessProgress(elapsedSec: elapsedSec)
        return EndlessAccel(
            speedMult: cap.startSpeedMult + (cap.maxSpeedMult - cap.startSpeedMult) * progress,
            spawnMult: 1 + (cap.maxSpawnMult - 1) * progress,
            hpMult: 1 + (cap.maxHpMult - 1) * progress
        )
    }

    /// Legacy linear ramp for non–tier-path stages.
    static func endlessAccel(elapsedSec: Double) -> EndlessAccel {
        let clamped = max(0, elapsedSec)
        return EndlessAccel(
            speedMult: 1 + endlessSpeedAccelPerSec * clamped,
            spawnMult: 1 + endlessSpawnAccelPerSec * clamped,
            hpMult: 1 + endlessHpAccelPerSec * clamped
        )
    }
}
