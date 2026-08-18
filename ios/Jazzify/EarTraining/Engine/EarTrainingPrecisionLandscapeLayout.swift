import CoreGraphics

/// 精密モード擬似横画面の縦配分。譜面帯を優先し、ノーツレーンは最低高さを確保する。
enum EarTrainingPrecisionLandscapeLayout {
    static let pianoHeight: CGFloat = 72
    static let defaultNoteLaneHeight: CGFloat = 100
    static let minNoteLaneHeight: CGFloat = 12
    static let transportHeight: CGFloat = 48
    static let minScoreBandHeight: CGFloat = 96
    static let controlRailWidth: CGFloat = 44
    static let fallLeadSec: Double = 2

    struct Resolved: Equatable {
        let scoreBandHeight: CGFloat
        let noteLaneHeight: CGFloat
        let pianoHeight: CGFloat
        let transportHeight: CGFloat
    }

    static func availableHeight(viewportHeight: CGFloat, transportOpen: Bool) -> CGFloat {
        let safeViewport = max(1, viewportHeight)
        let transport = transportOpen ? transportHeight : 0
        return max(0, safeViewport - pianoHeight - transport)
    }

    static func defaultScoreBandHeight(viewportHeight: CGFloat, transportOpen: Bool) -> CGFloat {
        let available = availableHeight(viewportHeight: viewportHeight, transportOpen: transportOpen)
        if available < minScoreBandHeight + defaultNoteLaneHeight {
            return min(minScoreBandHeight, available)
        }
        return max(minScoreBandHeight, available - defaultNoteLaneHeight)
    }

    static func resolve(
        viewportHeight: CGFloat,
        transportOpen: Bool,
        requestedScoreBandHeight: CGFloat
    ) -> Resolved {
        let available = availableHeight(viewportHeight: viewportHeight, transportOpen: transportOpen)
        let score: CGFloat
        let lane: CGFloat
        if available < minScoreBandHeight + minNoteLaneHeight {
            score = min(minScoreBandHeight, available)
            lane = max(0, available - score)
        } else {
            let maxScore = available - minNoteLaneHeight
            score = min(max(requestedScoreBandHeight, minScoreBandHeight), maxScore)
            lane = available - score
        }
        return Resolved(
            scoreBandHeight: score,
            noteLaneHeight: lane,
            pianoHeight: pianoHeight,
            transportHeight: transportOpen ? transportHeight : 0
        )
    }
}
