import CoreGraphics
import Foundation

/// 1 フレーム分にまとめた入力。`SurvivalScene.update` で `SurvivalInputBuffer.drain()` により取得する。
struct SurvivalFrameInput: Sendable {
    var analog: CGVector
    /// コード評価用ノートオン（velocity はピアノ音量用。ゲームロジックでは主に pitch class のみ使用）
    var noteOns: [(midi: Int, velocity: Int)]
    var noteOffs: [Int]
}

@MainActor
final class SurvivalInputBuffer {
    private var analog: CGVector = .zero
    private var noteOnQueue: [(Int, Int)] = []
    private var noteOffQueue: [Int] = []

    func setAnalog(_ value: CGVector) {
        analog = value
    }

    func enqueueNoteOn(_ midi: Int, velocity: Int = 100) {
        noteOnQueue.append((midi, velocity))
    }

    func enqueueNoteOff(_ midi: Int) {
        noteOffQueue.append(midi)
    }

    /// ジョイスティック・キューをリセット（リトライ時など）
    func clear() {
        analog = .zero
        noteOnQueue.removeAll(keepingCapacity: true)
        noteOffQueue.removeAll(keepingCapacity: true)
    }

    func drain() -> SurvivalFrameInput {
        let frame = SurvivalFrameInput(
            analog: analog,
            noteOns: noteOnQueue,
            noteOffs: noteOffQueue
        )
        noteOnQueue.removeAll(keepingCapacity: true)
        noteOffQueue.removeAll(keepingCapacity: true)
        return frame
    }
}
