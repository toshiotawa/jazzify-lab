import SwiftUI

/// 風船ラッシュ: 五線譜直下に残り時間・残り個数を大きく表示（WEB `BalloonRushStatusOverlay` 準拠）
enum BalloonRushStatusOverlayLayout {
    /// iOS `SurvivalStageCenterStaffOverlay.frame(maxHeight:)`
    static let compactStaffBandHeight: CGFloat = 160
    static let progressionStaffBandHeight: CGFloat = 220
    static let staffTopPadding: CGFloat = 4
    static let gapBelowStaff: CGFloat = 8

    static func staffBandHeight(stageType: SurvivalStageType, staffVisible: Bool) -> CGFloat {
        guard staffVisible else { return 0 }
        switch stageType {
        case .progression:
            return progressionStaffBandHeight
        default:
            return compactStaffBandHeight
        }
    }

    static func topInset(hudHeight: CGFloat, staffBandHeight: CGFloat) -> CGFloat {
        hudHeight + staffTopPadding + staffBandHeight + gapBelowStaff
    }
}

struct BalloonRushStatusOverlay: View, Equatable {
    let remainingSeconds: Int
    let remainingCount: Int
    let locale: AppLocale
    let topInset: CGFloat

    static func == (lhs: BalloonRushStatusOverlay, rhs: BalloonRushStatusOverlay) -> Bool {
        lhs.remainingSeconds == rhs.remainingSeconds &&
            lhs.remainingCount == rhs.remainingCount &&
            lhs.locale == rhs.locale &&
            lhs.topInset == rhs.topInset
    }

    private var timeLabel: String {
        let totalSec = max(0, remainingSeconds)
        return String(format: "%02d:%02d", totalSec / 60, totalSec % 60)
    }

    private var countLabel: String {
        let count = max(0, remainingCount)
        if locale == .ja {
            return "残り\(count)個"
        }
        return "\(count) left"
    }

    private var timeIsLow: Bool {
        remainingSeconds < 30
    }

    private var countIsDone: Bool {
        remainingCount <= 0
    }

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 4) {
                Text(timeLabel)
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(timeIsLow ? Color.red : Color.yellow)
                Text(countLabel)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(countIsDone ? Color.green : Color.cyan)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 10)
            .background(Color.black.opacity(0.55))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
            )
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .padding(.top, topInset)
        .allowsHitTesting(false)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            locale == .ja
                ? "残り時間 \(timeLabel)、\(countLabel)"
                : "Time \(timeLabel), \(countLabel)"
        )
    }
}
