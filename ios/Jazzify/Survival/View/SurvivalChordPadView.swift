import SwiftUI

/// 画面右下のピアノ鍵盤（WEB モバイル版と同様に A0〜C8 の 52 白鍵をスクロール表示、14 鍵程度が見える）。
/// - タップで `SurvivalGameController.handleNoteOn/Off` を呼ぶ
/// - 同時押しに対応するため `DragGesture(minimumDistance: 0)` を鍵ごとに付与
/// - 黒鍵は白鍵レイヤの上に絶対配置し、白鍵の境界に正しく乗るよう座標計算で描画
/// - ヒントモード中は `controller.currentHintHighlightMidis` に含まれる MIDI の鍵だけを緑グロー表示
///   (Web 版と同じく C4 起点で単一オクターブ分のみをハイライト)
struct SurvivalChordPadView: View {
    @ObservedObject var controller: SurvivalGameController

    /// WEB 版と同じく 88 鍵範囲 (A0 = MIDI 21 ~ C8 = MIDI 108)
    private let firstMidi: Int = 21
    private let lastMidi: Int = 108
    /// 14 白鍵が見える想定の幅割り
    private let visibleWhiteKeys: CGFloat = 14
    private let keyboardHeight: CGFloat = 120
    private let blackKeyHeightRatio: CGFloat = 0.62
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let whiteKeyWidth = max(24, proxy.size.width / visibleWhiteKeys)
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let whites = whiteMidiNotes
            let totalWidth = CGFloat(whites.count) * whiteKeyWidth
            let hintMidis = controller.currentHintHighlightMidis

            ScrollViewReader { scrollProxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    ZStack(alignment: .topLeading) {
                        // 白鍵レイヤ
                        HStack(spacing: 0) {
                            ForEach(Array(whites.enumerated()), id: \.offset) { _, midi in
                                PianoKeyButton(
                                    midi: midi,
                                    label: SurvivalChordPadView.shouldLabelC(midi: midi) ? SurvivalChordPadView.midiLabel(midi) : "",
                                    isBlack: false,
                                    isHinted: hintMidis.contains(midi),
                                    width: whiteKeyWidth,
                                    height: keyboardHeight,
                                    onPress: { controller.handleNoteOn($0) },
                                    onRelease: { controller.handleNoteOff($0) }
                                )
                                .id(midi)
                            }
                        }
                        .frame(width: totalWidth, height: keyboardHeight)

                        // 黒鍵レイヤ（白鍵の境界に中心を合わせて配置）
                        ForEach(blackKeyMidiNotes, id: \.self) { midi in
                            let x = blackKeyCenterX(midi: midi, whiteKeyWidth: whiteKeyWidth)
                            PianoKeyButton(
                                midi: midi,
                                label: "",
                                isBlack: true,
                                isHinted: hintMidis.contains(midi),
                                width: blackKeyWidth,
                                height: blackKeyHeight,
                                onPress: { controller.handleNoteOn($0) },
                                onRelease: { controller.handleNoteOff($0) }
                            )
                            .offset(x: x - blackKeyWidth / 2, y: 0)
                        }
                    }
                    .frame(width: totalWidth, height: keyboardHeight)
                }
                .frame(height: keyboardHeight)
                .onAppear {
                    // 初期表示位置を C4 付近に合わせる
                    scrollProxy.scrollTo(60, anchor: .center)
                }
            }
            .background(Color.black.opacity(0.55))
            // 左右端の鍵 (最低 C / 最高 C 付近) をコーナーで欠けさせず、
            // 画面幅いっぱいまでタップ可能にするため角丸クリップは使用しない。
        }
        .frame(height: keyboardHeight)
    }

    // MARK: - Keys

    private var whiteMidiNotes: [Int] {
        (firstMidi...lastMidi).filter { !SurvivalChordPadView.isBlackKey($0) }
    }

    private var blackKeyMidiNotes: [Int] {
        (firstMidi...lastMidi).filter { SurvivalChordPadView.isBlackKey($0) }
    }

    /// 黒鍵の中心 X（左端からの累積）
    private func blackKeyCenterX(midi: Int, whiteKeyWidth: CGFloat) -> CGFloat {
        // 黒鍵の左側の白鍵インデックスを求める（常に「直前の白鍵」は midi - 1）
        let leftWhite = midi - 1
        let whites = whiteMidiNotes
        guard let idx = whites.firstIndex(of: leftWhite) else { return 0 }
        return (CGFloat(idx) + 1) * whiteKeyWidth
    }

    // MARK: - Helpers

    private static let labels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    private static func isBlackKey(_ midi: Int) -> Bool {
        let pc = ((midi % 12) + 12) % 12
        return [1, 3, 6, 8, 10].contains(pc)
    }

    /// C の白鍵にだけラベルを出して目印にする（画面が狭いため全鍵に付けると潰れる）
    private static func shouldLabelC(midi: Int) -> Bool {
        let pc = ((midi % 12) + 12) % 12
        return pc == 0
    }

    private static func midiLabel(_ midi: Int) -> String {
        let pc = ((midi % 12) + 12) % 12
        let octave = midi / 12 - 1
        return "\(labels[pc])\(octave)"
    }
}

private struct PianoKeyButton: View {
    let midi: Int
    let label: String
    let isBlack: Bool
    /// ヒント対象 pitch class に一致する場合 true。緑のグロー枠で強調表示する。
    let isHinted: Bool
    let width: CGFloat
    let height: CGFloat
    let onPress: (Int) -> Void
    let onRelease: (Int) -> Void

    @State private var isPressing: Bool = false

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(fillColor)
                .overlay(
                    RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                        .stroke(Color.black.opacity(0.85), lineWidth: 1)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                        .stroke(Color.green, lineWidth: isHinted ? 3 : 0)
                        .shadow(color: isHinted ? Color.green.opacity(0.85) : .clear, radius: isHinted ? 4 : 0)
                )
            if !label.isEmpty {
                Text(label)
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.gray)
                    .padding(.bottom, 3)
            }
        }
        .frame(width: width, height: height)
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !isPressing {
                        isPressing = true
                        onPress(midi)
                    }
                }
                .onEnded { _ in
                    if isPressing {
                        isPressing = false
                        onRelease(midi)
                    }
                }
        )
    }

    private var fillColor: Color {
        if isBlack {
            if isHinted {
                return isPressing
                    ? Color(red: 0.15, green: 0.55, blue: 0.25)
                    : Color(red: 0.10, green: 0.40, blue: 0.18)
            }
            return isPressing ? Color(white: 0.35) : Color.black
        } else {
            if isHinted {
                return isPressing
                    ? Color(red: 0.55, green: 0.90, blue: 0.55)
                    : Color(red: 0.75, green: 1.0, blue: 0.75)
            }
            return isPressing ? Color(white: 0.78) : Color.white
        }
    }
}
