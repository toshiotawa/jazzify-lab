import SwiftUI

/// フレーズディフェンス降下マップの情報パネル（BGM / ヒント / プレビューなし）。
struct DefenseDescentSidePanel: View {
    let locale: AppLocale
    let totalClearedCount: Int
    let totalStageNodes: Int
    let activeBlock: DefenseDescentBlockLayout?
    let blockClearedCount: Int
    let selectedNode: PlayMapNode?
    let selectedNodeCleared: Bool
    let selectedNodeUnlocked: Bool
    let bestSurviveSec: Int?
    let startLocked: Bool
    let onStart: () -> Void
    let onRequestUpgrade: () -> Void

    private var isEnglishCopy: Bool { locale == .en }

    private var totalProgressPct: Int {
        Int((Double(totalClearedCount) / Double(max(1, totalStageNodes)) * 100).rounded())
    }

    private var blockStageCount: Int {
        guard let activeBlock else { return 0 }
        return activeBlock.nodes.filter { $0.node.nodeKind == .stage }.count
    }

    private var blockProgressPct: Int {
        guard blockStageCount > 0 else { return 0 }
        return Int((Double(blockClearedCount) / Double(blockStageCount) * 100).rounded())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                totalProgressCard
                if let activeBlock {
                    blockProgressCard(activeBlock)
                }
                selectedNodeCard
            }
            .padding(18)
        }
        .background(panelBackground)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.yellow.opacity(0.18), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var totalProgressCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(isEnglishCopy ? "PHRASE DEFENSE" : "フレーズディフェンス")
                .font(.system(size: 10, weight: .bold))
                .tracking(2)
                .foregroundStyle(Color.yellow.opacity(0.7))
            Text(isEnglishCopy ? "Castle Descent" : "魔王城降下")
                .font(.title3.bold())
                .foregroundStyle(Color(hex: "fde68a"))
            Text(totalProgressText)
                .font(.caption)
                .foregroundStyle(.gray)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.black.opacity(0.3))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func blockProgressCard(_ block: DefenseDescentBlockLayout) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(block.localizedLabel(locale))
                .font(.subheadline.bold())
                .foregroundStyle(Color.yellow.opacity(0.85))
            Text(blockProgressText)
                .font(.caption)
                .foregroundStyle(.gray)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.black.opacity(0.3))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    @ViewBuilder
    private var selectedNodeCard: some View {
        if let selectedNode {
            VStack(alignment: .leading, spacing: 12) {
                Text(selectedNode.localizedTitle(locale))
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                nodeStatusRow
                if let bestSurviveSec {
                    Text(bestSurviveText(bestSurviveSec))
                        .font(.caption)
                        .foregroundStyle(.green)
                }
                startButton
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.black.opacity(0.35))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.yellow.opacity(0.2), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
        } else {
            Text(isEnglishCopy
                 ? "Tap a node on the map to view details."
                 : "マップのノードをタップすると詳細が表示されます。")
                .font(.caption)
                .foregroundStyle(.gray)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    @ViewBuilder
    private var nodeStatusRow: some View {
        if selectedNodeCleared {
            Label(
                isEnglishCopy ? "Cleared" : "クリア済み",
                systemImage: "checkmark.circle.fill"
            )
            .font(.caption)
            .foregroundStyle(.green)
        } else if selectedNodeUnlocked {
            Text(isEnglishCopy ? "Ready to play" : "プレイ可能")
                .font(.caption)
                .foregroundStyle(.gray)
        } else {
            Label(
                isEnglishCopy ? "Locked" : "ロック中",
                systemImage: "lock.fill"
            )
            .font(.caption)
            .foregroundStyle(.gray)
        }
    }

    @ViewBuilder
    private var startButton: some View {
        if startLocked {
            Button(isEnglishCopy ? "Upgrade to unlock" : "アップグレードして解放") {
                onRequestUpgrade()
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
        } else {
            Button(isEnglishCopy ? "Start" : "開始") {
                onStart()
            }
            .buttonStyle(.borderedProminent)
            .tint(.indigo)
            .disabled(!selectedNodeUnlocked)
        }
    }

    private var panelBackground: LinearGradient {
        LinearGradient(
            colors: [
                Color(red: 20 / 255, green: 12 / 255, blue: 31 / 255).opacity(0.9),
                Color(red: 6 / 255, green: 4 / 255, blue: 16 / 255).opacity(0.95),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    private var totalProgressText: String {
        if isEnglishCopy {
            return "Total progress: \(totalClearedCount)/\(totalStageNodes) (\(totalProgressPct)%)"
        }
        return "全体進捗: \(totalClearedCount)/\(totalStageNodes) (\(totalProgressPct)%)"
    }

    private var blockProgressText: String {
        if isEnglishCopy {
            return "Block progress: \(blockClearedCount)/\(blockStageCount) (\(blockProgressPct)%)"
        }
        return "ブロック進捗: \(blockClearedCount)/\(blockStageCount) (\(blockProgressPct)%)"
    }

    private func bestSurviveText(_ seconds: Int) -> String {
        isEnglishCopy ? "Best survive: \(seconds)s" : "ベスト生存: \(seconds)秒"
    }
}

private extension DefenseDescentBlockLayout {
    func localizedLabel(_ locale: AppLocale) -> String {
        locale == .en ? (labelEn.isEmpty ? label : labelEn) : label
    }
}
