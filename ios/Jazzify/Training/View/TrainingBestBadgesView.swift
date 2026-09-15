import SwiftUI

struct TrainingBestBadgesView: View {
    let bestScore: Int
    let bestRank: TrainingLetterRank
    let rankPosition: Int?
    let targetRank: TrainingLetterRank?
    let cleared: Bool
    let locale: AppLocale
    let compact: Bool

    init(
        bestScore: Int,
        bestRank: TrainingLetterRank,
        rankPosition: Int? = nil,
        targetRank: TrainingLetterRank? = nil,
        cleared: Bool = false,
        locale: AppLocale,
        compact: Bool = false
    ) {
        self.bestScore = bestScore
        self.bestRank = bestRank
        self.rankPosition = rankPosition
        self.targetRank = targetRank
        self.cleared = cleared
        self.locale = locale
        self.compact = compact
    }

    var body: some View {
        HStack(spacing: compact ? 6 : 8) {
            scoreBadge
            Text("/")
                .font(compact ? .caption : .subheadline)
                .foregroundStyle(.secondary)
            rankBadge
            if let rankPosition {
                Text("/")
                    .font(compact ? .caption : .subheadline)
                    .foregroundStyle(.secondary)
                Text(locale == .ja ? "\(rankPosition)位" : "#\(rankPosition)")
                    .font(compact ? .caption.weight(.semibold) : .subheadline.weight(.semibold))
                    .foregroundStyle(Color.indigo.opacity(0.85))
                    .monospacedDigit()
            }
            if let targetRank {
                Text("·")
                    .foregroundStyle(.secondary)
                Text(locale == .ja ? "目標" : "Target")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                rankLabel(targetRank)
                if cleared {
                    Text(locale == .ja ? "· クリア" : "· Cleared")
                        .font(.caption)
                        .foregroundStyle(.green)
                }
            }
        }
        .fixedSize(horizontal: false, vertical: true)
    }

    private var scoreBadge: some View {
        HStack(spacing: 4) {
            Text(locale == .ja ? "ハイスコア" : "High score")
                .font(.caption2.weight(.medium))
                .foregroundStyle(.secondary)
            Text("\(bestScore)")
                .font(compact ? .subheadline.weight(.bold) : .headline.weight(.bold))
                .foregroundStyle(.primary)
                .monospacedDigit()
        }
    }

    private var rankBadge: some View {
        HStack(spacing: 4) {
            Text(locale == .ja ? "最高ランク" : "Best rank")
                .font(.caption2.weight(.medium))
                .foregroundStyle(.secondary)
            rankLabel(bestRank)
        }
    }

    private func rankLabel(_ rank: TrainingLetterRank) -> some View {
        Text(rank.rawValue)
            .font(compact ? .subheadline.weight(.bold) : .headline.weight(.bold))
            .foregroundStyle(rankForeground(rank))
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(rankBackground(rank))
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(rankBorder(rank), lineWidth: 1)
            )
    }

    private func rankForeground(_ rank: TrainingLetterRank) -> Color {
        switch rank {
        case .S: return Color(hex: "fde68a")
        case .A: return Color(hex: "ddd6fe")
        case .B: return Color(hex: "bae6fd")
        case .C: return Color(hex: "a7f3d0")
        default: return Color(hex: "e2e8f0")
        }
    }

    private func rankBackground(_ rank: TrainingLetterRank) -> Color {
        switch rank {
        case .S: return Color(hex: "f59e0b").opacity(0.2)
        case .A: return Color(hex: "8b5cf6").opacity(0.2)
        case .B: return Color(hex: "0ea5e9").opacity(0.2)
        case .C: return Color(hex: "10b981").opacity(0.2)
        default: return Color(hex: "64748b").opacity(0.25)
        }
    }

    private func rankBorder(_ rank: TrainingLetterRank) -> Color {
        switch rank {
        case .S: return Color(hex: "fbbf24").opacity(0.5)
        case .A: return Color(hex: "a78bfa").opacity(0.5)
        case .B: return Color(hex: "38bdf8").opacity(0.5)
        case .C: return Color(hex: "34d399").opacity(0.5)
        default: return Color(hex: "94a3b8").opacity(0.5)
        }
    }
}
