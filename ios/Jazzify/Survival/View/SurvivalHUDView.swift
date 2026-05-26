import SwiftUI

/// HUD の高さを楽譜オーバーレイへ伝播する。
struct SurvivalHUDHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

/// 画面上部 HUD: 残り時間・撃破数・プレイヤー HP バー・終了ボタン・ボス HP バー (ボス戦のみ)
/// WEB 版 `SurvivalGameOverlay` 準拠 (HP を緑/黄/赤で色分け、状態アイコンを横並び、ヒントバッジ)
///
/// パフォーマンス最適化:
/// 親が `ObservableObject` を購読しても、各サブビューは `Equatable` な値型のみ受け取り `.equatable()` で差分比較する。
struct SurvivalHUDView: View {
    let uiSnapshot: SurvivalUISnapshot
    let bossHud: SurvivalBossHUDSnapshot?
    let isPaused: Bool
    let stage: SurvivalStageDefinition
    let enemyQuotaOverride: Int?
    let locale: AppLocale
    let onTogglePause: () -> Void

    private var hpRatio: CGFloat {
        CGFloat(uiSnapshot.hp) / CGFloat(max(1, uiSnapshot.maxHp))
    }

    private var bossHpRatio: CGFloat? {
        bossHud?.hpRatio
    }

    private var timeLabel: String {
        if bossHud != nil {
            return locale == .ja ? "ボス戦" : "Boss"
        }
        let totalSec = max(0, uiSnapshot.remainingSecondsCoarse)
        return String(format: "%02d:%02d", totalSec / 60, totalSec % 60)
    }

    var body: some View {
        let sc = uiSnapshot.scenario
        if sc.hideHud {
            EmptyView()
        } else {
            VStack(spacing: 6) {
                SurvivalHUDTopRow(
                    stageName: stage.localizedName(locale),
                    timeLabel: timeLabel,
                    enemiesDefeated: uiSnapshot.enemiesDefeated,
                    enemyQuota: enemyQuotaOverride ?? stage.stageKillQuota,
                    isBossBattle: bossHud != nil,
                    hintMode: uiSnapshot.hintMode,
                    isPaused: isPaused,
                    locale: locale,
                    onTogglePause: onTogglePause,
                    showStageTitle: !sc.hideStageTitle,
                    showTimer: !sc.hideTimerDisplay,
                    showKillCounter: !sc.hideKillCounter,
                    showHintBadge: !sc.hideHintBadge,
                    showPauseButton: !sc.hidePauseButton
                )
                .equatable()

                if !sc.hideStatusStrip, !uiSnapshot.statusEffectStrip.isEmpty || uiSnapshot.hintMode {
                    SurvivalHUDStatusStrip(effects: uiSnapshot.statusEffectStrip.map {
                        .init(id: $0.id, icon: $0.icon, level: $0.level)
                    })
                    .equatable()
                }

                if !sc.hidePlayerHpBar {
                    if let bossRatio = bossHpRatio {
                        SurvivalHUDBossHpBar(
                            ratio: bossRatio,
                            hp: uiSnapshot.hp,
                            maxHp: uiSnapshot.maxHp,
                            hpRatio: hpRatio,
                            locale: locale
                        )
                        .equatable()
                    } else {
                        SurvivalHUDPlayerHpBar(
                            hp: uiSnapshot.hp,
                            maxHp: uiSnapshot.maxHp,
                            ratio: hpRatio
                        )
                        .equatable()
                    }
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
            .background(
                GeometryReader { proxy in
                    Color.clear.preference(key: SurvivalHUDHeightKey.self, value: proxy.size.height)
                }
            )
        }
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
    let onTogglePause: () -> Void
    var showStageTitle: Bool = true
    var showTimer: Bool = true
    var showKillCounter: Bool = true
    var showHintBadge: Bool = true
    var showPauseButton: Bool = true

    static func == (lhs: SurvivalHUDTopRow, rhs: SurvivalHUDTopRow) -> Bool {
        lhs.stageName == rhs.stageName &&
            lhs.timeLabel == rhs.timeLabel &&
            lhs.enemiesDefeated == rhs.enemiesDefeated &&
            lhs.enemyQuota == rhs.enemyQuota &&
            lhs.isBossBattle == rhs.isBossBattle &&
            lhs.hintMode == rhs.hintMode &&
            lhs.isPaused == rhs.isPaused &&
            lhs.locale == rhs.locale &&
            lhs.showStageTitle == rhs.showStageTitle &&
            lhs.showTimer == rhs.showTimer &&
            lhs.showKillCounter == rhs.showKillCounter &&
            lhs.showHintBadge == rhs.showHintBadge &&
            lhs.showPauseButton == rhs.showPauseButton
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                if showStageTitle {
                    Text(stageName)
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                }
                HStack(spacing: 10) {
                    if showTimer {
                        Label(timeLabel, systemImage: "clock.fill")
                            .font(.caption2)
                            .foregroundStyle(.yellow)
                    }
                    if showKillCounter, !isBossBattle {
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
            if showHintBadge, hintMode {
                Text(locale == .ja ? "ヒント ON" : "HINT ON")
                    .font(.caption2.bold())
                    .foregroundStyle(.black)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.yellow)
                    .clipShape(Capsule())
            }
            if showPauseButton {
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
