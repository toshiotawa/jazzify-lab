import SwiftUI
import UIKit

/// コードラン草原ワールドマップの描画パーツ。
struct CodeRunSkyBackgroundView: View {
    let widthPx: CGFloat
    let heightPx: CGFloat
    let scale: CGFloat
    let tintBlocks: [DescentMapTintBand]

    var body: some View {
        ZStack(alignment: .topLeading) {
            ForEach(tintBlocks, id: \.blockKey) { blockLayout in
                let theme = CodeRunMapThemeCatalog.theme(for: blockLayout.blockIndex)
                let bandHeight = max(0, (blockLayout.endY - blockLayout.startY) * scale)
                LinearGradient(
                    colors: [theme.skyTop, theme.skyBottom],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(width: widthPx, height: bandHeight)
                .position(
                    x: widthPx / 2,
                    y: (blockLayout.startY + blockLayout.endY) / 2 * scale
                )
            }

            let cloudTile = max(120, 256 * scale)
            CodeRunTiledPatternImage(imageName: "CodeRunMap/code_run_map_clouds", tileSize: cloudTile)
                .frame(width: widthPx, height: heightPx)
                .opacity(0.35)
                .allowsHitTesting(false)
        }
        .frame(width: widthPx, height: heightPx)
        .clipped()
        .allowsHitTesting(false)
    }
}

struct CodeRunIslandPlatformView: View {
    enum LandingType { case small, big }

    let type: LandingType
    let biome: CodeRunMapBiome
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let dim: Bool

    var body: some View {
        let widthLogical: CGFloat = type == .big ? 240 : 128
        let heightLogical: CGFloat = type == .big ? 96 : 60
        let width = widthLogical * scale
        let height = heightLogical * scale

        Image(CodeRunMapThemeCatalog.islandAssetName(biome: biome, big: type == .big))
            .resizable()
            .interpolation(.none)
            .frame(width: width, height: height)
            .brightness(dim ? -0.25 : 0.05)
            .saturation(dim ? 0.55 : 1.05)
            .opacity(dim ? 0.65 : 1.0)
            .shadow(color: .black.opacity(0.25), radius: 6, x: 0, y: 6)
            .position(x: xPx, y: yPx)
            .allowsHitTesting(false)
    }
}

struct CodeRunWorldSignView: View {
    let worldLabel: String
    let blockLabel: String
    let theme: CodeRunMapBiomeTheme
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let dim: Bool

    var body: some View {
        let width = max(160, 220 * scale)
        let height = max(48, 64 * scale)

        VStack(spacing: 2) {
            Text(worldLabel)
                .font(.system(size: max(8, 10 * scale), weight: .semibold))
                .kerning(2)
                .foregroundStyle(theme.signDepthText)
            Text(blockLabel)
                .font(.system(size: max(14, 20 * scale), weight: .bold))
                .foregroundStyle(theme.signText)
                .shadow(color: .black.opacity(0.45), radius: 1, x: 0, y: 1)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(width: width, height: height)
        .background(
            LinearGradient(
                colors: [theme.signPlateTop, theme.signPlateBottom],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(theme.signPlateBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .opacity(dim ? 0.45 : 1.0)
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
    }
}

struct CodeRunStairConnectorView: View {
    let from: CGPoint
    let to: CGPoint
    let scale: CGFloat
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

        let mainStroke: Color = highlighted
            ? Color(red: 1, green: 210 / 255, blue: 80 / 255)
            : Color(red: 1, green: 248 / 255, blue: 235 / 255).opacity(0.95)
        let innerStroke: Color = highlighted
            ? Color(red: 1, green: 248 / 255, blue: 210 / 255).opacity(0.95)
            : Color.white.opacity(0.85)
        let mainWidth = max(4, 7 * scale)
        let shadowWidth = max(8, 12 * scale)
        let innerWidth = max(1.5, 2.6 * scale)

        Canvas { context, _ in
            let path = Self.stepPath(from: localFrom, to: localTo)
            context.stroke(
                path,
                with: .color(.black.opacity(0.6)),
                style: StrokeStyle(lineWidth: shadowWidth, lineCap: .round, lineJoin: .round)
            )
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
        var path = Path()
        let midY = (from.y + to.y) / 2
        let dx = to.x - from.x
        let stepX = from.x + dx * 0.35
        let step2X = from.x + dx * 0.65
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

private struct CodeRunTiledPatternImage: UIViewRepresentable {
    let imageName: String
    let tileSize: CGFloat

    func makeUIView(context: Context) -> CodeRunTiledPatternUIView {
        let view = CodeRunTiledPatternUIView()
        view.isUserInteractionEnabled = false
        view.apply(imageName: imageName, tileSize: tileSize)
        return view
    }

    func updateUIView(_ uiView: CodeRunTiledPatternUIView, context: Context) {
        uiView.apply(imageName: imageName, tileSize: tileSize)
    }
}

private final class CodeRunTiledPatternUIView: UIView {
    private static var patternCache: [String: UIImage] = [:]
    private var appliedKey = ""

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
            backgroundColor = UIColor.clear
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

struct CodeRunBlockDimVeil: View {
    let startY: CGFloat
    let endY: CGFloat
    let widthPx: CGFloat
    let scale: CGFloat

    var body: some View {
        LinearGradient(
            colors: [
                Color.white.opacity(0.15),
                Color(red: 200 / 255, green: 210 / 255, blue: 230 / 255).opacity(0.45),
                Color(red: 160 / 255, green: 170 / 255, blue: 190 / 255).opacity(0.65),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .frame(width: widthPx, height: max(0, (endY - startY) * scale))
        .position(
            x: widthPx / 2,
            y: (startY + endY) / 2 * scale
        )
        .allowsHitTesting(false)
    }
}
