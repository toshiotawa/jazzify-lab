import SwiftUI

/// 耳コピバトル ゲーム画面の上部 HUD。
/// - 左：プレイヤー HP バー / 中央：ステータステキスト + コードチップ / 右：制限時間 + 設定 + 戻る
/// - 制限時間表示はノッチ被りを避けるため `safeAreaInset(edge: .top)` 込みで右上のピル形バッジに再配置する。
struct EarTrainingHUDView: View {
    @ObservedObject var controller: EarTrainingBattleController

    var body: some View {
        VStack(spacing: 8) {
            HStack(alignment: .top, spacing: 12) {
                playerColumn
                Spacer(minLength: 6)
                rightControls
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)

            statusLine
            chordChips
            phraseSlots
            attackGauge
            enemyHealth
        }
        .padding(.bottom, 6)
        .background(
            LinearGradient(
                colors: [
                    Color.black.opacity(0.78),
                    Color.black.opacity(0.42),
                    Color.black.opacity(0.0)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .allowsHitTesting(false)
        )
    }

    private var playerColumn: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text(controller.isEnglishCopy ? "Player" : "プレイヤー")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white.opacity(0.85))
                if controller.practiceMode {
                    Text(controller.hudLabels.practiceBadge)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(hex: "0f172a"))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: "67e8f9"))
                        .clipShape(Capsule())
                }
                if controller.isMidiConnected {
                    Text("MIDI ON")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: "16a34a"))
                        .clipShape(Capsule())
                }
            }
            HpBar(currentHp: controller.playerHp, maxHp: controller.stage.playerHp, isEnemy: false)
                .frame(width: 160, height: 12)
            Text("\(controller.playerHp) / \(controller.stage.playerHp)")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .foregroundColor(.white.opacity(0.85))
        }
    }

    private var rightControls: some View {
        HStack(spacing: 8) {
            timePill
            iconButton(systemName: "gearshape.fill", label: controller.hudLabels.settings) {
                controller.handleOpenSettings()
            }
            iconButton(systemName: "xmark", label: controller.hudLabels.backShort) {
                controller.handleBack()
            }
        }
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
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(textColor.opacity(0.85))
            Text(controller.timeLabel)
                .font(.system(size: 13, weight: .heavy, design: .monospaced))
                .foregroundColor(textColor)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.black.opacity(0.55))
        .overlay(
            Capsule().stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
        .clipShape(Capsule())
    }

    private func iconButton(systemName: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 1) {
                Image(systemName: systemName)
                    .font(.system(size: 14, weight: .bold))
                Text(label)
                    .font(.system(size: 9, weight: .semibold))
            }
            .foregroundColor(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.55))
            .overlay(
                Capsule().stroke(Color.white.opacity(0.18), lineWidth: 1)
            )
            .clipShape(Capsule())
        }
        .accessibilityLabel(Text(label))
    }

    private var statusLine: some View {
        Text(controller.stageStatusText)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(statusColor)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 14)
            .multilineTextAlignment(.center)
    }

    private var statusColor: Color {
        switch controller.feedback {
        case .correct: return Color(hex: "bbf7d0")
        case .miss: return Color(hex: "fca5a5")
        case .clear: return Color(hex: "fde68a")
        case nil: return .white.opacity(0.92)
        }
    }

    private var chordChips: some View {
        let chips = controller.chordChips
        return HStack(spacing: 6) {
            ForEach(chips) { chip in
                Text(chip.name)
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundColor(chip.active ? Color(hex: "0f172a") : Color.white.opacity(0.92))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(chip.active ? Color(hex: "facc15") : Color.white.opacity(0.18))
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.horizontal, 12)
    }

    private var phraseSlots: some View {
        let slots = controller.phraseSlots
        let revealed = controller.revealedNotes
        let currentIndex = controller.currentNoteIndex
        return HStack(spacing: 6) {
            ForEach(Array(slots.enumerated()), id: \.offset) { index, name in
                let revealedNote: String? = index < revealed.count ? revealed[index] : nil
                let isActive = index == currentIndex && controller.gameState == .playingPhrase
                let displayText = revealedNote ?? "?"
                Text(displayText)
                    .font(.system(size: 13, weight: .heavy, design: .monospaced))
                    .foregroundColor(revealedNote != nil ? Color(hex: "0f172a") : Color.white.opacity(0.92))
                    .frame(width: 32, height: 28)
                    .background(
                        revealedNote != nil
                            ? Color(hex: "facc15")
                            : (isActive ? Color.white.opacity(0.34) : Color.white.opacity(0.18))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                    .accessibilityLabel(Text(revealedNote ?? name))
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.horizontal, 12)
    }

    private var attackGauge: some View {
        let percent = controller.enemyAttackGaugePercent
        return HStack(spacing: 6) {
            Text(controller.isEnglishCopy ? "Enemy" : "敵")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(.white.opacity(0.85))
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(Color.white.opacity(0.14))
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(Color(hex: "fb7185"))
                        .frame(width: proxy.size.width * CGFloat(max(0, min(1, percent))))
                }
            }
            .frame(height: 6)
        }
        .padding(.horizontal, 12)
    }

    private var enemyHealth: some View {
        VStack(alignment: .trailing, spacing: 2) {
            HpBar(currentHp: controller.enemyHp, maxHp: controller.stage.enemyHp, isEnemy: true)
                .frame(height: 12)
                .padding(.horizontal, 12)
            Text("\(controller.enemyHp) / \(controller.stage.enemyHp)")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .foregroundColor(.white.opacity(0.85))
                .padding(.trailing, 14)
        }
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
