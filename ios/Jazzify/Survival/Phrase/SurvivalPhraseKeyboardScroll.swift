import Foundation

/// サバイバル・フレーズ用: ステージ全体の最高音から横スクロールアンカー（白鍵 MIDI）を求める。
enum SurvivalPhraseKeyboardScroll {
    private static func isBlackKey(_ midi: Int) -> Bool {
        switch ((midi % 12) + 12) % 12 {
        case 1, 3, 6, 8, 10:
            return true
        default:
            return false
        }
    }

    /// 全和音・全構成音の最大 `pitchMidi`。データが空なら `nil`。
    static func maxPitchMidi(in phrase: SurvivalPhraseDefinition) -> Int? {
        var maxValue: Int?
        for chord in phrase.chords {
            for note in chord.notes {
                if maxValue == nil || note.pitchMidi > maxValue! {
                    maxValue = note.pitchMidi
                }
            }
        }
        return maxValue
    }

    /// `ScrollViewReader.scrollTo(_:anchor:)` 用。視野の視覚的最高鍵が `maxPhraseMidi + 1` 付近となるよう、アンカーとする **白鍵**。
    /// - `scrollTo(..., anchor: .trailing)` と組み合わせることを想定。
    static func scrollAnchorWhiteMidi(maxPhraseMidi: Int, firstMidi: Int = 21, lastMidi: Int = 108) -> Int {
        let targetHigh = min(lastMidi, max(firstMidi, maxPhraseMidi + 1))
        var m = targetHigh
        while m >= firstMidi, isBlackKey(m) {
            m -= 1
        }
        return max(firstMidi, m)
    }
}
