import SwiftUI

/// 魔王城降下マップ ネイティブ版の描画パーツ。
/// Web 版 (`src/components/survival/descent/parts/*`) を SwiftUI の図形描画で再現する。
/// 画像アセットは持ち込まず、すべて Shape + Gradient + Canvas で描画する。

// MARK: - Background

/// マップの縦長背景。石壁風グラデ＋うっすらレンガ目地＋左右の暗い縁。
struct SurvivalDescentBackgroundView: View {
    let widthPx: CGFloat
    let heightPx: CGFloat

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: "0b0616"),
                    Color(hex: "1a0f2c"),
                    Color(hex: "0a0514"),
                    Color(hex: "050308"),
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            // レンガ目地っぽい横帯
            VStack(spacing: 0) {
                ForEach(0..<max(1, Int(heightPx / 90)), id: \.self) { index in
                    Rectangle()
                        .fill(
                            index.isMultiple(of: 2)
                                ? Color.white.opacity(0.015)
                                : Color.black.opacity(0.14)
                        )
                        .frame(height: 90)
                }
            }
            .allowsHitTesting(false)

            // 中央のぼんやりした縦ライト
            LinearGradient(
                colors: [
                    Color(red: 170 / 255, green: 130 / 255, blue: 220 / 255).opacity(0.05),
                    .clear,
                    Color(red: 255 / 255, green: 180 / 255, blue: 120 / 255).opacity(0.03),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .blendMode(.screen)
            .allowsHitTesting(false)

            // 左右の暗い縁で奥行き感
            HStack(spacing: 0) {
                LinearGradient(
                    colors: [Color.black.opacity(0.55), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: 80)
                Spacer()
                LinearGradient(
                    colors: [.clear, Color.black.opacity(0.55)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: 80)
            }
            .allowsHitTesting(false)
        }
        .frame(width: widthPx, height: heightPx)
        .clipped()
        .allowsHitTesting(false)
    }
}

// MARK: - Block tint overlay

/// ブロック区間にテーマ色をうっすら被せるオーバーレイ
struct SurvivalDescentBlockTintOverlay: View {
    let startY: CGFloat
    let endY: CGFloat
    let widthPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let dim: Bool

    var body: some View {
        let height = max(0, (endY - startY) * scale)
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [theme.tintTop, theme.tintBottom],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .frame(width: widthPx, height: height)
            .position(x: widthPx / 2, y: (startY + endY) / 2 * scale)
            .opacity(dim ? 0.12 : 0.55)
            .blendMode(.screen)
            .allowsHitTesting(false)
    }
}

// MARK: - Block header

/// ブロックヘッダープレート (石版風)
struct SurvivalDescentBlockHeaderPlate: View {
    let label: String
    let depthLabel: String
    let theme: SurvivalDescentBlockTheme
    let locked: Bool
    let cleared: Bool
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat

    var body: some View {
        let width = max(160, 220 * scale)
        let height = max(48, 64 * scale)

        VStack(spacing: 2) {
            Text(depthLabel)
                .font(.system(size: max(8, 10 * scale), weight: .semibold))
                .kerning(2)
                .foregroundStyle(theme.plateText.opacity(0.8))
            Text(label)
                .font(.system(size: max(14, 20 * scale), weight: .bold))
                .foregroundStyle(theme.plateText)
                .shadow(color: .black.opacity(0.55), radius: 1, x: 0, y: 1)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(width: width, height: height)
        .background(
            LinearGradient(
                colors: [theme.plateTop, theme.plateBottom],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(
                    cleared ? theme.plateClearedGlow : theme.plateBorder,
                    lineWidth: cleared ? 1.6 : 1.0
                )
        )
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .shadow(
            color: cleared ? theme.plateClearedGlow.opacity(0.6) : Color.black.opacity(0.6),
            radius: cleared ? 10 : 6,
            x: 0,
            y: 3
        )
        .opacity(locked ? 0.45 : 1.0)
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
    }
}

// MARK: - Block lantern (篝火)

/// ブロックヘッダー両脇に置く篝火/提灯
struct SurvivalDescentBlockLantern: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let lit: Bool
    let dim: Bool

    var body: some View {
        let bodyWidth = max(10, 14 * scale)
        let bodyHeight = max(18, 22 * scale)
        let flameHeight = max(14, 18 * scale)

        ZStack(alignment: .center) {
            // 灯火グロー
            if lit, !dim {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [theme.lanternOuter.opacity(0.55), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: max(22, 32 * scale)
                        )
                    )
                    .frame(width: max(44, 64 * scale), height: max(44, 64 * scale))
                    .blendMode(.screen)
            }

            VStack(spacing: 0) {
                // 炎
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [theme.lanternCore, theme.lanternOuter, .clear],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                    .frame(width: bodyWidth * 0.7, height: flameHeight)
                    .opacity(lit && !dim ? 0.95 : 0.35)
                    .blendMode(.screen)
                    .offset(y: bodyHeight * 0.1)

                // ランタン本体
                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "3a2a18"), Color(hex: "1a120a")],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: bodyWidth, height: bodyHeight)
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(theme.plateBorder, lineWidth: 0.8)
                    )
            }
        }
        .opacity(dim ? 0.25 : 1.0)
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
    }
}

// MARK: - Landing platform (踊り場)

/// 石の踊り場。small / big で見た目を変える。
struct SurvivalDescentLandingPlatform: View {
    enum LandingType { case small, big }

    let type: LandingType
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let dim: Bool

    var body: some View {
        let widthLogical: CGFloat = type == .big ? 220 : 124
        let heightLogical: CGFloat = type == .big ? 90 : 56
        let width = widthLogical * scale
        let height = heightLogical * scale

        ZStack {
            // 奥影
            RoundedRectangle(cornerRadius: max(4, 6 * scale))
                .fill(Color.black.opacity(0.55))
                .frame(width: width, height: height)
                .offset(x: 0, y: 6 * scale)
                .blur(radius: 4 * scale)

            // 石ブロック本体
            RoundedRectangle(cornerRadius: max(4, 6 * scale))
                .fill(
                    LinearGradient(
                        colors: [
                            Color(hex: "4a4256"),
                            Color(hex: "2a2338"),
                            Color(hex: "16101f"),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .overlay(
                    // 上面ハイライト
                    LinearGradient(
                        colors: [Color.white.opacity(0.15), .clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: height * 0.35)
                    .offset(y: -height * 0.325)
                    .blendMode(.screen)
                )
                .overlay(
                    // テーマ色のうっすらティント
                    Rectangle()
                        .fill(theme.tintTop)
                        .blendMode(.overlay)
                        .opacity(0.45)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: max(4, 6 * scale))
                        .stroke(theme.plateBorder.opacity(0.55), lineWidth: 0.8)
                )
                .frame(width: width, height: height)
                .shadow(color: .black.opacity(0.45), radius: 5, x: 0, y: 4)

            // 石材の目地 (縦線を 3 本)
            HStack(spacing: width / 3.2) {
                ForEach(0..<2, id: \.self) { _ in
                    Rectangle()
                        .fill(Color.black.opacity(0.28))
                        .frame(width: 1, height: height * 0.72)
                }
            }
            .allowsHitTesting(false)
        }
        .opacity(dim ? 0.45 : 1.0)
        .saturation(dim ? 0.5 : 1.0)
        .frame(width: width, height: height)
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
    }
}

// MARK: - Stair connector (階段コネクタ)

/// 踊り場同士を繋ぐ階段風のポリライン。Web 版 StairConnector と同じ形状。
struct SurvivalDescentStairConnector: View {
    let from: CGPoint
    let to: CGPoint
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let highlighted: Bool
    let dim: Bool

    var body: some View {
        let padX: CGFloat = 20
        let padY: CGFloat = 10
        let minX = min(from.x, to.x) - padX
        let maxX = max(from.x, to.x) + padX
        let width = (maxX - minX) * scale
        let height = (to.y - from.y + padY * 2) * scale

        let localFrom = CGPoint(x: (from.x - minX) * scale, y: padY * scale)
        let localTo = CGPoint(x: (to.x - minX) * scale, y: height - padY * scale)

        let mainStroke: Color = highlighted ? Color(red: 1, green: 218 / 255, blue: 140 / 255) : theme.sealStroke.opacity(0.85)
        let innerStroke: Color = highlighted ? Color(red: 1, green: 248 / 255, blue: 220 / 255).opacity(0.9) : Color(red: 240 / 255, green: 245 / 255, blue: 255 / 255).opacity(0.75)
        let mainWidth = max(4, 7 * scale)
        let shadowWidth = max(8, 12 * scale)
        let innerWidth = max(1.5, 2.6 * scale)

        Canvas { context, _ in
            let path = Self.stepPath(from: localFrom, to: localTo)

            // 影
            context.stroke(
                path,
                with: .color(.black.opacity(0.6)),
                style: StrokeStyle(lineWidth: shadowWidth, lineCap: .round, lineJoin: .round)
            )
            // メイン線 (グロー代わりに外側を太めに)
            if highlighted {
                context.stroke(
                    path,
                    with: .color(mainStroke.opacity(0.35)),
                    style: StrokeStyle(lineWidth: mainWidth + 6 * scale, lineCap: .round, lineJoin: .round)
                )
            }
            context.stroke(
                path,
                with: .color(mainStroke),
                style: StrokeStyle(lineWidth: mainWidth, lineCap: .round, lineJoin: .round)
            )
            // インナー
            context.stroke(
                path,
                with: .color(innerStroke),
                style: StrokeStyle(lineWidth: innerWidth, lineCap: .round, lineJoin: .round)
            )
        }
        .frame(width: width, height: height)
        .opacity(dim ? 0.25 : 1.0)
        .position(
            x: (minX * scale) + width / 2,
            y: (from.y - padY) * scale + height / 2
        )
        .allowsHitTesting(false)
    }

    private static func stepPath(from: CGPoint, to: CGPoint) -> Path {
        let midY = (from.y + to.y) / 2
        let dx = to.x - from.x
        let stepX = from.x + dx * 0.35
        let step2X = from.x + dx * 0.65
        var path = Path()
        path.move(to: from)
        path.addLine(to: CGPoint(x: from.x, y: from.y + 16))
        path.addLine(to: CGPoint(x: stepX, y: from.y + 16))
        path.addLine(to: CGPoint(x: stepX, y: midY))
        path.addLine(to: CGPoint(x: step2X, y: midY))
        path.addLine(to: CGPoint(x: step2X, y: to.y - 16))
        path.addLine(to: CGPoint(x: to.x, y: to.y - 16))
        path.addLine(to: to)
        return path
    }
}

// MARK: - Block seal (大踊り場の封印魔法陣)

struct SurvivalDescentBlockSeal: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let opened: Bool
    let dim: Bool

    var body: some View {
        let size = max(50, 80 * scale)
        ZStack {
            Circle()
                .stroke(theme.sealStroke, lineWidth: 1.2)
                .frame(width: size, height: size)

            Circle()
                .stroke(theme.sealStroke.opacity(0.55), lineWidth: 0.8)
                .frame(width: size * 0.72, height: size * 0.72)

            // 六芒星を回転させて表現
            ZStack {
                Triangle()
                    .stroke(theme.sealStroke.opacity(0.85), lineWidth: 1.2)
                    .frame(width: size * 0.85, height: size * 0.85)
                Triangle()
                    .stroke(theme.sealStroke.opacity(0.85), lineWidth: 1.2)
                    .frame(width: size * 0.85, height: size * 0.85)
                    .rotationEffect(.degrees(180))
            }

            if opened {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [theme.sealGlow.opacity(0.9), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: size * 0.6
                        )
                    )
                    .frame(width: size * 1.3, height: size * 1.3)
                    .blendMode(.screen)
            }
        }
        .frame(width: size, height: size)
        .opacity(dim ? 0.3 : (opened ? 1.0 : 0.75))
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
    }
}

/// 正三角形パス (Seal 用)
private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

// MARK: - Door

/// ブロック境界の扉 (施錠/開放)
struct SurvivalDescentDoorView: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let opened: Bool
    let dim: Bool

    var body: some View {
        let width = max(48, 64 * scale)
        let height = max(70, 96 * scale)

        ZStack {
            // 扉の影 (奥)
            RoundedRectangle(cornerRadius: 4 * scale)
                .fill(Color.black.opacity(0.65))
                .frame(width: width + 6, height: height + 6)
                .blur(radius: 3)

            // 扉本体 (木目風)
            RoundedRectangle(cornerRadius: 4 * scale)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(hex: "5a3620"),
                            Color(hex: "3a210f"),
                            Color(hex: "1e120a"),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: width, height: height)
                .overlay(
                    // 縦の板目
                    HStack(spacing: width / 4) {
                        ForEach(0..<3, id: \.self) { _ in
                            Rectangle()
                                .fill(Color.black.opacity(0.35))
                                .frame(width: 1)
                        }
                    }
                )
                .overlay(
                    // テーマ色オーバーレイ (開放時はより強く)
                    Rectangle()
                        .fill(theme.tintTop)
                        .blendMode(.overlay)
                        .opacity(opened ? 0.7 : 0.3)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 4 * scale)
                        .stroke(
                            opened ? theme.plateClearedGlow : theme.plateBorder.opacity(0.6),
                            lineWidth: opened ? 1.5 : 1.0
                        )
                )

            // ドアノブ
            Circle()
                .fill(Color(hex: "fde68a"))
                .frame(width: 6 * scale, height: 6 * scale)
                .offset(x: width * 0.28)

            // 施錠マーク
            if !opened {
                Image(systemName: "lock.fill")
                    .font(.system(size: max(16, 22 * scale), weight: .bold))
                    .foregroundStyle(Color.black.opacity(0.7))
                    .shadow(color: .white.opacity(0.15), radius: 1)
            }
        }
        .shadow(
            color: opened ? theme.plateClearedGlow.opacity(0.5) : .black.opacity(0.4),
            radius: opened ? 10 : 4
        )
        .opacity(dim ? 0.35 : 1.0)
        .saturation(dim ? 0.4 : 1.0)
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
    }
}

// MARK: - Stage node

/// ステージ番号ノード (踊り場の上に乗せる丸バッジ)
struct SurvivalDescentStageNode: View {
    let stageNumber: Int
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let isCurrent: Bool
    let isCleared: Bool
    let isUnlocked: Bool
    let isSelected: Bool
    let requiresPremium: Bool
    let isMixed: Bool
    let dim: Bool
    let onTap: () -> Void

    var body: some View {
        let diameter = max(40, 52 * scale)

        ZStack {
            if isCurrent && !dim {
                Circle()
                    .stroke(Color(red: 1, green: 214 / 255, blue: 96 / 255).opacity(0.55), lineWidth: 2)
                    .frame(width: diameter * 1.55, height: diameter * 1.55)
                    .shadow(color: Color(red: 1, green: 196 / 255, blue: 80 / 255).opacity(0.5), radius: 8)
            }

            Button(action: onTap) {
                ZStack {
                    Circle()
                        .fill(fillGradient)
                        .frame(width: diameter, height: diameter)

                    Circle()
                        .stroke(borderColor, lineWidth: isSelected ? 3 : 2)
                        .frame(width: diameter, height: diameter)

                    VStack(spacing: 0) {
                        Text("\(stageNumber)")
                            .font(.system(size: max(12, 18 * scale), weight: .heavy))
                            .foregroundStyle(textColor)
                        if isMixed {
                            Text("MIX")
                                .font(.system(size: max(7, 9 * scale), weight: .bold))
                                .foregroundStyle(Color.yellow)
                        }
                    }

                    badge
                }
                .shadow(
                    color: isCurrent
                        ? Color(red: 1, green: 196 / 255, blue: 80 / 255).opacity(0.8)
                        : .black.opacity(0.55),
                    radius: isCurrent ? 10 : 4,
                    x: 0,
                    y: 2
                )
            }
            .buttonStyle(.plain)
            .disabled(!isUnlocked)
        }
        .opacity(dim ? 0.45 : 1.0)
        .saturation(dim ? 0.4 : 1.0)
        .position(x: xPx, y: yPx)
    }

    private var fillGradient: LinearGradient {
        if isCleared {
            return LinearGradient(
                colors: [Color(hex: "2a3042"), Color(hex: "141a2a")],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        if !isUnlocked {
            return LinearGradient(
                colors: [Color(hex: "11131c"), Color(hex: "05070d")],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        if isCurrent {
            return LinearGradient(
                colors: [Color(red: 1, green: 234 / 255, blue: 160 / 255), Color(red: 1, green: 188 / 255, blue: 70 / 255)],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        return LinearGradient(
            colors: [Color(hex: "f1f5ff"), Color(hex: "c2c7d8")],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    private var borderColor: Color {
        if isSelected { return Color(hex: "fde68a") }
        if isCurrent { return Color(red: 1, green: 240 / 255, blue: 210 / 255) }
        if isCleared { return Color(red: 1, green: 196 / 255, blue: 80 / 255).opacity(0.7) }
        if !isUnlocked { return Color.white.opacity(0.18) }
        return Color.white.opacity(0.85)
    }

    private var textColor: Color {
        if isCleared { return Color(hex: "fde68a").opacity(0.9) }
        if !isUnlocked { return Color.gray.opacity(0.5) }
        if isCurrent { return Color(hex: "1f1405") }
        return Color(hex: "0b0f1a")
    }

    @ViewBuilder
    private var badge: some View {
        if isCleared {
            let size = max(12, 14 * scale)
            Circle()
                .fill(Color(red: 1, green: 196 / 255, blue: 80 / 255))
                .frame(width: size, height: size)
                .overlay(
                    Image(systemName: "checkmark")
                        .font(.system(size: size * 0.65, weight: .heavy))
                        .foregroundStyle(Color(hex: "1c1407"))
                )
                .offset(x: 16 * scale, y: -16 * scale)
        } else if requiresPremium {
            let size = max(12, 14 * scale)
            Circle()
                .fill(Color.yellow)
                .frame(width: size, height: size)
                .overlay(
                    Image(systemName: "crown.fill")
                        .font(.system(size: size * 0.55, weight: .bold))
                        .foregroundStyle(Color(hex: "1c1407"))
                )
                .offset(x: 16 * scale, y: -16 * scale)
        } else if !isUnlocked {
            Image(systemName: "lock.fill")
                .font(.system(size: max(10, 14 * scale), weight: .bold))
                .foregroundStyle(Color.gray.opacity(0.75))
        }
    }
}

// MARK: - Character (フロンティア位置のプレイヤー)

struct SurvivalDescentCharacterView: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat

    var body: some View {
        let size = max(26, 34 * scale)
        VStack(spacing: -4 * scale) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color(red: 1, green: 1, blue: 1, opacity: 0.25), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: size * 0.9
                        )
                    )
                    .frame(width: size * 1.6, height: size * 1.6)
                    .blendMode(.screen)

                Image(systemName: "figure.walk.circle.fill")
                    .font(.system(size: size, weight: .bold))
                    .foregroundStyle(Color(hex: "fde68a"))
                    .shadow(color: .orange.opacity(0.7), radius: 5)
            }
            Image(systemName: "arrowtriangle.down.fill")
                .font(.system(size: max(8, 10 * scale), weight: .bold))
                .foregroundStyle(Color(hex: "fde68a").opacity(0.8))
        }
        .position(x: xPx, y: yPx - size * 0.55)
        .allowsHitTesting(false)
    }
}

// MARK: - Dim veil

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
                        Color.black.opacity(0.82),
                        Color.black.opacity(0.6),
                        Color.black.opacity(0.82),
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
