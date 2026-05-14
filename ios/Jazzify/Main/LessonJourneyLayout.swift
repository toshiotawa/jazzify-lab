import CoreGraphics
import Foundation

/// レッスンモード「学びの旅マップ」のパラメトリックレイアウト
/// WEB 実装 (src/components/lesson/journey/journeyLayout.ts) と対応する純粋関数。
///
/// 座標系は「論理ピクセル」。描画側で scale して実 pt に変換する。
/// Y は下 → 上に進む (値が小さいほど上 = ゴール側)。
enum LessonJourneyLayoutConstants {
    static let logicalWidth: CGFloat = 360

    static let nodeSpacing: CGFloat = 78
    static let amplitude: CGFloat = 72
    static let sineFrequency: CGFloat = 0.58
    static let blockTopPad: CGFloat = 72
    static let blockBottomPad: CGFloat = 40
    /// ブロック間の追加オフセット (まとめノード廃止後の隙間)
    static let blockGap: CGFloat = 40
    static let goalTopPad: CGFloat = 240
    static let topMargin: CGFloat = 120
    static let bottomMargin: CGFloat = 180
}

enum LessonJourneyNodeKind {
    case lesson
    case goal
}

/// ブロック毎のストーリー性カラーテーマ。
/// blockIndex % BLOCK_THEMES.count で割り当てる。
/// 下から上へ: 深夜 → 夜明け → 朝 → 昼 → 夕 → 星空
struct BlockTheme: Equatable {
    enum Label: String {
        case midnight, dawn, morning, noon, dusk, starlight
    }
    /// 主色相 (HSL / 0–360)
    let hue: Double
    /// 二次色相 (グラデの上端用)
    let hueAlt: Double
    let label: Label
}

enum LessonJourneyBlockThemes {
    static let all: [BlockTheme] = [
        BlockTheme(hue: 262, hueAlt: 280, label: .midnight),
        BlockTheme(hue: 325, hueAlt: 345, label: .dawn),
        BlockTheme(hue: 200, hueAlt: 215, label: .morning),
        BlockTheme(hue: 45, hueAlt: 30, label: .noon),
        BlockTheme(hue: 18, hueAlt: 5, label: .dusk),
        BlockTheme(hue: 250, hueAlt: 230, label: .starlight),
    ]

    static func theme(for blockIndex: Int) -> BlockTheme {
        all[((blockIndex % all.count) + all.count) % all.count]
    }
}

struct LessonJourneyNode: Identifiable, Equatable {
    /// lesson の場合は lesson.id.uuidString。goal は仮想 ID
    let id: String
    /// ブロック内 1 始まり。goal は 0。
    let number: Int
    let x: CGFloat
    let y: CGFloat
    let kind: LessonJourneyNodeKind
    let blockIndex: Int
    /// lesson に対応する UUID (lesson 以外は nil)
    let lessonId: UUID?
}

struct LessonJourneyBlockLayout: Identifiable, Equatable {
    var id: Int { blockNumber }
    let blockNumber: Int
    let blockName: String
    let blockNameEn: String?
    let blockIndex: Int
    let theme: BlockTheme
    let topY: CGFloat
    let bottomY: CGFloat
    let firstLessonY: CGFloat
    let lessonNodes: [LessonJourneyNode]
}

struct LessonJourneyLayout {
    let logicalWidth: CGFloat
    let totalHeight: CGFloat
    let blocks: [LessonJourneyBlockLayout]
    let goal: LessonJourneyNode
    let allNodes: [LessonJourneyNode]
}

struct LessonJourneyInput {
    let id: UUID
    let blockNumber: Int
    let blockName: String?
    let blockNameEn: String?
    let orderIndex: Int
}

private struct GroupedBlock {
    let blockNumber: Int
    var blockName: String?
    var blockNameEn: String?
    var lessons: [LessonJourneyInput]
}

enum LessonJourneyLayoutBuilder {
    nonisolated(unsafe) private static var layoutCache: [String: LessonJourneyLayout] = [:]

    private static func cacheKey(
        lessons: [LessonJourneyInput],
        logicalWidth: CGFloat,
        locale: AppLocale
    ) -> String {
        var hasher = Hasher()
        hasher.combine(logicalWidth)
        hasher.combine(locale.rawValue)
        hasher.combine(lessons.count)
        for lesson in lessons {
            hasher.combine(lesson.id)
            hasher.combine(lesson.blockNumber)
            hasher.combine(lesson.orderIndex)
            hasher.combine(lesson.blockName ?? "")
            hasher.combine(lesson.blockNameEn ?? "")
        }
        return String(hasher.finalize())
    }

    static func build(
        lessons: [LessonJourneyInput],
        logicalWidth: CGFloat = LessonJourneyLayoutConstants.logicalWidth,
        locale: AppLocale = .ja
    ) -> LessonJourneyLayout {
        let key = cacheKey(lessons: lessons, logicalWidth: logicalWidth, locale: locale)
        if let cached = layoutCache[key] {
            return cached
        }

        let c = LessonJourneyLayoutConstants.self

        let grouped = groupByBlock(lessons: lessons, locale: locale)
        if grouped.isEmpty {
            let goalNode = LessonJourneyNode(
                id: "__goal__",
                number: 0,
                x: logicalWidth / 2,
                y: c.topMargin,
                kind: .goal,
                blockIndex: 0,
                lessonId: nil
            )
            let layout = LessonJourneyLayout(
                logicalWidth: logicalWidth,
                totalHeight: c.topMargin + c.bottomMargin,
                blocks: [],
                goal: goalNode,
                allNodes: []
            )
            layoutCache[key] = layout
            return layout
        }

        let blockHeights: [CGFloat] = grouped.map { g in
            let n = CGFloat(max(1, g.lessons.count))
            return c.blockTopPad + n * c.nodeSpacing + c.blockGap + c.blockBottomPad
        }
        let blocksTotalHeight = blockHeights.reduce(CGFloat(0), +)
        let totalHeight = c.topMargin + c.goalTopPad + blocksTotalHeight + c.bottomMargin
        let bottomY = totalHeight - c.bottomMargin

        var blocks: [LessonJourneyBlockLayout] = []
        var allNodes: [LessonJourneyNode] = []
        var cursorBottomY = bottomY
        var globalIndex = 0

        for (blockIndex, group) in grouped.enumerated() {
            let blockHeight = blockHeights[blockIndex]
            let blockBottomY = cursorBottomY
            let blockTopY = cursorBottomY - blockHeight
            let firstLessonY = blockBottomY - c.blockBottomPad

            var lessonNodes: [LessonJourneyNode] = []
            for (i, lesson) in group.lessons.enumerated() {
                let y = firstLessonY - CGFloat(i) * c.nodeSpacing
                let x = computeX(
                    globalIndex: globalIndex,
                    blockIndex: blockIndex,
                    logicalWidth: logicalWidth
                )
                globalIndex += 1
                let node = LessonJourneyNode(
                    id: lesson.id.uuidString,
                    number: i + 1,
                    x: x,
                    y: y,
                    kind: .lesson,
                    blockIndex: blockIndex,
                    lessonId: lesson.id
                )
                lessonNodes.append(node)
                allNodes.append(node)
            }

            let defaultName = defaultBlockName(blockNumber: group.blockNumber, locale: locale)
            let block = LessonJourneyBlockLayout(
                blockNumber: group.blockNumber,
                blockName: group.blockName?.isEmpty == false ? group.blockName! : defaultName,
                blockNameEn: group.blockNameEn,
                blockIndex: blockIndex,
                theme: LessonJourneyBlockThemes.theme(for: blockIndex),
                topY: blockTopY,
                bottomY: blockBottomY,
                firstLessonY: firstLessonY,
                lessonNodes: lessonNodes
            )
            blocks.append(block)

            cursorBottomY = blockTopY
        }

        let lastBlock = blocks.last!
        let goal = LessonJourneyNode(
            id: "__goal__",
            number: 0,
            x: logicalWidth / 2,
            y: lastBlock.topY - c.goalTopPad * 0.5,
            kind: .goal,
            blockIndex: blocks.count,
            lessonId: nil
        )
        allNodes.append(goal)

        let layout = LessonJourneyLayout(
            logicalWidth: logicalWidth,
            totalHeight: totalHeight,
            blocks: blocks,
            goal: goal,
            allNodes: allNodes
        )
        if layoutCache.count >= 8 {
            layoutCache.removeAll(keepingCapacity: true)
        }
        layoutCache[key] = layout
        return layout
    }

    /// ブロック番号昇順、各ブロック内 orderIndex 昇順にソートしてグルーピング
    private static func groupByBlock(lessons: [LessonJourneyInput], locale: AppLocale) -> [GroupedBlock] {
        var map: [Int: GroupedBlock] = [:]
        for lesson in lessons {
            var entry = map[lesson.blockNumber] ?? GroupedBlock(
                blockNumber: lesson.blockNumber,
                blockName: lesson.blockName,
                blockNameEn: lesson.blockNameEn,
                lessons: []
            )
            entry.lessons.append(lesson)
            if entry.blockName == nil || entry.blockName?.isEmpty == true {
                entry.blockName = lesson.blockName
            }
            if entry.blockNameEn == nil || entry.blockNameEn?.isEmpty == true {
                entry.blockNameEn = lesson.blockNameEn
            }
            map[lesson.blockNumber] = entry
        }
        let sortedKeys = map.keys.sorted()
        return sortedKeys.map { key in
            var g = map[key]!
            g.lessons.sort { $0.orderIndex < $1.orderIndex }
            if g.blockName == nil || g.blockName?.isEmpty == true {
                g.blockName = defaultBlockName(blockNumber: key, locale: locale)
            }
            return g
        }
    }

    private static func computeX(globalIndex: Int, blockIndex: Int, logicalWidth: CGFloat) -> CGFloat {
        let centerX = logicalWidth / 2
        let c = LessonJourneyLayoutConstants.self
        let phase = (blockIndex % 2 == 0 ? CGFloat(0) : CGFloat.pi / 2) + CGFloat(blockIndex) * 0.35
        let raw = sin(CGFloat(globalIndex) * c.sineFrequency + phase) * c.amplitude
        return centerX + raw
    }

    private static func defaultBlockName(blockNumber: Int, locale: AppLocale) -> String {
        locale == .en ? "Block \(blockNumber)" : "ブロック \(blockNumber)"
    }
}

/// 進捗・アクセス状態からフロンティア (今取り組むべき) レッスン id を算出する
enum LessonJourneyFrontier {
    static func compute(
        lessons: [LessonJourneyInput],
        isUnlocked: (UUID) -> Bool,
        isCompleted: (UUID) -> Bool
    ) -> UUID? {
        let sorted = lessons.sorted { lhs, rhs in
            if lhs.blockNumber != rhs.blockNumber { return lhs.blockNumber < rhs.blockNumber }
            return lhs.orderIndex < rhs.orderIndex
        }
        for lesson in sorted {
            if isUnlocked(lesson.id) && !isCompleted(lesson.id) {
                return lesson.id
            }
        }
        return nil
    }
}
