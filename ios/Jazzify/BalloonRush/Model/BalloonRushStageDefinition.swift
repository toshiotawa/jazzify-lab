import Foundation

/// `balloon_rush_stages` 1 行。Web `BalloonRushResolvedStage` と同期。
struct BalloonRushStageDefinition: Sendable, Identifiable {
    enum StageType: String, Sendable {
        case random
        case progression
    }

    let id: UUID
    let slug: String
    let title: String
    let titleEn: String
    let description: String?
    let descriptionEn: String?
    let stageType: StageType
    let chordSuffix: String
    let rootPattern: String?
    let allowedChordIds: [String]
    let chordProgression: [SurvivalChordProgressionEntry]?
    let timeLimitSec: Int
    let popQuota: Int
    let balloonLifetimeSec: Double
    let maxConcurrent: Int
    let respawnDelaySec: Double
    let bgmUrl: String?
    let keyFifths: Int

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn.isEmpty ? title : titleEn) : title
    }

    func runPrepModeLabel(locale: AppLocale) -> String {
        switch stageType {
        case .progression:
            return locale == .en ? "Progression chords" : "プログレッションコード"
        case .random:
            return locale == .en ? "Random chords" : "ランダムコード"
        }
    }

    func runPrepClearSummary(locale: AppLocale) -> String {
        if locale == .en {
            return "Clear: pop \(popQuota) balloons within \(timeLimitSec)s (practice does not save progress)."
        }
        return "クリア条件: \(timeLimitSec)秒以内に風船を\(popQuota)個割る（練習時は進捗が保存されません）。"
    }

    /// random: DB `allowed_chords` または root_pattern + chord_suffix。
    func resolvedAllowedChordIds() -> [String] {
        if !allowedChordIds.isEmpty { return allowedChordIds }
        guard stageType == .random, let pattern = rootPattern?.trimmingCharacters(in: .whitespacesAndNewlines), !pattern.isEmpty else {
            return []
        }
        return BalloonRushChordCatalog.chordsForSuffix(chordSuffix, rootPattern: pattern)
    }

    func buildProgressionChords() -> [SurvivalResolvedChord] {
        guard stageType == .progression, let entries = chordProgression, !entries.isEmpty else { return [] }
        let resolved = entries.enumerated().map { index, entry in
            SurvivalResolvedChord.fromProgressionEntry(entry, index: index)
        }
        let valid = resolved.filter { !$0.pitchClasses.isEmpty }
        if !valid.isEmpty { return valid }
        return resolvedAllowedChordIds().compactMap { SurvivalChordResolver.resolve(id: $0) }
    }
}

/// Web `buildAllowedChordsForSuffix` 相当（random 用）。
enum BalloonRushChordCatalog {
    private static let rootsByPattern: [String: [String]] = [
        "cde": ["C", "D", "E"],
        "fgab": ["F", "G", "A", "B"],
        "sharp": ["C#", "D#", "F#", "G#", "A#"],
        "flat": ["Db", "Eb", "Gb", "Ab", "Bb"],
        "all": ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"],
    ]

    static func chordsForSuffix(_ suffix: String, rootPattern: String) -> [String] {
        guard let roots = rootsByPattern[rootPattern] else { return [] }
        return roots.map { "\($0)\(suffix)" }
    }
}

struct BalloonRushStageRow: Decodable, Sendable {
    let id: UUID
    let slug: String
    let title: String
    let title_en: String?
    let description: String?
    let description_en: String?
    let stage_type: String
    let chord_suffix: String?
    let root_pattern: String?
    let allowed_chords: [String]?
    let chord_progression: [SurvivalChordProgressionEntry]?
    let time_limit_sec: Int?
    let pop_quota: Int?
    let balloon_lifetime_sec: Double?
    let max_concurrent: Int?
    let respawn_delay_sec: Double?
    let bgm_url: String?
    let key_fifths: Int?

    func toDefinition() -> BalloonRushStageDefinition {
        let st: BalloonRushStageDefinition.StageType =
            stage_type == "random" ? .random : .progression
        return BalloonRushStageDefinition(
            id: id,
            slug: slug,
            title: title,
            titleEn: title_en ?? "",
            description: description,
            descriptionEn: description_en,
            stageType: st,
            chordSuffix: chord_suffix ?? "major",
            rootPattern: root_pattern,
            allowedChordIds: allowed_chords ?? [],
            chordProgression: chord_progression,
            timeLimitSec: time_limit_sec ?? 90,
            popQuota: pop_quota ?? 20,
            balloonLifetimeSec: balloon_lifetime_sec ?? 10,
            maxConcurrent: max_concurrent ?? 5,
            respawnDelaySec: respawn_delay_sec ?? 5,
            bgmUrl: bgm_url,
            keyFifths: key_fifths ?? 0
        )
    }
}

struct BalloonRushLessonContext: Sendable {
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
}
