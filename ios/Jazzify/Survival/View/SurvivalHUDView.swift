import SwiftUI

/// 画面上部 HUD: 残り時間・撃破数・プレイヤー HP バー・終了ボタン・ボス HP バー (ボス戦のみ)
/// WEB 版 `SurvivalGameOverlay` 準拠 (HP を緑/黄/赤で色分け、状態アイコンを横並び、ヒントバッジ)
struct SurvivalHUDView: View {
    @ObservedObject var controller: SurvivalGameController
    let stage: SurvivalStageDefinition
    let locale: AppLocale

    private var hpRatio: CGFloat {
        CGFloat(controller.runtime.player.hp) / CGFloat(max(1, controller.runtime.player.maxHp))
    }

    private var bossHpRatio: CGFloat? {
        guard let boss = controller.bossBattle else { return nil }
        return CGFloat(boss.boss.hp) / CGFloat(max(1, boss.boss.maxHp))
    }

    var body: some View {
        VStack(spacing: 6) {
            topRow
            if !controller.runtime.statusEffects.isEmpty || controller.runtime.hintMode {
                statusEffectStrip
            }
            if let bossRatio = bossHpRatio {
                bossHpBar(ratio: bossRatio)
            } else {
                playerHpBar
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 8)
        .padding(.bottom, 8)
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.55), Color.black.opacity(0.0)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }

    private var topRow: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(stage.localizedName(locale))
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                HStack(spacing: 10) {
                    Label(
                        timeLabel,
                        systemImage: "clock.fill"
                    )
                    .font(.caption2)
                    .foregroundStyle(.yellow)
                    // ボス戦中は撃破数ではなくボス HP に集中するため非表示
                    if controller.bossBattle == nil {
                        Label(
                            "\(controller.runtime.enemiesDefeated) / \(SurvivalConstants.stageEnemyQuota)",
                            systemImage: "bolt.fill"
                        )
                        .font(.caption2)
                        .foregroundStyle(.cyan)
                    }
                }
            }
            Spacer()
            if controller.runtime.hintMode {
                Text(locale == .ja ? "ヒント ON" : "HINT ON")
                    .font(.caption2.bold())
                    .foregroundStyle(.black)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.yellow)
                    .clipShape(Capsule())
            }
            Button(action: { controller.togglePause() }) {
                Image(systemName: controller.isPaused ? "play.fill" : "pause.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(Color.white.opacity(0.12))
                    .clipShape(Circle())
            }
        }
    }

    private var statusEffectStrip: some View {
        HStack(spacing: 6) {
            ForEach(controller.runtime.statusEffects) { effect in
                HStack(spacing: 3) {
                    Image(systemName: effect.kind.systemIcon)
                        .font(.caption2)
                        .foregroundStyle(.white)
                    if effect.level > 1 {
                        Text("×\(effect.level)")
                            .font(.caption2)
                            .foregroundStyle(.white)
                    }
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.white.opacity(0.14))
                .clipShape(Capsule())
            }
            Spacer()
        }
    }

    private var timeLabel: String {
        if controller.bossBattle != nil {
            return locale == .ja ? "ボス戦" : "Boss"
        }
        let remaining = max(0, controller.runtime.remainingSeconds)
        let totalSec = Int(remaining.rounded())
        return String(format: "%02d:%02d", totalSec / 60, totalSec % 60)
    }

    private var hpColor: LinearGradient {
        if hpRatio < 0.25 {
            return LinearGradient(
                colors: [Color.red, Color(red: 0.9, green: 0.25, blue: 0.25)],
                startPoint: .leading,
                endPoint: .trailing
            )
        }
        if hpRatio < 0.5 {
            return LinearGradient(
                colors: [Color.yellow, Color.orange],
                startPoint: .leading,
                endPoint: .trailing
            )
        }
        return LinearGradient(
            colors: [Color.green, Color(red: 0.2, green: 0.8, blue: 0.2)],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    private var playerHpBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.white.opacity(0.2))
                Capsule()
                    .fill(hpColor)
                    .frame(width: geo.size.width * max(0, min(1, hpRatio)))
                HStack {
                    Text("HP \(controller.runtime.player.hp) / \(controller.runtime.player.maxHp)")
                        .font(.caption2.bold())
                        .foregroundStyle(.white)
                        .padding(.leading, 10)
                    Spacer()
                }
            }
        }
        .frame(height: 18)
    }

    private func bossHpBar(ratio: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(locale == .ja ? "BOSS" : "BOSS")
                .font(.caption2.bold())
                .foregroundStyle(.red)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.18))
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [Color.red, Color.orange],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * max(0, min(1, ratio)))
                }
            }
            .frame(height: 14)
            playerHpBar
        }
    }
}
