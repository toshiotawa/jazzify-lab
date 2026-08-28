import Foundation
import os

/// Web `earTrainingInputTimingTelemetry.ts` 相当。入力イベント時のみ debug ログ。
enum EarTrainingInputTimingTelemetry {
    enum Mode: String {
        case chordOsmd = "chord_osmd"
        case chordPrecision = "chord_precision"
    }

    private static let logger = Logger(subsystem: "com.jazzify.lab", category: "earTrainingInputTiming")

    static func log(
        mode: Mode,
        slug: String?,
        timingSource: String?,
        nominalTargetSec: Double,
        inputSec: Double,
        midi: Int
    ) {
        let deltaMs = (inputSec - nominalTargetSec) * 1000
        let roundedDelta = (deltaMs * 10).rounded() / 10
        logger.debug(
            "[earTrainingInputTiming] mode=\(mode.rawValue, privacy: .public) slug=\(slug ?? "", privacy: .public) timingSource=\(timingSource ?? "unknown", privacy: .public) nominalTargetSec=\(nominalTargetSec, privacy: .public) inputSec=\(inputSec, privacy: .public) deltaMs=\(roundedDelta, privacy: .public) midi=\(midi, privacy: .public) matched=true"
        )
    }

    static func logUnmatched(
        mode: Mode,
        slug: String?,
        timingSource: String?,
        inputSec: Double,
        midi: Int,
        nearestTargetSec: Double?,
        nearestDeltaMs: Double?
    ) {
        let nearestSecText = nearestTargetSec.map { String($0) } ?? "nil"
        let nearestDeltaText = nearestDeltaMs.map { String($0) } ?? "nil"
        logger.debug(
            "[earTrainingInputTiming] mode=\(mode.rawValue, privacy: .public) slug=\(slug ?? "", privacy: .public) timingSource=\(timingSource ?? "unknown", privacy: .public) inputSec=\(inputSec, privacy: .public) nearestTargetSec=\(nearestSecText, privacy: .public) nearestDeltaMs=\(nearestDeltaText, privacy: .public) midi=\(midi, privacy: .public) matched=false"
        )
    }
}
