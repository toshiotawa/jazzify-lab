import SwiftUI

/// 88 鍵ピアノ（A0–C8）の横スクロール幾何。
enum PianoKeyboardScrollGeometry {
    static let firstMidi = 21
    static let lastMidi = 108
    static let dragBarHeight: CGFloat = 22
    static let earTrainingScrollBarHeight: CGFloat = 30
    static let whiteKeysPerScrollStep = 5
    static let fallbackCenterMidi = 60

    static func isBlackKey(_ midi: Int) -> Bool {
        switch ((midi % 12) + 12) % 12 {
        case 1, 3, 6, 8, 10:
            return true
        default:
            return false
        }
    }

    static func whiteMidiNotes(first: Int = firstMidi, last: Int = lastMidi) -> [Int] {
        (first...last).filter { !isBlackKey($0) }
    }

    static func buildWhiteMidiIndexByMidi(_ notes: [Int]) -> [Int: Int] {
        var indexByMidi: [Int: Int] = [:]
        indexByMidi.reserveCapacity(notes.count)
        for (index, midi) in notes.enumerated() {
            indexByMidi[midi] = index
        }
        return indexByMidi
    }

    static func maxScrollOffset(contentWidth: CGFloat, viewportWidth: CGFloat) -> CGFloat {
        max(0, contentWidth - viewportWidth)
    }

    /// ボタン 1 回あたりの横スクロール量（白鍵 `whiteKeysPerStep` 分）。`direction` は -1=左（低音側）、+1=右（高音側）。
    static func steppedScrollOffsetX(
        current: CGFloat,
        direction: Int,
        whiteKeyWidth: CGFloat,
        maxScrollOffsetX: CGFloat,
        whiteKeysPerStep: Int = whiteKeysPerScrollStep
    ) -> CGFloat {
        let stepCount = max(0, whiteKeysPerStep)
        let delta = whiteKeyWidth * CGFloat(stepCount) * CGFloat(direction)
        return max(0, min(maxScrollOffsetX, current + delta))
    }

    /// サバイバル `ScrollViewReader.scrollTo(anchor: .trailing)` 相当。
    static func trailingScrollOffsetX(
        anchorWhiteMidi: Int,
        whiteKeyWidth: CGFloat,
        viewportWidth: CGFloat,
        contentWidth: CGFloat,
        whiteMidiIndexByMidi: [Int: Int]
    ) -> CGFloat {
        let maxOffset = maxScrollOffset(contentWidth: contentWidth, viewportWidth: viewportWidth)
        guard let index = whiteMidiIndexByMidi[anchorWhiteMidi] else {
            return centerScrollOffsetX(
                anchorMidi: anchorWhiteMidi,
                whiteKeyWidth: whiteKeyWidth,
                viewportWidth: viewportWidth,
                contentWidth: contentWidth,
                whiteMidiIndexByMidi: whiteMidiIndexByMidi
            )
        }
        let trailingEdge = CGFloat(index + 1) * whiteKeyWidth
        return max(0, min(maxOffset, trailingEdge - viewportWidth))
    }

    static func centerScrollOffsetX(
        anchorMidi: Int,
        whiteKeyWidth: CGFloat,
        viewportWidth: CGFloat,
        contentWidth: CGFloat,
        whiteMidiIndexByMidi: [Int: Int]
    ) -> CGFloat {
        let maxOffset = maxScrollOffset(contentWidth: contentWidth, viewportWidth: viewportWidth)
        guard let index = whiteMidiIndexByMidi[anchorMidi] else { return 0 }
        let centerX = (CGFloat(index) + 0.5) * whiteKeyWidth
        return max(0, min(maxOffset, centerX - viewportWidth / 2))
    }
}

/// 鍵盤直上の音域スクロールバー（左右ボタンで横スクロール）。
struct PianoRangeScrollBar: View {
    let barHeight: CGFloat
    let scrollOffsetX: CGFloat
    let maxScrollOffsetX: CGFloat
    let whiteKeyWidth: CGFloat
    let onScrollOffsetXChange: (CGFloat) -> Void

    private static let buttonHitSize: CGFloat = 44

    private var canScrollLeft: Bool {
        scrollOffsetX > 0.5
    }

    private var canScrollRight: Bool {
        maxScrollOffsetX > 0.5 && scrollOffsetX < maxScrollOffsetX - 0.5
    }

    var body: some View {
        HStack(spacing: 0) {
            scrollButton(
                systemName: "chevron.left",
                isEnabled: canScrollLeft,
                accessibilityLabel: "鍵盤を5鍵左へ / Scroll keyboard 5 keys left"
            ) {
                let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
                    current: scrollOffsetX,
                    direction: -1,
                    whiteKeyWidth: whiteKeyWidth,
                    maxScrollOffsetX: maxScrollOffsetX
                )
                if next != scrollOffsetX {
                    onScrollOffsetXChange(next)
                }
            }

            RoundedRectangle(cornerRadius: 2)
                .fill(Color.white.opacity(0.12))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .allowsHitTesting(false)

            scrollButton(
                systemName: "chevron.right",
                isEnabled: canScrollRight,
                accessibilityLabel: "鍵盤を5鍵右へ / Scroll keyboard 5 keys right"
            ) {
                let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
                    current: scrollOffsetX,
                    direction: 1,
                    whiteKeyWidth: whiteKeyWidth,
                    maxScrollOffsetX: maxScrollOffsetX
                )
                if next != scrollOffsetX {
                    onScrollOffsetXChange(next)
                }
            }
        }
        .frame(height: barHeight)
        .accessibilityElement(children: .contain)
    }

    private func scrollButton(
        systemName: String,
        isEnabled: Bool,
        accessibilityLabel: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(isEnabled ? 0.9 : 0.35))
                .frame(width: Self.buttonHitSize, height: Self.buttonHitSize)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityLabel(accessibilityLabel)
    }
}
