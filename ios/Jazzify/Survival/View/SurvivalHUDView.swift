import SwiftUI

/// 画面上部 HUD: 残り時間・撃破数・プレイヤー HP バー・終了ボタン・ボス HP バー (ボス戦のみ)
/// WEB 版 `SurvivalGameOverlay` 準拠 (HP を緑/黄/赤で色分け、状態アイコンを横並び、ヒントバッジ)
///
/// パフォーマンス最適化:
/// 親ビューで `controller.objectWillChange` が 60Hz で発火しても、
/// 各サブビューは `Equatable` な値型のみ受け取り `.equatable()` 経由で差分比較されるため
/// 実際の再描画は値が変わったときだけになる。`HP 120/120` や `03:42` 表示は
/// 秒単位でしか変わらないため、SwiftUI ツリーの diff コストを大幅に削減できる。
struct SurvivalHUDView: View {
    @ObservedObject var controller: SurvivalGameController
    let stage: SurvivalStageDefinition
    let locale: AppLocale

    private var hpRatio: CGFloat {
        CGFloat(controller.uiSnapshot.hp) / CGFloat(max(1, controller.uiSnapshot.maxHp))
    }

    private var bossHpRatio: CGFloat? {
        guard let hud = controller.bossHud else { return nil }
        return hud.hpRatio
    }

    private var timeLabel: String {
        if controller.bossHud != nil {
            return locale == .ja ? "ボス戦" : "Boss"
        }
        let totalSec = max(0, controller.uiSnapshot.remainingSecondsCoarse)
        return String(format: "%02d:%02d", totalSec / 60, totalSec % 60)
    }

    var body: some View {
        VStack(spacing: 6) {
            SurvivalHUDTopRow(
                stageName: stage.localizedName(locale),
                timeLabel: timeLabel,
                enemiesDefeated: controller.uiSnapshot.enemiesDefeated,
                enemyQuota: SurvivalConstants.stageEnemyQuota,
                isBossBattle: controller.bossHud != nil,
                hintMode: controller.uiSnapshot.hintMode,
                isPaused: controller.isPaused,
                locale: locale,
                onTogglePause: { controller.togglePause() }
            )
            .equatable()

            if !controller.uiSnapshot.statusEffectStrip.isEmpty || controller.uiSnapshot.hintMode {
                SurvivalHUDStatusStrip(effects: controller.uiSnapshot.statusEffectStrip.map {
                    .init(id: $0.id, icon: $0.icon, level: $0.level)
                })
                .equatable()
            }

            if let bossRatio = bossHpRatio {
                SurvivalHUDBossHpBar(
                    ratio: bossRatio,
                    hp: controller.uiSnapshot.hp,
                    maxHp: controller.uiSnapshot.maxHp,
                    hpRatio: hpRatio,
                    locale: locale
                )
                .equatable()
            } else {
                SurvivalHUDPlayerHpBar(
                    hp: controller.uiSnapshot.hp,
                    maxHp: controller.uiSnapshot.maxHp,
                    ratio: hpRatio
                )
                .equatable()
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
}

// MARK: - サブビュー (Equatable で差分更新)

private struct SurvivalHUDTopRow: View, Equatable {
    let stageName: String
    let timeLabel: String
    let enemiesDefeated: Int
    let enemyQuota: Int
    let isBossBattle: Bool
    let hintMode: Bool
    let isPaused: Bool
    let locale: AppLocale
    /// クロージャは Equatable できないため比較から除外する。
    let onTogglePause: () -> Void

    static func == (lhs: SurvivalHUDTopRow, rhs: SurvivalHUDTopRow) -> Bool {
        lhs.stageName == rhs.stageName &&
            lhs.timeLabel == rhs.timeLabel &&
            lhs.enemiesDefeated == rhs.enemiesDefeated &&
            lhs.enemyQuota == rhs.enemyQuota &&
            lhs.isBossBattle == rhs.isBossBattle &&
            lhs.hintMode == rhs.hintMode &&
            lhs.isPaused == rhs.isPaused &&
            lhs.locale == rhs.locale
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(stageName)
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                HStack(spacing: 10) {
                    Label(timeLabel, systemImage: "clock.fill")
                        .font(.caption2)
                        .foregroundStyle(.yellow)
                    if !isBossBattle {
                        Label(
                            "\(enemiesDefeated) / \(enemyQuota)",
                            systemImage: "bolt.fill"
                        )
                        .font(.caption2)
                        .foregroundStyle(.cyan)
                    }
                }
            }
            Spacer()
            if hintMode {
                Text(locale == .ja ? "ヒント ON" : "HINT ON")
                    .font(.caption2.bold())
                    .foregroundStyle(.black)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.yellow)
                    .clipShape(Capsule())
            }
            Button(action: onTogglePause) {
                Image(systemName: isPaused ? "play.fill" : "pause.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(Color.white.opacity(0.12))
                    .clipShape(Circle())
            }
        }
    }
}

private struct SurvivalHUDStatusStrip: View, Equatable {
    struct Effect: Equatable, Identifiable {
        let id: UUID
        let icon: String
        let level: Int
    }
    let effects: [Effect]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(effects) { effect in
                HStack(spacing: 3) {
                    Image(systemName: effect.icon)
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
}

private struct SurvivalHUDPlayerHpBar: View, Equatable {
    let hp: Int
    let maxHp: Int
    let ratio: CGFloat

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.white.opacity(0.2))
                Capsule()
                    .fill(Self.hpColor(for: ratio))
                    .frame(width: geo.size.width * max(0, min(1, ratio)))
                HStack {
                    Text("HP \(hp) / \(maxHp)")
                        .font(.caption2.bold())
                        .foregroundStyle(.white)
                        .padding(.leading, 10)
                    Spacer()
                }
            }
        }
        .frame(height: 18)
    }

    static func hpColor(for ratio: CGFloat) -> LinearGradient {
        if ratio < 0.25 {
            return LinearGradient(
                colors: [Color.red, Color(red: 0.9, green: 0.25, blue: 0.25)],
                startPoint: .leading,
                endPoint: .trailing
            )
        }
        if ratio < 0.5 {
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
}

private struct SurvivalHUDBossHpBar: View, Equatable {
    let ratio: CGFloat
    let hp: Int
    let maxHp: Int
    let hpRatio: CGFloat
    let locale: AppLocale

    var body: some View {
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
            SurvivalHUDPlayerHpBar(hp: hp, maxHp: maxHp, ratio: hpRatio)
                .equatable()
        }
    }
}
