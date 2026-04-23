import SwiftUI

/// クリア / ゲームオーバー モーダル。WEB 版 `SurvivalGameOver.tsx` 準拠。
/// 表示項目:
/// - ステージ名 (日本語/英語)
/// - 結果タイトル (クリア/失敗)
/// - 生存時間 / 撃破数 / 残 HP / 獲得 EXP
/// - ヒントモード時の注記 (記録されない旨)
/// - リトライ / マップへ戻る
struct SurvivalGameResultView: View {
    let isCleared: Bool
    let stage: SurvivalStageDefinition
    let enemiesDefeated: Int
    let elapsedSeconds: Int
    let totalExp: Int
    let playerHp: Int
    let playerMaxHp: Int
    let hintMode: Bool
    let isBossStage: Bool
    let locale: AppLocale
    let clearReportInFlight: Bool
    let clearReportError: String?
    let onRetry: () -> Void
    let onExit: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            header

            VStack(spacing: 8) {
                resultRow(label: locale == .ja ? "ステージ" : "Stage", value: stage.localizedName(locale))
                // ボス戦は 1 体撃破なので撃破数表示を省略する
                if !isBossStage {
                    resultRow(label: locale == .ja ? "撃破数" : "Enemies", value: "\(enemiesDefeated) / \(SurvivalConstants.stageEnemyQuota)")
                }
                resultRow(label: locale == .ja ? "生存時間" : "Survived", value: timeLabel)
                resultRow(label: "HP", value: "\(playerHp) / \(playerMaxHp)")
                if totalExp > 0 {
                    resultRow(label: "EXP", value: String(totalExp))
                }
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

            VStack(spacing: 10) {
                Button(action: onRetry) {
                    Text(locale == .ja ? "リトライ" : "Retry")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.purple)
                        .cornerRadius(10)
                }
                Button(action: onExit) {
                    Text(locale == .ja ? "マップに戻る" : "Back to Map")
                        .font(.headline)
                        .foregroundStyle(.purple)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.white)
                        .cornerRadius(10)
                }
            }
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

    private var header: some View {
        VStack(spacing: 6) {
            Image(systemName: isCleared ? "trophy.fill" : "xmark.octagon.fill")
                .font(.system(size: 36))
                .foregroundStyle(isCleared ? Color.yellow : Color.red)
            Text(title)
                .font(.title.bold())
                .foregroundStyle(.white)
        }
    }

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

    private var title: String {
        if isCleared {
            return locale == .ja ? "ステージクリア!" : "Stage Clear!"
        }
        return locale == .ja ? "ゲームオーバー" : "Game Over"
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
