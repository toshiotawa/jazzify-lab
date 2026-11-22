import Foundation

enum DefenseCallResponseCombat {
    static let minClearNotes = 50

    static func countPhraseNotes(_ phrase: DefensePhraseDefinition) -> Int {
        phrase.chords.reduce(0) { sum, chord in sum + chord.notes.count }
    }

    static func clearTarget(
        stage: DefenseStageDefinition,
        phrases: [DefensePhraseDefinition]
    ) -> Int? {
        guard DefenseCallResponse.config(for: stage) != nil, !phrases.isEmpty else { return nil }

        var completionsPerLap = 0
        var notesPerLap = 0
        for phrase in phrases {
            let req = max(1, phrase.requiredCompletionCount ?? stage.requiredCompletionCount)
            let notes = countPhraseNotes(phrase)
            completionsPerLap += req
            notesPerLap += notes * req
        }

        let laps = notesPerLap > 0
            ? max(1, Int(ceil(Double(minClearNotes) / Double(notesPerLap))))
            : 1
        return completionsPerLap * laps
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

    static func waveIndex(phraseCompletions: Int, targetPhraseCompletions: Int) -> Int {
        guard targetPhraseCompletions > 0 else { return 0 }
        let ratio = min(1, Double(phraseCompletions) / Double(targetPhraseCompletions))
        let index = Int(floor(ratio * Double(DefenseEnemyConfig.waveCount)))
        return min(DefenseEnemyConfig.waveCount - 1, max(0, index))
    }
}