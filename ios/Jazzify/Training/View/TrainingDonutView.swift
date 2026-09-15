import SwiftUI

/// 0〜100% の達成率を表すドーナツ（Web `DonutChart` 相当）
struct TrainingDonutView: View {
    let percent: Int
    var size: CGFloat = 72
    var lineWidth: CGFloat = 8
    var tint: Color = .indigo

    private var fraction: CGFloat {
        CGFloat(min(100, max(0, percent))) / 100
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(tint.opacity(0.2), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: fraction)
                .stroke(tint, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(percent)%")
                .font(.system(size: size * 0.22, weight: .bold, design: .rounded))
                .monospacedDigit()
        }
        .frame(width: size, height: size)
        .accessibilityLabel("\(percent)%")
    }
}
