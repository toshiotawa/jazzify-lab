import SwiftUI

/// クリア / ゲームオーバー モーダル。
///
/// 表示項目:
/// - ステージ名 (日本語/英語)
/// - 結果タイトル (クリア / HINT クリア / ゲームオーバー)
/// - 撃破数 (通常ステージのみ) / 生存時間 / HP
/// - HINT モード時は「クリア記録に反映されない」旨の注記
///
/// アクションボタンはクリア / ゲームオーバーのいずれでも共通で
/// [リトライ] + [マップに戻る] の 2 つのみを表示する。
/// (ヒント切り替えや次ステージ遷移はマップ画面側で行う想定)
struct SurvivalGameResultView: View {
    let isCleared: Bool
    let stage: SurvivalStageDefinition
    let enemiesDefeated: Int
    var enemiesDefeatedQuota: Int?
    var enemiesDefeatedLabel: String?
    let elapsedSeconds: Int
    let playerHp: Int
    let playerMaxHp: Int
    let hintMode: Bool
    let isBossStage: Bool
    let locale: AppLocale
    let clearReportInFlight: Bool
    let clearReportError: String?
    /// デモプレイ中は「タイトルに戻る」表記にする。
    var isDemo: Bool = false
    /// 「リトライ」: 同ステージ・同 hintMode で再起動する。
    let onRetry: () -> Void
    /// 「マップに戻る」(または「タイトルに戻る"): ゲーム画面を閉じる。
    let onExit: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            header

            VStack(spacing: 8) {
                resultRow(label: locale == .ja ? "ステージ" : "Stage", value: stage.localizedName(locale))
                // ボス戦は 1 体撃破なので撃破数表示を省略する
                if !isBossStage {
                    let quota = enemiesDefeatedQuota ?? stage.stageKillQuota
                    let label = enemiesDefeatedLabel ?? (locale == .ja ? "撃破数" : "Enemies")
                    resultRow(label: label, value: "\(enemiesDefeated) / \(quota)")
                }
                resultRow(label: locale == .ja ? "生存時間" : "Survived", value: timeLabel)
                resultRow(label: "HP", value: "\(playerHp) / \(playerMaxHp)")
            }

            if hintMode {
                Text(locale == .ja
                     ? "ヒントモード中のためクリア記録は保存されません"
                     : "Hint mode: clear record will not be saved")
                    .font(.caption)
                    .foregroundStyle(.yellow)
                    .multilineTextAlignment(.center)
            } else if isCleared {
                saveStatusView
            }

            actionButtons
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(red: 0.08, green: 0.06, blue: 0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isCleared ? Color.yellow.opacity(0.7) : Color.red.opacity(0.7), lineWidth: 2)
                )
        )
        .padding(32)
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 6) {
            Image(systemName: isCleared ? "trophy.fill" : "xmark.octagon.fill")
                .font(.system(size: 36))
                .foregroundStyle(headerIconColor)
            Text(title)
                .font(.title.bold())
                .foregroundStyle(.white)
        }
    }

    private var headerIconColor: Color {
        if isCleared {
            // HINT クリアは黄色系で警告ニュアンスを残す
            return hintMode ? Color.yellow : Color.green
        }
        return Color.red
    }

    private var title: String {
        if isCleared {
            return locale == .ja ? "ステージクリア!" : "Stage Clear!"
        }
        return locale == .ja ? "ゲームオーバー" : "Game Over"
    }

    // MARK: - Save status

    @ViewBuilder
    private var saveStatusView: some View {
        if clearReportInFlight {
            HStack(spacing: 8) {
                ProgressView().tint(.white)
                Text(locale == .ja ? "進捗を保存中..." : "Saving progress...")
                    .font(.caption)
                    .foregroundStyle(.white)
            }
        } else if let error = clearReportError {
            Text(error)
                .font(.caption)
                .foregroundStyle(.red)
                .multilineTextAlignment(.center)
        } else {
            Text(locale == .ja ? "クリア記録を保存しました" : "Clear record saved")
                .font(.caption)
                .foregroundStyle(.green)
        }
    }

    // MARK: - Action buttons

    @ViewBuilder
    private var actionButtons: some View {
        VStack(spacing: 10) {
            primaryButton(
                label: locale == .ja ? "リトライ" : "Retry",
                background: isCleared ? Color.green : Color.red,
                action: onRetry
            )

            secondaryButton(
                label: exitLabel,
                action: onExit
            )
        }
    }

    private func primaryButton(
        label: String,
        background: Color,
        textColor: Color = .white,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(label)
                .font(.headline)
                .foregroundStyle(textColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(background)
                .cornerRadius(10)
        }
    }

    private func secondaryButton(
        label: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(label)
                .font(.headline)
                .foregroundStyle(.purple)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.white)
                .cornerRadius(10)
        }
    }

    // MARK: - Helpers

    /// デモ中はマップ画面へ戻れないため、タイトル画面への遷移として表示する。
    private var exitLabel: String {
        if isDemo {
            return locale == .ja ? "タイトルに戻る" : "Back to Title"
        }
        return locale == .ja ? "マップに戻る" : "Back to Map"
    }

    private var timeLabel: String {
        String(format: "%02d:%02d", elapsedSeconds / 60, elapsedSeconds % 60)
    }

    private func resultRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
            Spacer()
            Text(value)
                .font(.caption.bold())
                .foregroundStyle(.white)
        }
    }
}
