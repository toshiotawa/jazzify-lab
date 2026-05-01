import SwiftUI

/// 耳コピバトル ゲーム画面の上部 HUD。
/// - 上段：自分HP / 時間 / 敵HP
/// - 中段：攻撃ゲージ / コードチップ / 解答スロット
struct EarTrainingHUDView: View {
    @ObservedObject var controller: EarTrainingBattleController

    private let chordChipWidth: CGFloat = 76
    private let phraseSlotGap: CGFloat = 5

    var body: some View {
        ZStack(alignment: .topTrailing) {
            VStack(spacing: 3) {
                healthTimeRow
                attackGauge
                chordChips
                phraseSlots
            }
            .padding(.horizontal, 8)
            .padding(.top, 4)
            .padding(.bottom, 2)

            rightControls
                .padding(.top, 4)
                .padding(.trailing, 5)
        }
        .background(
            LinearGradient(
                colors: [
                    Color.black.opacity(0.58),
                    Color.black.opacity(0.22),
                    Color.black.opacity(0.0)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .allowsHitTesting(false)
        )
    }

    private var healthTimeRow: some View {
        HStack(alignment: .center, spacing: 6) {
            hpPanel(
                title: controller.isEnglishCopy ? "Player" : "自分HP",
                current: controller.playerHp,
                max: controller.stage.playerHp,
                isEnemy: false,
                horizontalAlignment: .leading,
                frameAlignment: .leading
            )

            timePill
                .frame(minWidth: 64)

            hpPanel(
                title: controller.isEnglishCopy ? "Enemy" : "敵HP",
                current: controller.enemyHp,
                max: controller.stage.enemyHp,
                isEnemy: true,
                horizontalAlignment: .trailing,
                frameAlignment: .trailing
            )
        }
        .padding(.trailing, 58)
    }

    private var rightControls: some View {
        HStack(spacing: 4) {
            iconButton(systemName: "gearshape.fill", label: controller.hudLabels.settings) {
                controller.handleOpenSettings()
            }
            iconButton(systemName: "xmark", label: controller.hudLabels.backShort) {
                controller.handleBack()
            }
        }
    }

    private func hpPanel(
        title: String,
        current: Int,
        max: Int,
        isEnemy: Bool,
        horizontalAlignment: HorizontalAlignment,
        frameAlignment: Alignment
    ) -> some View {
        VStack(alignment: horizontalAlignment, spacing: 2) {
            Text(title)
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(.white.opacity(0.78))
                .lineLimit(1)
            HpBar(currentHp: current, maxHp: max, isEnemy: isEnemy)
                .frame(height: 8)
            Text("\(current) / \(max)")
                .font(.system(size: 8, weight: .semibold, design: .monospaced))
                .foregroundColor(.white.opacity(0.84))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .frame(maxWidth: .infinity, alignment: frameAlignment)
    }

    private var timePill: some View {
        let isInfinity = controller.practiceMode
        let isLow = controller.timeRemaining <= 10
        let textColor: Color
        if isInfinity {
            textColor = Color(hex: "67e8f9")
        } else if isLow {
            textColor = Color(hex: "fca5a5")
        } else {
            textColor = .white
        }
        return HStack(spacing: 4) {
            Image(systemName: "clock.fill")
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(textColor.opacity(0.85))
            Text(controller.timeLabel)
                .font(.system(size: 12, weight: .heavy, design: .monospaced))
                .foregroundColor(textColor)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .background(Color.black.opacity(0.55))
        .overlay(
            Capsule().stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
        .clipShape(Capsule())
    }

    private func iconButton(systemName: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 11, weight: .bold))
                .frame(width: 26, height: 26)
                .foregroundColor(.white)
                .background(Color.black.opacity(0.55))
                .overlay(
                    Capsule().stroke(Color.white.opacity(0.18), lineWidth: 1)
                )
                .clipShape(Capsule())
        }
        .accessibilityLabel(Text(label))
    }

    private var chordChips: some View {
        let chips = controller.chordChips
        return Group {
            if chips.isEmpty {
                Color.clear.frame(height: 0)
            } else {
                GeometryReader { proxy in
                    let availableWidth = max(chordChipWidth, proxy.size.width)
                    let visibleCount = max(1, min(chips.count, Int(floor(availableWidth / chordChipWidth))))
                    let activeIndex = chips.firstIndex(where: { $0.active }) ?? 0
                    let firstVisibleIndex = min(
                        max(activeIndex - visibleCount + 1, 0),
                        max(0, chips.count - visibleCount)
                    )
                    let visibleChips = Array(chips[firstVisibleIndex..<min(chips.count, firstVisibleIndex + visibleCount)])

                    HStack(spacing: 0) {
                        ForEach(visibleChips) { chip in
                            Text(chip.name)
                                .font(.system(size: 10, weight: .heavy))
                                .foregroundColor(chip.active ? Color(hex: "0f172a") : Color.white.opacity(0.92))
                                .frame(width: chordChipWidth - 5, height: 22)
                                .background(chip.active ? Color(hex: "facc15") : Color.black.opacity(0.58))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                                        .stroke(chip.active ? Color(hex: "fef08a") : Color.white.opacity(0.14), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                                .padding(.horizontal, 2)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                }
                .frame(height: 24)
            }
        }
        .padding(.horizontal, 10)
    }

    private var phraseSlots: some View {
        let slots = controller.phraseSlots.isEmpty ? ["_"] : controller.phraseSlots
        let revealed = controller.revealedNotes
        let currentIndex = controller.currentNoteIndex
        return GeometryReader { proxy in
            let availableWidth = max(30, proxy.size.width - 20)
            let slotBaseCount = min(max(9, slots.count), 12)
            let slotSize = min(max((availableWidth - 20) / CGFloat(slotBaseCount), 28), 44)
            let totalSlotWidth = CGFloat(slots.count) * slotSize + CGFloat(max(0, slots.count - 1)) * phraseSlotGap
            let indicatorReserve: CGFloat = totalSlotWidth > availableWidth ? 28 : 0
            let visibleCount = max(1, min(slots.count, Int(floor((availableWidth - indicatorReserve + phraseSlotGap) / (slotSize + phraseSlotGap)))))
            let focusedIndex = min(max(currentIndex, 0), max(0, slots.count - 1))
            let firstVisibleIndex = min(
                max(focusedIndex - visibleCount / 2, 0),
                max(0, slots.count - visibleCount)
            )
            let visibleSlots = Array(slots.enumerated())[firstVisibleIndex..<min(slots.count, firstVisibleIndex + visibleCount)]

            HStack(spacing: phraseSlotGap) {
                if firstVisibleIndex > 0 {
                    Text("‹")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundColor(Color(hex: "94a3b8"))
                        .frame(width: 8)
                }
                ForEach(Array(visibleSlots), id: \.offset) { index, name in
                    let revealedNote: String? = index < revealed.count ? revealed[index] : nil
                    let isActive = index == currentIndex && controller.gameState == .playingPhrase
                    let displayText = revealedNote ?? "_"
                    Text(displayText)
                        .font(.system(size: max(11, slotSize * 0.44), weight: .heavy, design: .monospaced))
                        .foregroundColor(isActive ? Color(hex: "ecfeff") : (revealedNote != nil ? Color(hex: "d1fae5") : Color(hex: "64748b")))
                        .frame(width: slotSize, height: slotSize)
                        .background(
                            isActive
                                ? Color(hex: "22d3ee").opacity(0.38)
                                : (revealedNote != nil ? Color(hex: "10b981").opacity(0.28) : Color.black.opacity(0.78))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 4, style: .continuous)
                                .stroke(isActive ? Color(hex: "a5f3fc").opacity(0.9) : Color.white.opacity(0.14), lineWidth: isActive ? 2 : 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                        .accessibilityLabel(Text(revealedNote ?? name))
                }
                if firstVisibleIndex + visibleCount < slots.count {
                    Text("›")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundColor(Color(hex: "94a3b8"))
                        .frame(width: 8)
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
        .frame(height: 32)
        .padding(.horizontal, 10)
    }

    private var attackGauge: some View {
        let percent = controller.enemyAttackGaugePercent
        return HStack(spacing: 0) {
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(Color.white.opacity(0.14))
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(Color(hex: "fb7185"))
                        .frame(width: proxy.size.width * CGFloat(max(0, min(1, percent))))
                }
            }
            .frame(height: 5)
        }
        .frame(height: 8)
        .padding(.horizontal, 14)
    }

}

private struct HpBar: View {
    let currentHp: Int
    let maxHp: Int
    let isEnemy: Bool

    var body: some View {
        GeometryReader { proxy in
            let total = max(1, CGFloat(maxHp))
            let current = max(0, min(CGFloat(currentHp), total))
            let percent = current / total
            ZStack(alignment: isEnemy ? .trailing : .leading) {
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .fill(Color.white.opacity(0.14))
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .fill(barColor(percent: percent))
                    .frame(width: proxy.size.width * percent)
            }
            .overlay(
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
            )
        }
    }

    private func barColor(percent: CGFloat) -> Color {
        if percent > 0.6 {
            return Color(hex: "4ade80")
        }
        if percent > 0.3 {
            return Color(hex: "facc15")
        }
        return Color(hex: "f87171")
    }
}
