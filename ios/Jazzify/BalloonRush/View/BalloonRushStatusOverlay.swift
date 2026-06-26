import SwiftUI

/// 風船ラッシュ: 五線譜直下に残り時間・残り個数を大きく表示（WEB `BalloonRushStatusOverlay` 準拠）
enum BalloonRushStatusOverlayLayout {
    static let staffTopPadding: CGFloat = 4
    static let gapBelowStaff: CGFloat = 8

    static func staffBandHeight(stageType: SurvivalStageType, staffVisible: Bool) -> CGFloat {
        guard staffVisible else { return 0 }
        let isPad = SurvivalStaffOverlayLayout.isPad
        switch stageType {
        case .progression:
            return SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(isPad: isPad, grandStaff: false)
        default:
            return SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: isPad, grandStaff: false)
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
            HStack(spacing: 12) {
                Text(timeLabel)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(timeIsLow ? Color.red : Color.yellow)
                Text(countLabel)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(countIsDone ? Color.green : Color.cyan)
            }
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
