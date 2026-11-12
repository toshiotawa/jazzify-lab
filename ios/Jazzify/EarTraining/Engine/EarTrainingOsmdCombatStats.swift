import Foundation

/// Web `earTrainingOsmdCombatStats.ts` と同一の OSMD 本番バトル定数。
enum EarTrainingOsmdCombatStats {
    static let hpPerTarget = 100
    static let hitDamageMin = 40
    static let hitDamageMax = 60
    static let missDamage = 20

    static func enemyMaxHp(targetCountPerLoop: Int) -> Int {
        max(0, targetCountPerLoop) * hpPerTarget
    }

    static func rollHitDamage() -> Int {
        Int.random(in: hitDamageMin...hitDamageMax)
    }

    static func usesAutoCombat(stage: EarTrainingStageDetail, hasTutorial: Bool) -> Bool {
        stage.resolvedMode == .chordOSMD && !hasTutorial
    }
}

enum EarTrainingOsmdStageTargetCounter {
    @MainActor
    static func countTargetsPerLoop(
        stage: EarTrainingStageDetail,
        phrases: [EarTrainingPhraseDetail]
    ) async -> Int {
        let sorted = phrases.sorted { $0.orderIndex < $1.orderIndex }
        var total = 0
        for phrase in sorted {
            guard let raw = phrase.musicXmlUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !raw.isEmpty else {
                continue
            }
            let baseText: String?
            if let cached = EarTrainingMusicXmlTextCache.text(for: raw) {
                baseText = cached
            } else if let url = URL(string: raw) {
                do {
                    let (data, response) = try await URLSession.shared.data(from: url)
                    if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                        continue
                    }
                    guard let downloaded = String(data: data, encoding: .utf8),
                          !downloaded.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                        continue
                    }
                    baseText = downloaded
                } catch {
                    continue
                }
            } else {
                continue
            }
            guard let baseText else { continue }
            let prepared = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXmlWithMeta(baseText).xml
            let attacks = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(prepared)

            var midiData: Data?
            if let midiRaw = phrase.midiUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
               !midiRaw.isEmpty,
               let midiURL = URL(string: midiRaw) {
                midiData = try? await URLSession.shared.data(from: midiURL).0
            }

            total += EarTrainingChordOSMDBattleController.rhythmTargetCountForCombat(
                phrase: phrase,
                stage: stage,
                attacks: attacks,
                musicXmlText: prepared,
                midiData: midiData
            )
        }
        return total
    }
}
