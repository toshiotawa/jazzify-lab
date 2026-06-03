import SpriteKit
import UIKit

/// キャラ追従吹き出しの配置。`above` は頭上＋尾下向き、`below` は足下＋尾上向き（キャラ側へ）。
enum SurvivalSpeechBubblePlacement: Equatable, Sendable {
    case above
    case below
}

/// サバイバル用キャラ追従吹き出し SKNode。
enum SurvivalSpeechBubbleBuilder {
    private static let padX: CGFloat = 10
    private static let padY: CGFloat = 6
    private static let corner: CGFloat = 8
    private static let tailH: CGFloat = 10
    private static var bodyFont: CGFloat { SurvivalSpeechBubbleLayout.bodyFontPoints }

    private static func lineWidth(_ text: String, font: UIFont) -> CGFloat {
        (text as NSString).size(withAttributes: [.font: font]).width
    }

    private static func wrapParagraph(_ text: String, font: UIFont, maxWidth: CGFloat) -> [String] {
        var lines: [String] = []
        var current = ""
        for ch in text {
            let trial = current + String(ch)
            if lineWidth(trial, font: font) > maxWidth, !current.isEmpty {
                lines.append(current)
                current = String(ch)
            } else {
                current = trial
            }
        }
        if !current.isEmpty { lines.append(current) }
        return lines.isEmpty ? [text] : lines
    }

    private static func wrapFullText(_ text: String, font: UIFont, maxWidth: CGFloat) -> [String] {
        var out: [String] = []
        for part in text.components(separatedBy: "\n") {
            let trimmed = part.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty else { continue }
            out.append(contentsOf: wrapParagraph(trimmed, font: font, maxWidth: maxWidth))
        }
        return out.isEmpty ? [text] : out
    }

    static func makeRoot(
        text: String,
        maxOuterWidth: CGFloat,
        placement: SurvivalSpeechBubblePlacement = .above
    ) -> SKNode? {
        let quoteText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !quoteText.isEmpty else { return nil }

        let uiFont = UIFont.systemFont(ofSize: bodyFont, weight: .bold)
        let textMaxWidth = max(72, maxOuterWidth - padX * 2)
        let lines = wrapFullText(quoteText, font: uiFont, maxWidth: textMaxWidth)
        guard !lines.isEmpty else { return nil }

        var textColumnWidth: CGFloat = 0
        for line in lines {
            textColumnWidth = max(textColumnWidth, lineWidth(line, font: uiFont))
        }

        let lineStep = max(uiFont.lineHeight, bodyFont * 1.12)
        let lineCount = CGFloat(lines.count)
        let blockHeight = max(lineStep, lineCount * lineStep)
        let bubbleWidth = textColumnWidth + padX * 2
        let bubbleHeight = blockHeight + padY * 2

        let root = SKNode()
        root.zPosition = 4

        let bubbleRect: CGRect
        let tailPath = CGMutablePath()
        let rowY: CGFloat

        switch placement {
        case .above:
            bubbleRect = CGRect(x: -bubbleWidth / 2, y: tailH, width: bubbleWidth, height: bubbleHeight)
            tailPath.move(to: CGPoint(x: -7, y: tailH))
            tailPath.addLine(to: CGPoint(x: 7, y: tailH))
            tailPath.addLine(to: CGPoint(x: 0, y: -2))
            rowY = tailH + bubbleHeight / 2
        case .below:
            bubbleRect = CGRect(
                x: -bubbleWidth / 2,
                y: -tailH - bubbleHeight,
                width: bubbleWidth,
                height: bubbleHeight
            )
            // 尾の先端を足元（+Y＝キャラ側）へ。頭上配置の下向き尾と対称。
            tailPath.move(to: CGPoint(x: -7, y: -tailH))
            tailPath.addLine(to: CGPoint(x: 7, y: -tailH))
            tailPath.addLine(to: CGPoint(x: 0, y: 2))
            rowY = -tailH - bubbleHeight / 2
        }
        tailPath.closeSubpath()

        let bubblePath = UIBezierPath(roundedRect: bubbleRect, cornerRadius: corner).cgPath
        let bubbleNode = SKShapeNode(path: bubblePath)
        bubbleNode.fillColor = UIColor.black.withAlphaComponent(0.78)
        bubbleNode.strokeColor = UIColor.white.withAlphaComponent(0.26)
        bubbleNode.lineWidth = 1
        bubbleNode.zPosition = 0

        let tailNode = SKShapeNode(path: tailPath)
        tailNode.fillColor = UIColor.black.withAlphaComponent(0.78)
        tailNode.strokeColor = .clear
        tailNode.zPosition = -0.25

        let row = SKNode()
        row.position = CGPoint(x: 0, y: rowY)
        row.zPosition = 0.5

        let verticalMid = (lineCount - 1) / 2
        for (i, line) in lines.enumerated() {
            let lab = SKLabelNode(text: line)
            lab.fontName = "AvenirNext-Bold"
            lab.fontSize = bodyFont
            lab.fontColor = .white
            lab.horizontalAlignmentMode = .center
            lab.verticalAlignmentMode = .center
            let dy = (verticalMid - CGFloat(i)) * lineStep
            lab.position = CGPoint(x: 0, y: dy)
            row.addChild(lab)
        }

        root.addChild(tailNode)
        root.addChild(bubbleNode)
        root.addChild(row)
        return root
    }
}
