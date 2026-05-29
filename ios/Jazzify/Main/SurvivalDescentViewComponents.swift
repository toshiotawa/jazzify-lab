import SwiftUI
import UIKit

/// 魔王城降下マップ ネイティブ版の描画パーツ。
/// Web 版 (`src/components/survival/descent/parts/*`) を SwiftUI の図形描画で再現する。
/// 画像アセットは持ち込まず、すべて Shape + Gradient + Canvas で描画する。

// MARK: - Background

/// マップの縦長背景。レンガは世界全体を 1 枚のタイルパターンで連続させ、スクロール・カテゴリ切替で縞模様がずれないようにする。
/// ブロックごとの雰囲気 tint は viewport 内ブロックのみ重ねる（レンガ・全体グラデは world 全体）。
struct SurvivalDescentBackgroundView: View {
    let widthPx: CGFloat
    let heightPx: CGFloat
    let scale: CGFloat
    /// viewport 内（+ frontier/selected 強制含有）のブロック tint のみ描画する。
    let tintBlocks: [SurvivalDescentBlockLayout]
    let accessibleBlockIndex: Int

    var body: some View {
        let tile = max(160, 256 * scale)
        ZStack(alignment: .topLeading) {
            Rectangle()
                .fill(Color(hex: "09070f"))
                .frame(width: widthPx, height: heightPx)

            TiledPatternImage(
                imageName: "SurvivalMap/background",
                tileSize: tile
            )
            .frame(width: widthPx, height: heightPx)
            .clipped()
            .allowsHitTesting(false)

            ForEach(tintBlocks, id: \.blockKey) { blockLayout in
                let theme = SurvivalDescentThemeCatalog.theme(for: blockLayout.blockIndex)
                let dim = blockLayout.blockIndex > accessibleBlockIndex
                let bandHeight = max(0, (blockLayout.endY - blockLayout.startY) * scale)
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [theme.tintTop, theme.tintBottom],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: widthPx, height: bandHeight)
                    .position(x: widthPx / 2, y: (blockLayout.startY + blockLayout.endY) / 2 * scale)
                    .opacity(dim ? 0.12 : 0.55)
                    .blendMode(.screen)
                    .allowsHitTesting(false)
            }

            // 全体にかぶせる暗色グラデーション (奥行き)
            LinearGradient(
                colors: [
                    Color(red: 18 / 255, green: 22 / 255, blue: 40 / 255).opacity(0.25),
                    Color(red: 18 / 255, green: 16 / 255, blue: 38 / 255).opacity(0.4),
                    Color(red: 28 / 255, green: 14 / 255, blue: 48 / 255).opacity(0.55),
                    Color(red: 12 / 255, green: 8 / 255, blue: 22 / 255).opacity(0.75),
                    Color(red: 4 / 255, green: 2 / 255, blue: 10 / 255).opacity(0.9),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(width: widthPx, height: heightPx)
            .allowsHitTesting(false)

            // 中央のヴィネット
            RadialGradient(
                colors: [Color.clear, Color.black.opacity(0.45)],
                center: .center,
                startRadius: widthPx * 0.35,
                endRadius: max(widthPx, heightPx) * 0.7
            )
            .frame(width: widthPx, height: heightPx)
            .allowsHitTesting(false)
        }
        .frame(width: widthPx, height: heightPx)
        .clipped()
        .allowsHitTesting(false)
    }
}

/// UIKit の `UIColor(patternImage:)` を使ってネイティブにタイル描画する View。
/// SwiftUI の `ForEach + Image` で 500+ の UIImageView を並べていた旧 `TiledImage` を置き換える。
/// CALayer 1 枚の `backgroundColor = patternColor` で済むため、
/// タイル数が増えてもスクロール時のコミット負荷が一定になる。
private struct TiledPatternImage: UIViewRepresentable {
    let imageName: String
    let tileSize: CGFloat

    func makeUIView(context: Context) -> TiledPatternView {
        let view = TiledPatternView()
        view.isUserInteractionEnabled = false
        view.apply(imageName: imageName, tileSize: tileSize)
        return view
    }

    func updateUIView(_ uiView: TiledPatternView, context: Context) {
        uiView.apply(imageName: imageName, tileSize: tileSize)
    }
}

/// タイルパターン UIImage をキャッシュして `layer.backgroundColor` に流し込む軽量 UIView。
final class TiledPatternView: UIView {
    private static var patternCache: [String: UIImage] = [:]
    private var appliedKey: String = ""

    func apply(imageName: String, tileSize: CGFloat) {
        let px = max(32, Int(tileSize.rounded()))
        let key = "\(imageName)@\(px)"
        guard appliedKey != key else { return }
        appliedKey = key
        let image = Self.patternCache[key] ?? Self.makePattern(imageName: imageName, sizePx: CGFloat(px))
        Self.patternCache[key] = image
        if let image {
            layer.contents = nil
            backgroundColor = UIColor(patternImage: image)
        } else {
            backgroundColor = UIColor.black
        }
    }

    private static func makePattern(imageName: String, sizePx: CGFloat) -> UIImage? {
        guard let src = UIImage(named: imageName) else { return nil }
        let size = CGSize(width: sizePx, height: sizePx)
        let format = UIGraphicsImageRendererFormat()
        format.opaque = true
        format.scale = 1
        return UIGraphicsImageRenderer(size: size, format: format).image { _ in
            src.draw(in: CGRect(origin: .zero, size: size))
        }
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
    /// left/right でアニメーション位相をずらす
    var side: Side = .left
    /// フロンティア (現在挑戦中) ブロックかどうか。`true` のときだけ炎/グローのアニメーションを起動し、
    /// それ以外のブロックでは静止画にすることで `repeatForever` の累積を防ぐ。
    var animated: Bool = true

    enum Side { case left, right }

    @State private var flicker: Bool = false
    @State private var glowPulse: Bool = false

    var body: some View {
        let bodyWidth = max(10, 14 * scale)
        let bodyHeight = max(18, 22 * scale)
        let flameHeight = max(14, 18 * scale)
        let animating = lit && !dim && animated
        let delay: Double = side == .left ? 0 : 0.7

        ZStack(alignment: .center) {
            // 灯火グロー
            if animating {
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
                    .scaleEffect(glowPulse ? 1.12 : 0.88)
                    .opacity(glowPulse ? 0.95 : 0.55)
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
                    .opacity(animating ? (flicker ? 0.95 : 0.75) : 0.35)
                    .scaleEffect(x: flicker ? 1.08 : 0.92, y: flicker ? 1.12 : 0.88, anchor: .bottom)
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
        .onAppear {
            guard animating else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                withAnimation(.easeInOut(duration: 1.3).repeatForever(autoreverses: true)) {
                    flicker = true
                }
                withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                    glowPulse = true
                }
            }
        }
    }
}

// MARK: - Landing platform (踊り場)

/// 石の踊り場。small / big で画像 (`odoriba` / `big_odoriba`) を貼り分ける。
struct SurvivalDescentLandingPlatform: View {
    enum LandingType { case small, big }

    let type: LandingType
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let filter: SurvivalDescentBlockFilter
    let dim: Bool

    var body: some View {
        let widthLogical: CGFloat = type == .big ? 240 : 128
        let heightLogical: CGFloat = type == .big ? 96 : 60
        let width = widthLogical * scale
        let height = heightLogical * scale

        Image(type == .big ? "SurvivalMap/big_odoriba" : "SurvivalMap/odoriba")
            .resizable()
            .interpolation(.medium)
            .frame(width: width, height: height)
            .hueRotation(.degrees(filter.platformHueDeg))
            .saturation(filter.platformSaturation)
            .brightness(filter.platformBrightness + (dim ? -0.35 : 0.05))
            .opacity(dim ? 0.5 : 1.0)
            .shadow(color: .black.opacity(0.55), radius: 6, x: 0, y: 6)
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
    /// フロンティアブロックのみ true。回転/グローの連続アニメを間引く。
    var animated: Bool = true

    @State private var rotation: Double = 0
    @State private var glowPulse: Bool = false

    var body: some View {
        let size = max(50, 80 * scale)
        ZStack {
            Circle()
                .stroke(theme.sealStroke, lineWidth: 1.2)
                .frame(width: size, height: size)

            Circle()
                .stroke(theme.sealStroke.opacity(0.55), lineWidth: 0.8)
                .frame(width: size * 0.72, height: size * 0.72)

            // 六芒星を回転させて表現 (開封時にゆっくり回る)
            ZStack {
                Triangle()
                    .stroke(theme.sealStroke.opacity(0.85), lineWidth: 1.2)
                    .frame(width: size * 0.85, height: size * 0.85)
                Triangle()
                    .stroke(theme.sealStroke.opacity(0.85), lineWidth: 1.2)
                    .frame(width: size * 0.85, height: size * 0.85)
                    .rotationEffect(.degrees(180))
            }
            .rotationEffect(.degrees(rotation))

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
                    .scaleEffect(glowPulse ? 1.15 : 0.9)
                    .opacity(glowPulse ? 1.0 : 0.6)
            }
        }
        .frame(width: size, height: size)
        .opacity(dim ? 0.3 : (opened ? 1.0 : 0.75))
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
        .onAppear {
            guard opened, !dim, animated else { return }
            withAnimation(.linear(duration: 12).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                glowPulse = true
            }
        }
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

/// ブロック境界の扉 (施錠/開放)。Web 版 `BlockDoor` と同じ `door.png` を貼る。
struct SurvivalDescentDoorView: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let theme: SurvivalDescentBlockTheme
    let filter: SurvivalDescentBlockFilter
    let opened: Bool
    let dim: Bool

    var body: some View {
        let width = max(80, 140 * scale)
        let height = max(110, 200 * scale)
        let brightnessAdj: Double = dim ? -0.5 : (opened ? 0.15 : -0.15)

        ZStack {
            Image("SurvivalMap/door")
                .resizable()
                .interpolation(.medium)
                .frame(width: width, height: height)
                .hueRotation(.degrees(filter.doorHueDeg))
                .saturation(filter.doorSaturation * (dim ? 0.4 : 1.0))
                .brightness(filter.doorBrightness + brightnessAdj)

            if !opened && !dim {
                Image(systemName: "lock.fill")
                    .font(.system(size: max(18, 26 * scale), weight: .bold))
                    .foregroundStyle(Color.black.opacity(0.65))
                    .shadow(color: .white.opacity(0.2), radius: 1)
            }
        }
        .shadow(
            color: opened ? theme.plateClearedGlow.opacity(0.6) : .black.opacity(0.55),
            radius: opened ? 12 : 5
        )
        .opacity(dim ? 0.4 : 1.0)
        .position(x: xPx, y: yPx - height / 2)
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

    @State private var pulse: Bool = false

    var body: some View {
        let diameter = max(40, 52 * scale)

        ZStack {
            if isCurrent && !dim {
                Circle()
                    .stroke(Color(red: 1, green: 214 / 255, blue: 96 / 255).opacity(0.55), lineWidth: 2)
                    .frame(width: diameter * 1.55, height: diameter * 1.55)
                    .scaleEffect(pulse ? 1.08 : 0.96)
                    .opacity(pulse ? 0.55 : 0.95)
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
        .onAppear {
            guard isCurrent, !dim else { return }
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
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

/// キャラクター立ち絵 (デフォルトアバター)。踊り場の進行方向側に立ち、呼吸アニメで揺らぐ。
struct SurvivalDescentCharacterView: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    /// 'right' → 右を向く (通常) / 'left' → 左を向く / 'center' → 大踊り場で正面
    var facing: Facing = .right

    enum Facing { case left, right, center }

    @State private var breathe: Bool = false

    var body: some View {
        let size = max(56, 88 * scale)
        let offsetX: CGFloat = {
            switch facing {
            case .center: return 0
            case .right: return 28 * scale
            case .left: return -28 * scale
            }
        }()
        let flip: CGFloat = facing == .left ? -1 : 1
        let imageBaseName: String = {
            switch facing {
            case .center: return "survival_muki_shita"
            case .left, .right: return "survival_muki_migi"
            }
        }()

        ZStack(alignment: .bottom) {
            // 足元の柔らかい光
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color(red: 1, green: 224 / 255, blue: 160 / 255).opacity(0.45), .clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: size * 0.45
                    )
                )
                .frame(width: size * 0.9, height: size * 0.3)
                .blendMode(.screen)
                .offset(y: size * 0.05)

            Image(imageBaseName)
                .resizable()
                .interpolation(.medium)
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .scaleEffect(x: flip, y: 1, anchor: .center)
                .shadow(color: .black.opacity(0.55), radius: 6, x: 0, y: 6)
        }
        .frame(width: size, height: size)
        .offset(y: breathe ? -2 * scale : 2 * scale)
        .position(
            x: xPx + offsetX,
            y: yPx - size * 0.5 - 10 * scale
        )
        .allowsHitTesting(false)
        .onAppear {
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) {
                breathe = true
            }
        }
    }
}

// MARK: - Boss figure (ブロック末尾の扉前に立つボス)

/// ブロック境界扉の前に立つボスシルエット。
struct SurvivalDescentBossFigure: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    /// 0: boss_a, 1: boss_b, 2: boss_c
    let bossIndex: Int
    /// クリア済みならシルエットとして残す
    let opened: Bool
    /// ブロック未解放なら極薄
    let dim: Bool
    /// フロンティアブロックのみ true。bob / pulse の連続アニメを起動する。
    var animated: Bool = true

    @State private var bob: Bool = false
    @State private var pulse: Bool = false

    private var assetName: String {
        switch ((bossIndex % 3) + 3) % 3 {
        case 0: return "SurvivalMap/boss_a"
        case 1: return "SurvivalMap/boss_b"
        default: return "SurvivalMap/boss_c"
        }
    }

    var body: some View {
        let size = max(80, 150 * scale)
        let opacity: Double = dim ? 0.18 : (opened ? 0.3 : 0.7)
        let saturation: Double = dim ? 0.3 : (opened ? 0.5 : 0.9)
        let brightnessAdj: Double = dim ? -0.4 : (opened ? -0.3 : -0.05)

        ZStack {
            if !dim && !opened {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.red.opacity(0.35), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: size * 0.55
                        )
                    )
                    .frame(width: size * 1.2, height: size * 1.2)
                    .scaleEffect(pulse ? 1.08 : 0.9)
                    .opacity(pulse ? 0.75 : 0.35)
                    .blendMode(.screen)
            }

            Image(assetName)
                .resizable()
                .interpolation(.medium)
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .saturation(saturation)
                .brightness(brightnessAdj)
                .shadow(color: .black.opacity(opened ? 0.4 : 0.6), radius: 8, x: 0, y: 6)
        }
        .opacity(opacity)
        .offset(y: bob ? -3 * scale : 3 * scale)
        .position(x: xPx, y: yPx - size * 0.5)
        .allowsHitTesting(false)
        .onAppear {
            guard !dim, animated else { return }
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                bob = true
            }
            if !opened {
                withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
                    pulse = true
                }
            }
        }
    }
}

// MARK: - Floating ember (フロンティアブロックの火の粉)

private struct EmberParticleSpec {
    let leftPct: Double
    let startYPct: Double
    let size: CGFloat
    let duration: CFTimeInterval
    let delay: CFTimeInterval
}

private enum FloatingEmberParticleFactory {
    static func specs(count: Int) -> [EmberParticleSpec] {
        var items: [EmberParticleSpec] = []
        items.reserveCapacity(count)
        for i in 0..<count {
            let seed = (i * 31 + 7) % 100
            items.append(
                EmberParticleSpec(
                    leftPct: 12 + Double((seed * 7) % 76),
                    startYPct: Double((seed * 11) % 100),
                    size: CGFloat(2 + ((seed * 3) % 4)),
                    duration: 4.0 + Double((seed * 2) % 6),
                    delay: Double(seed % 10) * 0.5
                )
            )
        }
        return items
    }
}

/// Web 版 `FloatingEmber.tsx` と同 seed 式。CALayer keyframe で GPU 合成し SwiftUI body を毎フレーム更新しない。
private final class FloatingEmberUIView: UIView {
    private var appliedKey: String = ""

    func apply(widthPx: CGFloat, heightPx: CGFloat, scale: CGFloat, color: UIColor, count: Int) {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
        let key = String(
            format: "%.2f|%.2f|%.4f|%.3f|%.3f|%.3f|%.3f|%d",
            widthPx, heightPx, scale, red, green, blue, alpha, count
        )
        guard appliedKey != key else { return }
        appliedKey = key

        layer.sublayers?.forEach { $0.removeFromSuperlayer() }

        let specs = FloatingEmberParticleFactory.specs(count: count)
        let steps = 9
        for spec in specs {
            let diameter = max(1, spec.size * scale)
            let baseX = CGFloat(spec.leftPct / 100) * widthPx
            let startY = CGFloat(spec.startYPct / 100) * heightPx

            var positions: [CGPoint] = []
            positions.reserveCapacity(steps + 1)
            var opacities: [NSNumber] = []
            opacities.reserveCapacity(steps + 1)
            for step in 0...steps {
                let clamped = Double(step) / Double(steps)
                let yProgress = 1 - clamped
                let xWave = sin(clamped * .pi * 2) * 12 * scale
                let alpha = sin(clamped * .pi) * 0.9
                positions.append(
                    CGPoint(
                        x: baseX + xWave,
                        y: startY * CGFloat(yProgress)
                    )
                )
                opacities.append(NSNumber(value: alpha))
            }

            let particleLayer = CALayer()
            particleLayer.bounds = CGRect(x: 0, y: 0, width: diameter, height: diameter)
            particleLayer.cornerRadius = diameter / 2
            particleLayer.backgroundColor = color.cgColor
            particleLayer.shadowColor = color.cgColor
            particleLayer.shadowRadius = diameter * 0.6
            particleLayer.shadowOpacity = 1
            particleLayer.shadowOffset = .zero
            particleLayer.position = positions[0]
            particleLayer.opacity = opacities[0].floatValue
            layer.addSublayer(particleLayer)

            let positionAnim = CAKeyframeAnimation(keyPath: "position")
            positionAnim.values = positions
            positionAnim.duration = spec.duration
            positionAnim.repeatCount = .infinity
            positionAnim.timingFunctions = Array(repeating: CAMediaTimingFunction(name: .easeInEaseOut), count: steps)

            let opacityAnim = CAKeyframeAnimation(keyPath: "opacity")
            opacityAnim.values = opacities
            opacityAnim.duration = spec.duration
            opacityAnim.repeatCount = .infinity
            opacityAnim.timingFunctions = Array(repeating: CAMediaTimingFunction(name: .easeInEaseOut), count: steps)

            let group = CAAnimationGroup()
            group.animations = [positionAnim, opacityAnim]
            group.duration = spec.duration
            group.repeatCount = .infinity
            group.timeOffset = spec.delay
            group.isRemovedOnCompletion = false
            particleLayer.add(group, forKey: "emberFloat")
        }
    }
}

private struct FloatingEmberRepresentable: UIViewRepresentable {
    let widthPx: CGFloat
    let heightPx: CGFloat
    let scale: CGFloat
    let uiColor: UIColor
    let count: Int

    func makeUIView(context: Context) -> FloatingEmberUIView {
        let view = FloatingEmberUIView()
        view.isUserInteractionEnabled = false
        view.backgroundColor = .clear
        view.apply(widthPx: widthPx, heightPx: heightPx, scale: scale, color: uiColor, count: count)
        return view
    }

    func updateUIView(_ uiView: FloatingEmberUIView, context: Context) {
        uiView.apply(widthPx: widthPx, heightPx: heightPx, scale: scale, color: uiColor, count: count)
    }
}

/// フロンティアブロックに漂うパーティクル (火の粉)
struct SurvivalDescentFloatingEmber: View {
    let startY: CGFloat
    let endY: CGFloat
    let widthPx: CGFloat
    let scale: CGFloat
    let color: Color
    var count: Int = 6

    var body: some View {
        let height = max(0, (endY - startY) * scale)
        FloatingEmberRepresentable(
            widthPx: widthPx,
            heightPx: height,
            scale: scale,
            uiColor: UIColor(color),
            count: count
        )
        .frame(width: widthPx, height: height, alignment: .topLeading)
        .offset(y: startY * scale)
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
