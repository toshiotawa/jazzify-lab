import SwiftUI

// MARK: - Background

/// レッスンマップ背景 (星空 + ネビュラ風グラデ)。
///
/// Web 実装 (`src/components/lesson/journey/parts/JourneyBackground.tsx`) と
/// 視覚的・挙動的に揃える。iOS では以下の理由でスクロールビュー内部ではなく
/// `LessonJourneyView.mapContent` の外側 (=viewport サイズ) に固定配置する:
///
/// - マップ全体 (contentHeight) は数千 pt に達するためCanvas 描画が破綻し、
///   星が全く描かれないケースが発生していた
/// - `TimelineView` + `Canvas` の毎フレーム CPU 描画が重かった
///
/// 実装は `ForEach` + `Circle` + Core Animation (`.repeatForever`) により
/// GPU 合成で滑らかに瞬き/呼吸させる。
struct LessonJourneyBackgroundView: View {
    let widthPx: CGFloat
    let heightPx: CGFloat

    private let farStars: [Star]
    private let nearStars: [Star]

    init(widthPx: CGFloat, heightPx: CGFloat) {
        self.widthPx = widthPx
        self.heightPx = heightPx
        // Web 実装と同じ密度感に揃える: base (widthPx * heightPx) / 16000
        let area = max(0, Double(widthPx) * Double(heightPx))
        let baseCount = Int(min(120, max(60, area / 16000)))
        self.farStars = Star.generate(
            count: baseCount,
            width: widthPx,
            height: heightPx,
            seed: 29_081,
            breath: false
        )
        self.nearStars = Star.generate(
            count: min(16, max(8, baseCount / 6)),
            width: widthPx,
            height: heightPx,
            seed: 104_729,
            breath: true
        )
    }

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "050315"),
                    Color(hex: "0d0927"),
                    Color(hex: "1b0a3f"),
                    Color(hex: "2a1257"),
                    Color(hex: "362076"),
                ]),
                startPoint: .bottom,
                endPoint: .top
            )
            RadialGradient(
                gradient: Gradient(colors: [Color.purple.opacity(0.22), .clear]),
                center: .init(x: 0.3, y: 0.85),
                startRadius: 0,
                endRadius: widthPx * 0.8
            )
            RadialGradient(
                gradient: Gradient(colors: [Color.cyan.opacity(0.14), .clear]),
                center: .init(x: 0.8, y: 0.2),
                startRadius: 0,
                endRadius: widthPx * 0.7
            )

            ZStack {
                ForEach(farStars) { star in
                    StarDotView(star: star, tintOpacity: 0.85, colorHex: "ffffff")
                }
                ForEach(nearStars) { star in
                    StarDotView(star: star, tintOpacity: 0.9, colorHex: "dcc8ff")
                }
            }
            .frame(width: widthPx, height: heightPx, alignment: .topLeading)
            .blendMode(.screen)
            .allowsHitTesting(false)
        }
        .frame(width: widthPx, height: heightPx)
        .clipped()
    }

    fileprivate struct Star: Identifiable {
        let id: Int
        let x: CGFloat
        let y: CGFloat
        let radius: CGFloat
        let baseOpacity: Double
        let breath: Bool
        /// 呼吸/瞬き 1 周期の長さ (秒)
        let duration: Double
        /// 開始オフセット (秒)。アニメーション開始を少しずつずらす用途
        let phaseOffset: Double

        static func generate(
            count: Int,
            width: CGFloat,
            height: CGFloat,
            seed: UInt64,
            breath: Bool
        ) -> [Star] {
            var rng = SeededGenerator(seed: seed)
            var arr: [Star] = []
            arr.reserveCapacity(count)
            for i in 0..<count {
                let x = CGFloat.random(in: 0...max(1, width), using: &rng)
                let y = CGFloat.random(in: 0...max(1, height), using: &rng)
                let r: CGFloat = breath
                    ? CGFloat.random(in: 0.9...2.0, using: &rng)
                    : CGFloat.random(in: 0.6...1.4, using: &rng)
                let op = Double.random(in: 0.4...0.95, using: &rng)
                let duration = breath
                    ? Double.random(in: 3.2...5.6, using: &rng)
                    : Double.random(in: 2.4...4.6, using: &rng)
                let phase = Double.random(in: 0...duration, using: &rng)
                arr.append(Star(
                    id: i,
                    x: x, y: y, radius: r, baseOpacity: op,
                    breath: breath, duration: duration, phaseOffset: phase
                ))
            }
            return arr
        }
    }

    private struct SeededGenerator: RandomNumberGenerator {
        var state: UInt64
        init(seed: UInt64) { state = seed }
        mutating func next() -> UInt64 {
            state = state &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407
            return state
        }
    }
}

/// 個別の星。`.onAppear` で `withAnimation(.easeInOut.repeatForever)` を仕掛け、
/// 後は Core Animation (GPU) で opacity/scale が補間される。CPU 負荷はほぼゼロ。
private struct StarDotView: View {
    let star: LessonJourneyBackgroundView.Star
    let tintOpacity: Double
    let colorHex: String

    @State private var animate: Bool = false

    var body: some View {
        let base = Color(hex: colorHex)
        let opaque = base.opacity(tintOpacity)
        Circle()
            .fill(opaque)
            .frame(width: star.radius * 2, height: star.radius * 2)
            .scaleEffect(animate && star.breath ? 1.55 : 1.0)
            .opacity(opacityValue)
            .position(x: star.x, y: star.y)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: star.duration)
                        .repeatForever(autoreverses: true)
                        .delay(star.phaseOffset * 0.25)
                ) {
                    animate = true
                }
            }
    }

    private var opacityValue: Double {
        if star.breath {
            return animate ? 1.0 : 0.55
        }
        return animate ? star.baseOpacity : star.baseOpacity * 0.4
    }
}

// MARK: - Block Theme Overlay

struct LessonJourneyBlockThemeOverlay: View {
    let topY: CGFloat
    let bottomY: CGFloat
    let widthPx: CGFloat
    let scale: CGFloat
    let theme: BlockTheme
    let dim: Bool

    var body: some View {
        let height = max(0, (bottomY - topY) * scale)
        let topPx = topY * scale
        Rectangle()
            .fill(
                LinearGradient(
                    gradient: Gradient(stops: [
                        .init(
                            color: Color(hue: theme.hue / 360, saturation: 0.60, brightness: 0.10).opacity(0.45),
                            location: 0.0
                        ),
                        .init(
                            color: Color(hue: theme.hueAlt / 360, saturation: 0.70, brightness: 0.24).opacity(0.28),
                            location: 0.55
                        ),
                        .init(
                            color: Color(hue: theme.hue / 360, saturation: 0.50, brightness: 0.14).opacity(0.18),
                            location: 0.90
                        ),
                        .init(color: .clear, location: 1.0),
                    ]),
                    startPoint: .bottom,
                    endPoint: .top
                )
            )
            .frame(width: widthPx, height: height)
            .position(x: widthPx / 2, y: topPx + height / 2)
            .opacity(dim ? 0.18 : 1.0)
            .blendMode(.screen)
            .allowsHitTesting(false)
    }
}

// MARK: - Path Canvas

struct LessonJourneyPathCanvas: View {
    let layout: LessonJourneyLayout
    let scale: CGFloat
    let accessGraph: LessonJourneyAccessGraph
    let frontierLessonId: UUID?

    var body: some View {
        Canvas { context, _ in
            for block in layout.blocks {
                drawBlockPaths(context: &context, block: block)
            }
        }
        .allowsHitTesting(false)
    }

    private func drawBlockPaths(context: inout GraphicsContext, block: LessonJourneyBlockLayout) {
        for i in 0..<max(0, block.lessonNodes.count - 1) {
            let a = block.lessonNodes[i]
            let b = block.lessonNodes[i + 1]
            drawCurve(
                context: &context,
                from: a, to: b,
                state: pathState(a: a.lessonId, b: b.lessonId),
                theme: block.theme
            )
        }
        guard let last = block.lessonNodes.last else { return }
        if let next = nextBlockFirstNode(after: block) {
            // 最終レッスン → 次ブロック先頭レッスンを直結
            drawCurve(
                context: &context,
                from: last,
                to: next,
                state: pathState(a: last.lessonId, b: next.lessonId),
                theme: block.theme
            )
        } else {
            // 最終ブロック: 最終レッスン → コースゴールを直結
            let goal = layout.goal
            let goalState: PathState = isBlockCompleted(block: block)
                ? .cleared
                : (isCompleted(last.lessonId) ? .active : .locked)
            drawCurve(
                context: &context,
                from: last,
                to: goal,
                state: goalState,
                theme: block.theme
            )
        }
    }

    private enum PathState { case cleared, active, locked }

    private func pathState(a: UUID?, b: UUID?) -> PathState {
        let aCompleted = isCompleted(a)
        let bCompleted = isCompleted(b)
        let bUnlocked = isUnlocked(b)
        if aCompleted && bCompleted { return .cleared }
        if aCompleted && bUnlocked { return .active }
        return .locked
    }

    private func isCompleted(_ id: UUID?) -> Bool {
        guard let id else { return false }
        return accessGraph.lessonStates[id]?.isCompleted ?? false
    }

    private func isUnlocked(_ id: UUID?) -> Bool {
        guard let id else { return false }
        return accessGraph.lessonStates[id]?.isUnlocked ?? false
    }

    private func isBlockCompleted(block: LessonJourneyBlockLayout) -> Bool {
        accessGraph.blockStates[block.blockNumber]?.isCompleted ?? false
    }

    private func nextBlockFirstNode(after block: LessonJourneyBlockLayout) -> LessonJourneyNode? {
        let nextIndex = block.blockIndex + 1
        guard nextIndex < layout.blocks.count else { return nil }
        return layout.blocks[nextIndex].lessonNodes.first
    }

    private func drawCurve(
        context: inout GraphicsContext,
        from a: LessonJourneyNode,
        to b: LessonJourneyNode,
        state: PathState,
        theme: BlockTheme
    ) {
        let fromPt = CGPoint(x: a.x * scale, y: a.y * scale)
        let toPt = CGPoint(x: b.x * scale, y: b.y * scale)
        let midY = (fromPt.y + toPt.y) / 2
        let ctrl1 = CGPoint(x: fromPt.x, y: midY)
        let ctrl2 = CGPoint(x: toPt.x, y: midY)

        var path = Path()
        path.move(to: fromPt)
        path.addCurve(to: toPt, control1: ctrl1, control2: ctrl2)

        let hue = theme.hue
        let hueAlt = theme.hueAlt
        let strokeColor: Color
        let width: CGFloat
        let dash: [CGFloat]
        switch state {
        case .cleared:
            strokeColor = Color(hue: hue / 360, saturation: 0.55, brightness: 0.75, opacity: 0.9)
            width = max(2.6, 3.2 * scale)
            dash = []
        case .active:
            strokeColor = Color(hue: hueAlt / 360, saturation: 0.85, brightness: 0.88, opacity: 0.95)
            width = max(3.2, 4.2 * scale)
            dash = []
        case .locked:
            strokeColor = Color(hue: hue / 360, saturation: 0.25, brightness: 0.45, opacity: 0.5)
            width = max(2.0, 2.4 * scale)
            dash = [max(6, 8 * scale), max(6, 10 * scale)]
        }

        context.stroke(
            path,
            with: .color(strokeColor),
            style: StrokeStyle(lineWidth: width, lineCap: .round, dash: dash)
        )

        if state == .active {
            context.stroke(
                path,
                with: .color(Color.white.opacity(0.85)),
                style: StrokeStyle(lineWidth: max(1.4, 1.8 * scale), lineCap: .round)
            )
        }
    }
}

// MARK: - Band

struct LessonJourneyBandView: View {
    let widthPx: CGFloat
    let yPx: CGFloat
    let label: String
    let sublabel: String?
    let theme: BlockTheme
    let dim: Bool

    var body: some View {
        let hue = theme.hue
        let hueAlt = theme.hueAlt
        ZStack {
            Rectangle()
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            .clear,
                            Color(hue: hue / 360, saturation: 0.55, brightness: 0.28).opacity(0.55),
                            Color(hue: hueAlt / 360, saturation: 0.60, brightness: 0.34).opacity(0.6),
                            Color(hue: hue / 360, saturation: 0.55, brightness: 0.28).opacity(0.55),
                            .clear,
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            VStack(spacing: 2) {
                Text(label)
                    .font(.system(size: 14, weight: .bold))
                    .tracking(0.8)
                    .foregroundStyle(Color.white.opacity(0.95))
                if let sublabel, !sublabel.isEmpty {
                    Text(sublabel)
                        .font(.system(size: 10, weight: .medium))
                        .tracking(1.4)
                        .foregroundStyle(Color.white.opacity(0.6))
                }
            }
        }
        .frame(width: widthPx, height: 48)
        .position(x: widthPx / 2, y: yPx)
        .opacity(dim ? 0.4 : 1.0)
        .allowsHitTesting(false)
    }
}

// MARK: - Node

struct LessonJourneyNodeView: View {
    let node: LessonJourneyNode
    let scale: CGFloat
    let accessState: LessonJourneyAccessGraph.LessonState
    let isFrontier: Bool
    let selected: Bool
    let dim: Bool
    let onSelect: () -> Void

    var body: some View {
        let diameter = 48 * scale
        Button(action: onSelect) {
            ZStack {
                Circle()
                    .fill(fillGradient)
                    .overlay(
                        Circle().stroke(borderColor, lineWidth: 2)
                    )
                    .shadow(color: glowColor, radius: isFrontier ? 12 : 7)

                if accessState.isCompleted {
                    Image(systemName: "checkmark")
                        .font(.system(size: 16 * scale, weight: .bold))
                        .foregroundStyle(.white)
                } else if !accessState.isUnlocked {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 14 * scale, weight: .bold))
                        .foregroundStyle(Color(hex: "94a3b8"))
                } else {
                    Text("\(node.number)")
                        .font(.system(size: 16 * scale, weight: .bold))
                        .foregroundStyle(titleColor)
                }
            }
            .frame(width: diameter, height: diameter)
        }
        .buttonStyle(.plain)
        .disabled(!accessState.isUnlocked)
        .overlay(
            Group {
                if isFrontier {
                    Circle()
                        .stroke(Color.yellow.opacity(0.6), lineWidth: 2)
                        .frame(width: diameter * 1.6, height: diameter * 1.6)
                }
                if selected {
                    Circle()
                        .stroke(Color.cyan, lineWidth: 3)
                        .frame(width: diameter + 10, height: diameter + 10)
                }
            }
            .allowsHitTesting(false)
        )
        .opacity(dim ? 0.4 : 1)
        .position(x: node.x * scale, y: node.y * scale)
    }

    private var fillGradient: LinearGradient {
        if accessState.isCompleted {
            return LinearGradient(
                colors: [Color(hex: "6ee7b7").opacity(0.85), Color(hex: "10b981").opacity(0.85)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
        if !accessState.isUnlocked {
            return LinearGradient(
                colors: [Color(hex: "1e293b"), Color(hex: "0f172a")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
        if isFrontier {
            return LinearGradient(
                colors: [Color(hex: "fde68a"), Color(hex: "fbbf24")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
        return LinearGradient(
            colors: [Color(hex: "ddd6fe"), Color(hex: "a78bfa")],
            startPoint: .topLeading, endPoint: .bottomTrailing
        )
    }

    private var borderColor: Color {
        if !accessState.isUnlocked { return Color(hex: "334155") }
        if accessState.isCompleted { return Color(hex: "a7f3d0") }
        if isFrontier { return Color(hex: "fef3c7") }
        return Color(hex: "ede9fe")
    }

    private var glowColor: Color {
        if !accessState.isUnlocked { return .black.opacity(0.4) }
        if accessState.isCompleted { return Color(hex: "10b981").opacity(0.5) }
        if isFrontier { return Color(hex: "fbbf24").opacity(0.8) }
        return Color(hex: "a78bfa").opacity(0.6)
    }

    private var titleColor: Color {
        if isFrontier { return Color(hex: "78350f") }
        return Color(hex: "3b1a7f")
    }
}

// MARK: - Goal

struct LessonJourneyGoalView: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat
    let cleared: Bool
    let label: String

    @State private var breath: CGFloat = 1.0

    var body: some View {
        let size = 96 * scale
        VStack(spacing: 6) {
            ZStack {
                if cleared {
                    // halo (光環) ― 完了時のみ表示
                    Circle()
                        .fill(
                            RadialGradient(
                                gradient: Gradient(colors: [
                                    Color(hex: "fff0b4").opacity(0.65),
                                    Color(hex: "ffc870").opacity(0.32),
                                    .clear,
                                ]),
                                center: .center,
                                startRadius: 0,
                                endRadius: size * 0.72
                            )
                        )
                        .frame(width: size * 1.2, height: size * 1.2)
                        .scaleEffect(breath)
                        .opacity(Double(breath))

                    // 光線
                    ForEach([0, 45, 90, 135], id: \.self) { deg in
                        Rectangle()
                            .fill(Color(hex: "ffe6a0").opacity(0.55))
                            .frame(width: max(1.0, 1.3 * scale), height: size * 0.95)
                            .rotationEffect(.degrees(Double(deg)))
                            .blendMode(.screen)
                    }
                }

                // コア (王冠の土台)
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: coreGradient),
                            center: .init(x: 0.35, y: 0.3),
                            startRadius: 0,
                            endRadius: size / 2
                        )
                    )
                    .overlay(
                        Circle().stroke(
                            cleared
                                ? Color(hex: "fff7c4").opacity(0.9)
                                : Color.white.opacity(0.2),
                            lineWidth: cleared ? 2 : 1.2
                        )
                    )
                    .shadow(
                        color: cleared
                            ? Color(hex: "ffd76a").opacity(0.8)
                            : Color.black.opacity(0.4),
                        radius: cleared ? 20 : 6
                    )
                    .frame(width: size * 0.64, height: size * 0.64)

                Image(systemName: "crown.fill")
                    .font(.system(size: 26 * scale, weight: .bold))
                    .foregroundStyle(cleared ? Color(hex: "78350f") : Color(hex: "4b2a0f").opacity(0.6))
            }

            Text(label)
                .font(.system(size: 12, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(cleared ? Color(hex: "ffecb3") : Color.white.opacity(0.55))
                .shadow(color: .black.opacity(cleared ? 0.6 : 0.3), radius: cleared ? 6 : 2)
        }
        .opacity(cleared ? 1 : 0.85)
        .position(x: xPx, y: yPx)
        .allowsHitTesting(false)
        .onAppear {
            guard cleared else { return }
            withAnimation(.easeInOut(duration: 3.4).repeatForever(autoreverses: true)) {
                breath = 1.08
            }
        }
    }

    private var coreGradient: [Color] {
        if cleared {
            return [Color(hex: "fffce3"), Color(hex: "ffd76a"), Color(hex: "c99a3c")]
        }
        return [
            Color(hex: "4b3b1e").opacity(0.85),
            Color(hex: "2a1f0e").opacity(0.9),
            Color(hex: "150e06"),
        ]
    }
}

// MARK: - Character

struct LessonJourneyCharacterView: View {
    let xPx: CGFloat
    let yPx: CGFloat
    let scale: CGFloat

    @State private var floatOffset: CGFloat = 0

    var body: some View {
        let size = 60 * scale
        Image("default-avater")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .shadow(color: .black.opacity(0.5), radius: 7, y: 5)
            .offset(y: floatOffset - size * 0.78)
            .position(x: xPx, y: yPx)
            .allowsHitTesting(false)
            .onAppear {
                withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) {
                    floatOffset = -6
                }
            }
    }
}

// MARK: - Detail Sheet

struct LessonJourneyDetailSheet: View {
    let locale: AppLocale
    let lesson: Lesson
    let accessState: LessonJourneyAccessGraph.LessonState?
    let isFrontier: Bool
    let blockLabel: String
    let onStart: () -> Void
    let onClose: () -> Void

    var body: some View {
        let isUnlocked = accessState?.isUnlocked ?? false
        let isCompleted = accessState?.isCompleted ?? false
        let statusLabel: String = {
            if isCompleted { return locale == .ja ? "クリア済み" : "Cleared" }
            if isFrontier { return locale == .ja ? "現在地" : "Current" }
            if isUnlocked { return locale == .ja ? "挑戦可能" : "Available" }
            return locale == .ja ? "未解放" : "Locked"
        }()
        let statusColor: Color = {
            if isCompleted { return Color(hex: "6ee7b7") }
            if isFrontier { return Color(hex: "fbbf24") }
            if isUnlocked { return Color(hex: "c4b5fd") }
            return Color.gray
        }()

        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Text(statusLabel)
                    .font(.caption.bold())
                    .tracking(1.0)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(statusColor.opacity(0.2))
                    .overlay(Capsule().stroke(statusColor.opacity(0.4), lineWidth: 1))
                    .foregroundStyle(statusColor)
                    .clipShape(Capsule())
                Text(blockLabel)
                    .font(.caption)
                    .tracking(1.2)
                    .foregroundStyle(Color(hex: "c4b5fd"))
                Spacer()
            }

            Text(lesson.localizedTitle(locale))
                .font(.title3.bold())
                .foregroundStyle(.white)

            if let desc = lesson.localizedDescription(locale), !desc.isEmpty {
                Text(snippet(desc))
                    .font(.callout)
                    .foregroundStyle(Color.white.opacity(0.8))
                    .lineLimit(3)
            }

            Button(action: onStart) {
                HStack {
                    Image(systemName: isCompleted ? "checkmark.circle.fill" : "play.fill")
                    Text(isCompleted
                        ? (locale == .ja ? "もう一度挑戦する" : "Review lesson")
                        : (locale == .ja ? "レッスンを開始" : "Start lesson"))
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(colors: [Color(hex: "fde68a"), Color(hex: "fbbf24")], startPoint: .leading, endPoint: .trailing)
                )
                .foregroundStyle(Color(hex: "78350f"))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(!isUnlocked)
            .opacity(isUnlocked ? 1 : 0.5)

            Button(action: onClose) {
                Text(locale == .ja ? "閉じる" : "Close")
                    .font(.subheadline)
                    .foregroundStyle(Color(hex: "94a3b8"))
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "120830"))
    }

    private func snippet(_ text: String) -> String {
        let normalized = text.replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespaces)
        if normalized.count <= 180 { return normalized }
        let end = normalized.index(normalized.startIndex, offsetBy: 180)
        return String(normalized[..<end]) + "…"
    }
}

// MARK: - List Panel (iPad regular)

struct LessonJourneyListPanel: View {
    let locale: AppLocale
    let lessons: [Lesson]
    let accessGraph: LessonJourneyAccessGraph
    let frontierLessonId: UUID?
    let selectedLessonId: UUID?
    let completedCount: Int
    let totalCount: Int
    let onSelect: (Lesson) -> Void

    var body: some View {
        let percent = totalCount > 0 ? Int((Double(completedCount) / Double(totalCount)) * 100.0) : 0
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                Text(locale == .ja ? "レッスン一覧" : "Lessons")
                    .font(.subheadline.bold())
                    .tracking(1.2)
                    .foregroundStyle(Color(hex: "c4b5fd"))
                HStack {
                    Text("\(completedCount)/\(totalCount) \(locale == .ja ? "完了" : "completed")")
                        .font(.caption)
                        .foregroundStyle(Color(hex: "c4b5fd").opacity(0.8))
                    Spacer()
                    Text("\(percent)%")
                        .font(.caption.bold())
                        .foregroundStyle(Color(hex: "fde68a"))
                }
                GeometryReader { g in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.black.opacity(0.4))
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "c4b5fd"), Color(hex: "8b5cf6")],
                                    startPoint: .leading, endPoint: .trailing
                                )
                            )
                            .frame(width: g.size.width * CGFloat(percent) / 100.0)
                    }
                }
                .frame(height: 4)
            }
            .padding(14)

            Divider().background(Color.white.opacity(0.15))

            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(groupedBlocks(), id: \.blockNumber) { group in
                        Text(blockName(group))
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.8)
                            .foregroundStyle(Color(hex: "c4b5fd").opacity(0.85))
                            .padding(.horizontal, 10)
                            .padding(.top, 6)

                        VStack(spacing: 4) {
                            ForEach(group.lessons) { lesson in
                                listRow(lesson)
                            }
                        }
                    }
                }
                .padding(8)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(hex: "0a061c").opacity(0.85))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.purple.opacity(0.25), lineWidth: 1)
                )
        )
    }

    @ViewBuilder
    private func listRow(_ lesson: Lesson) -> some View {
        let state = accessGraph.lessonStates[lesson.id]
        let isCompleted = state?.isCompleted ?? false
        let isUnlocked = state?.isUnlocked ?? false
        let isFrontier = lesson.id == frontierLessonId
        let isSelected = lesson.id == selectedLessonId

        Button {
            onSelect(lesson)
        } label: {
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(iconBackground(isCompleted: isCompleted, isUnlocked: isUnlocked, isFrontier: isFrontier))
                        .frame(width: 28, height: 28)
                    if isCompleted {
                        Image(systemName: "checkmark").font(.caption.bold()).foregroundStyle(Color(hex: "10b981"))
                    } else if !isUnlocked {
                        Image(systemName: "lock.fill").font(.caption).foregroundStyle(.gray)
                    } else if isFrontier {
                        Image(systemName: "play.fill").font(.caption2).foregroundStyle(Color(hex: "fbbf24"))
                    } else {
                        Text("\(lesson.orderIndex + 1)").font(.caption.bold()).foregroundStyle(Color(hex: "c4b5fd"))
                    }
                }
                Text(lesson.localizedTitle(locale))
                    .font(.subheadline)
                    .foregroundStyle(isUnlocked ? Color.white : Color.gray)
                    .lineLimit(1)
                Spacer()
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(isSelected ? Color.cyan.opacity(0.15) : Color.clear)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(isSelected ? Color.cyan.opacity(0.6) : .clear, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
        .disabled(!isUnlocked)
        .opacity(isUnlocked ? 1 : 0.6)
    }

    private func iconBackground(isCompleted: Bool, isUnlocked: Bool, isFrontier: Bool) -> Color {
        if isCompleted { return Color(hex: "10b981").opacity(0.25) }
        if !isUnlocked { return Color.gray.opacity(0.25) }
        if isFrontier { return Color(hex: "fbbf24").opacity(0.22) }
        return Color(hex: "8b5cf6").opacity(0.22)
    }

    private struct BlockGroup {
        let blockNumber: Int
        let name: String?
        let nameEn: String?
        let lessons: [Lesson]
    }

    private func groupedBlocks() -> [BlockGroup] {
        var map: [Int: [Lesson]] = [:]
        var nameMap: [Int: (String?, String?)] = [:]
        var order: [Int] = []
        for lesson in lessons.sorted(by: { ($0.blockNumber ?? 1, $0.orderIndex) < ($1.blockNumber ?? 1, $1.orderIndex) }) {
            let bn = lesson.blockNumber ?? 1
            if map[bn] == nil { order.append(bn) }
            map[bn, default: []].append(lesson)
            if nameMap[bn] == nil {
                nameMap[bn] = (lesson.blockName, lesson.blockNameEn)
            }
        }
        return order.map { bn in
            BlockGroup(
                blockNumber: bn,
                name: nameMap[bn]?.0,
                nameEn: nameMap[bn]?.1,
                lessons: map[bn] ?? []
            )
        }
    }

    private func blockName(_ group: BlockGroup) -> String {
        if locale == .en, let en = group.nameEn, !en.isEmpty { return en }
        if let n = group.name, !n.isEmpty { return n }
        return locale == .ja ? "ブロック \(group.blockNumber)" : "Block \(group.blockNumber)"
    }
}
