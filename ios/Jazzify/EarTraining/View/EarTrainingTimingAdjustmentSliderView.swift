import SwiftUI

struct EarTrainingTimingAdjustmentSliderView: View {
    let isEnglishCopy: Bool
    @Binding var appliedOffsetMs: Int
    let onChange: (Int) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(isEnglishCopy ? "Timing adjustment" : "タイミング調整")
                .font(.headline)
                .foregroundStyle(Color(red: 1, green: 0.92, blue: 0.75))
            Text(isEnglishCopy ? "Hammers feel early → move right (+)" : "ハンマーが早い → 右へ（+）")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(isEnglishCopy ? "Audio feels early → move left (−)" : "音が早い → 左へ（−）")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Text(isEnglishCopy ? "Offset" : "補正量")
                Spacer()
                Text(EarTrainingOsmdTimingAdjustment.formatTimingAdjustmentLabel(appliedOffsetMs))
                    .font(.headline.monospacedDigit())
                    .foregroundStyle(Color(red: 1, green: 0.92, blue: 0.75))
            }
            Slider(
                value: Binding(
                    get: { Double(appliedOffsetMs) },
                    set: { newValue in
                        let clamped = EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(Int(newValue.rounded()))
                        appliedOffsetMs = clamped
                        onChange(clamped)
                    }
                ),
                in: Double(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMin)...Double(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMax),
                step: Double(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsStep)
            )
            .tint(.orange)
            HStack {
                Text("\(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMin)ms")
                Spacer()
                Text("0ms")
                Spacer()
                Text("\(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMax)ms")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, max(12, UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow?.safeAreaInsets.bottom }.first ?? 0))
        .background(Color.black.opacity(0.88))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Color.orange.opacity(0.35))
                .frame(height: 1)
        }
    }
}
