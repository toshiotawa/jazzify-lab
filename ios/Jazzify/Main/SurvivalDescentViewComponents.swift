import SwiftUI

/// 魔王城降下マップ ネイティブ版の描画パーツ。
///
/// 最小構成として SF Symbols と図形描画でビジュアルを作る。画像アセット (`background.webp` / `door.webp` /
/// キャラクター) の移植は後続タスク。

// MARK: - Background

/// マップの縦長背景 (石壁風グラデ＋薄いバンド)
struct SurvivalDescentBackgroundView: View {
    let widthPx: CGFloat
    let heightPx: CGFloat

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: "1b1228"),
                    Color(hex: "0d0818"),
                    Color(hex: "050309"),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            // 縦方向の淡いバンド (石積み感)
            VStack(spacing: 0) {
                ForEach(0..<max(1, Int(heightPx / 160)), id: \.self) { index in
                    Rectangle()
                        .fill(
                            index.isMultiple(of: 2)
                                ? Color.white.opacity(0.02)
                                : Color.black.opacity(0.08)
                        )
                        .frame(height: 160)
                }
            }
            // 左右の暗い縁 (奥行き)
            HStack(spacing: 0) {
                LinearGradient(
                    colors: [Color.black.opacity(0.55), Color.clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: 60)
                Spacer()
                LinearGradient(
                    colors: [Color.clear, Color.black.opacity(0.55)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: 60)
            }
        }
        .frame(width: widthPx, height: heightPx)
        .allowsHitTesting(false)
    }
}

// MARK: - Block header

struct SurvivalDescentBlockHeaderPlate: View {
    let label: String
    let difficulty: SurvivalDifficulty
    let blockIndex: Int
    let locked: Bool
    let widthPx: CGFloat
    let yPx: CGFloat

    private var difficultyColor: Color {
        switch difficulty {
        case .easy: return .green
        case .normal: return .blue
        case .hard: return .orange
        case .extreme: return .red
        }
    }

    var body: some View {
        HStack(spacing: 8) {
            Text("F\(blockIndex + 1)")
                .font(.caption2.bold())
                .foregroundStyle(Color(hex: "fde68a"))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Color.black.opacity(0.55))
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(Color.amber(with: 0.45), lineWidth: 1)
                )
                .cornerRadius(4)
            Text(label)
                .font(.subheadline.bold())
                .foregroundStyle(.white)
                .lineLimit(1)
            Spacer(minLength: 0)
            RoundedRectangle(cornerRadius: 4)
                .fill(difficultyColor.opacity(0.25))
                .overlay(
                    Text(localizedDifficulty(difficulty))
                        .font(.caption2.bold())
                        .foregroundStyle(difficultyColor)
                        .padding(.horizontal, 6)
                )
                .frame(width: 72, height: 18)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 6)
        .frame(width: min(widthPx - 24, 420))
        .background(
            LinearGradient(
                colors: [
                    Color(hex: "1e1333").opacity(locked ? 0.6 : 0.95),
                    Color(hex: "0c0820").opacity(locked ? 0.6 : 0.95),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.amber(with: 0.35), lineWidth: 1)
        )
        .cornerRadius(8)
        .shadow(color: .black.opacity(0.5), radius: 6, x: 0, y: 3)
        .opacity(locked ? 0.55 : 1)
        .position(x: widthPx / 2, y: yPx)
    }

    private func localizedDifficulty(_ d: SurvivalDifficulty) -> String {
        switch d {
        case .easy: return "EASY"
        case .normal: return "NORMAL"
        case .hard: return "HARD"
        case .extreme: return "EXTREME"
        }
    }
}

// MARK: - Stage node

/// 踊り場 + ステージ番号バッジ。タップで親に通知する。
struct SurvivalDescentStageNode: View {
    let stage: SurvivalDescentStagePosition
    let isCurrent: Bool
    let isCleared: Bool
    let isUnlocked: Bool
    let isSelected: Bool
    let requiresPremium: Bool
    let isMixed: Bool
    let dim: Bool
    let scale: CGFloat
    let onTap: () -> Void

    private var landingSize: CGSize {
        switch stage.landingType {
        case .small:
            return CGSize(width: 120 * scale, height: 46 * scale)
        case .big:
            return CGSize(width: 180 * scale, height: 70 * scale)
        }
    }

    var body: some View {
        Button(action: onTap) {
            ZStack {
                // 踊り場 (奥行きのある石ブロック)
                RoundedRectangle(cornerRadius: 10 * scale)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(hex: "3a2b5c"),
                                Color(hex: "1f1636"),
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10 * scale)
                            .stroke(borderColor, lineWidth: isSelected ? 2 : 1)
                    )
                    .shadow(color: .black.opacity(0.5), radius: 6, x: 0, y: 4)
                    .frame(width: landingSize.width, height: landingSize.height)

                VStack(spacing: 2 * scale) {
                    HStack(spacing: 4 * scale) {
                        Text("\(stage.stageNumber)")
                            .font(.system(size: 12 * scale, weight: .bold))
                            .foregroundStyle(.white)
                        statusIcon
                    }
                    if isMixed {
                        Text("MIX")
                            .font(.system(size: 8 * scale, weight: .bold))
                            .foregroundStyle(.yellow)
                    }
                }
            }
            .opacity(dim ? 0.55 : 1)
        }
        .buttonStyle(.plain)
        .position(x: stage.x * scale, y: stage.y * scale)
    }

    private var borderColor: Color {
        if isSelected { return Color(hex: "fde68a") }
        if isCurrent { return Color(hex: "fca5a5") }
        if isCleared { return Color.green.opacity(0.8) }
        if !isUnlocked { return Color.white.opacity(0.18) }
        return Color(hex: "a78bfa").opacity(0.6)
    }

    @ViewBuilder
    private var statusIcon: some View {
        if requiresPremium {
            Image(systemName: "crown.fill")
                .font(.system(size: 9 * scale, weight: .bold))
                .foregroundStyle(.yellow)
        } else if isCleared {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 9 * scale, weight: .bold))
                .foregroundStyle(.green)
        } else if !isUnlocked {
            Image(systemName: "lock.fill")
                .font(.system(size: 9 * scale, weight: .bold))
                .foregroundStyle(.gray)
        } else if isCurrent {
            Image(systemName: "flame.fill")
                .font(.system(size: 9 * scale, weight: .bold))
                .foregroundStyle(.orange)
        } else {
            EmptyView()
        }
    }
}

// MARK: - Door

/// ブロック境界に置く扉
struct SurvivalDescentDoorView: View {
    let widthPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let locked: Bool

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 6 * scale)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(hex: "4a2d14"),
                            Color(hex: "26160a"),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: 64 * scale, height: 96 * scale)
                .overlay(
                    RoundedRectangle(cornerRadius: 6 * scale)
                        .stroke(Color.amber(with: 0.55), lineWidth: 1.5)
                )
            Circle()
                .fill(Color(hex: "fde68a"))
                .frame(width: 6 * scale, height: 6 * scale)
                .offset(x: 14 * scale)
            if locked {
                Image(systemName: "lock.fill")
                    .font(.system(size: 20 * scale, weight: .bold))
                    .foregroundStyle(Color.black.opacity(0.7))
            }
        }
        .shadow(color: .black.opacity(0.5), radius: 6, x: 0, y: 4)
        .position(x: widthPx / 2, y: yPx * scale)
        .allowsHitTesting(false)
    }
}

// MARK: - Character

struct SurvivalDescentCharacterView: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat

    var body: some View {
        VStack(spacing: 0) {
            Image(systemName: "figure.walk.circle.fill")
                .font(.system(size: 26 * scale, weight: .bold))
                .foregroundStyle(Color(hex: "fde68a"))
                .shadow(color: .orange.opacity(0.6), radius: 5)
            Image(systemName: "triangle.fill")
                .resizable()
                .frame(width: 6 * scale, height: 4 * scale)
                .foregroundStyle(.yellow.opacity(0.7))
                .rotationEffect(.degrees(180))
        }
        .position(x: xPx, y: yPx - 18 * scale)
        .allowsHitTesting(false)
    }
}

// MARK: - Dim Veil

struct SurvivalDescentDimVeil: View {
    let startY: CGFloat
    let endY: CGFloat
    let widthPx: CGFloat
    let scale: CGFloat

    var body: some View {
        let height = (endY - startY) * scale
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [
                        Color.black.opacity(0.78),
                        Color.black.opacity(0.55),
                        Color.black.opacity(0.78),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .frame(width: widthPx, height: height)
            .position(x: widthPx / 2, y: (startY + endY) / 2 * scale)
            .allowsHitTesting(false)
    }
}

// MARK: - Color helper

private extension Color {
    static func amber(with opacity: Double) -> Color {
        Color(hex: "f59e0b").opacity(opacity)
    }
}
