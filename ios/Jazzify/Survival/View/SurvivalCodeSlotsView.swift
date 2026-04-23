import SwiftUI

/// コードスロット UI。WEB 版 `SurvivalCodeSlots.tsx` と同仕様。
/// - ステージモード(通常バトル): A/B/C の 3 スロット表示 (D は非表示)
/// - ボスステージ: A/B の 2 スロットのみ（幅を広く、高さを太く）
/// - ラベル: A=🔫 Shot, B=👊 Punch, C=🪄 Magic, D=✨ Magic
/// - 現コード表示 + 構成音の正解進捗バー + タイマー + 次コード (NEXT) を同時表示
/// - ヒント時は構成音を pitch class 表示 + 黄色リングで強調
struct SurvivalCodeSlotsView: View {
    @ObservedObject var controller: SurvivalGameController

    var body: some View {
        let isBoss = controller.isBossStage
        let lastIndex = isBoss ? 1 : 2  // 通常=0..2(3枠), ボス=0..1(2枠)

        return HStack(spacing: isBoss ? 12 : 8) {
            ForEach(0...lastIndex, id: \.self) { idx in
                slotCell(index: idx, isWide: isBoss)
            }
        }
        .padding(.horizontal, 12)
    }

    private func slotCell(index: Int, isWide: Bool) -> some View {
        let slot = controller.runtime.slots[index]
        let style = Self.slotStyle(for: index)
        let isHinted = controller.runtime.hintMode && slot.isEnabled

        return VStack(spacing: 4) {
            currentSlotView(slot: slot, style: style, isWide: isWide, isHinted: isHinted)
            nextSlotView(slot: slot, style: style, isWide: isWide)
        }
    }

    // MARK: - 現行スロット (コード名 + 進捗ゲージ + ラベル/タイマー)

    private func currentSlotView(
        slot: SurvivalCodeSlot,
        style: SlotStyle,
        isWide: Bool,
        isHinted: Bool
    ) -> some View {
        let progress = slot.isEnabled ? slot.progressRatio : 0
        let isCompleted = slot.isEnabled && slot.totalNotes > 0 && slot.correctCount >= slot.totalNotes

        return ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 10)
                .fill(
                    LinearGradient(
                        colors: slot.isEnabled ? style.gradient : [Color.black.opacity(0.35)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            VStack(spacing: 0) {
                HStack(alignment: .top) {
                    Text(style.label)
                        .font(isWide ? .caption.bold() : .caption2.bold())
                        .foregroundStyle(style.textColor.opacity(slot.isEnabled ? 1.0 : 0.4))
                    Spacer()
                    if slot.isEnabled {
                        Text(String(format: "%.0fs", max(0, slot.timer)))
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.75))
                    }
                }
                .padding(.horizontal, isWide ? 10 : 6)
                .padding(.top, isWide ? 4 : 3)

                Spacer(minLength: 0)

                chordNameView(slot: slot, isWide: isWide, isCompleted: isCompleted)

                Spacer(minLength: 0)
                if controller.runtime.hintMode, slot.isEnabled, let chord = slot.chord {
                    Text(chord.pitchClasses.map { SurvivalCodeSlotsView.pitchLabel($0) }.joined(separator: " "))
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.85))
                        .padding(.bottom, 2)
                }
            }

            // 進捗ゲージ (WEB 版 `progressPercent` 緑バー)
            if slot.isEnabled, slot.totalNotes > 0 {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.black.opacity(0.45))
                            .frame(height: 4)
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: isCompleted
                                        ? [Color.yellow, Color.orange]
                                        : [Color.green, Color(red: 0.3, green: 0.85, blue: 0.3)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geo.size.width * CGFloat(progress), height: 4)
                    }
                }
                .frame(height: 4)
                .padding(.horizontal, 2)
                .padding(.bottom, 2)
            }
        }
        .frame(height: isWide ? 72 : 48)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(slot.isEnabled ? style.borderColor : Color.gray.opacity(0.4), lineWidth: 1.5)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.yellow, lineWidth: isHinted ? 2 : 0)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    @ViewBuilder
    private func chordNameView(slot: SurvivalCodeSlot, isWide: Bool, isCompleted: Bool) -> some View {
        if let chord = slot.chord, slot.isEnabled {
            Text(chord.displayName)
                .font(.system(size: Self.chordFontSize(length: chord.displayName.count, isWide: isWide), weight: .bold))
                .foregroundStyle(isCompleted ? Color.yellow : Color.white)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .padding(.horizontal, 6)
        } else {
            Text(slot.isEnabled ? "—" : "🔒")
                .font(.title3.bold())
                .foregroundStyle(.gray)
        }
    }

    // MARK: - NEXT プレビュー (下段の小さな枠)

    private func nextSlotView(slot: SurvivalCodeSlot, style: SlotStyle, isWide: Bool) -> some View {
        let display: String = {
            guard slot.isEnabled, let next = slot.nextChord else { return "---" }
            return next.displayName
        }()
        return VStack(spacing: 0) {
            Text("NEXT")
                .font(.system(size: isWide ? 9 : 8, weight: .semibold))
                .foregroundStyle(.gray)
            Text(display)
                .font(.system(size: Self.nextFontSize(length: display.count, isWide: isWide), weight: .bold))
                .foregroundStyle(style.textColor.opacity(slot.isEnabled ? 0.9 : 0.3))
                .lineLimit(1)
                .minimumScaleFactor(0.5)
        }
        .frame(maxWidth: .infinity)
        .frame(height: isWide ? 30 : 22)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(
                    LinearGradient(
                        colors: [Color.black.opacity(0.65), Color.black.opacity(0.8)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(style.borderColor.opacity(0.5), lineWidth: 1)
        )
        .opacity(slot.isEnabled ? 1.0 : 0.35)
    }

    // MARK: - Styling

    private struct SlotStyle {
        let label: String
        let gradient: [Color]
        let borderColor: Color
        let textColor: Color
    }

    private static func slotStyle(for index: Int) -> SlotStyle {
        switch index {
        case 0:
            return SlotStyle(
                label: "🔫 Shot",
                gradient: [Color.blue.opacity(0.80), Color(red: 0.1, green: 0.2, blue: 0.6).opacity(0.85)],
                borderColor: Color.blue.opacity(0.95),
                textColor: Color(red: 0.75, green: 0.88, blue: 1.0)
            )
        case 1:
            return SlotStyle(
                label: "👊 Punch",
                gradient: [Color.orange.opacity(0.80), Color(red: 0.7, green: 0.35, blue: 0.1).opacity(0.85)],
                borderColor: Color.orange.opacity(0.95),
                textColor: Color(red: 1.0, green: 0.82, blue: 0.55)
            )
        case 2:
            return SlotStyle(
                label: "🪄 Magic",
                gradient: [Color.purple.opacity(0.80), Color(red: 0.3, green: 0.1, blue: 0.55).opacity(0.85)],
                borderColor: Color.purple.opacity(0.95),
                textColor: Color(red: 0.85, green: 0.72, blue: 1.0)
            )
        default:
            return SlotStyle(
                label: "✨ Magic",
                gradient: [Color.pink.opacity(0.80), Color(red: 0.6, green: 0.1, blue: 0.35).opacity(0.85)],
                borderColor: Color.pink.opacity(0.95),
                textColor: Color(red: 1.0, green: 0.77, blue: 0.9)
            )
        }
    }

    private static func chordFontSize(length: Int, isWide: Bool) -> CGFloat {
        if isWide {
            if length > 10 { return 12 }
            if length > 6 { return 15 }
            if length > 4 { return 18 }
            return 22
        } else {
            if length > 10 { return 10 }
            if length > 6 { return 12 }
            if length > 4 { return 14 }
            return 17
        }
    }

    private static func nextFontSize(length: Int, isWide: Bool) -> CGFloat {
        if isWide {
            if length > 8 { return 10 }
            if length > 5 { return 12 }
            return 14
        } else {
            if length > 8 { return 9 }
            if length > 5 { return 10 }
            return 12
        }
    }

    private static func pitchLabel(_ pc: Int) -> String {
        let labels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        let idx = max(0, min(labels.count - 1, pc))
        return labels[idx]
    }
}
