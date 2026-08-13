import Foundation

/// 鍵盤の MIDI ベロシティを、同梱 SF2 の再生に適した値へ写像する。
///
/// `FuchsMoehrFeltPianoLite` は ff 単一サンプルにモジュレータで仮想ダイナミクスを持つが、
/// `AVAudioUnitSampler` は SF2 モジュレータを十分に解釈しない。生のベロシティをそのまま
/// 渡すと画面タップ（100）付近が常に最大に近く聞こえるため、緩い指数カーブで全体を弱打側へ
/// 寄せてフェルトらしいタッチ感を出す。
enum PianoVelocityCurve {
    /// カーブの強さ。1.0 で無変換（実質カーブ無効）。大きいほど弱打側に寄る。
    static let exponent: Double = 1.1
    /// 画面タップ鍵盤の生ベロシティ。MIDI コントローラー入力とは別に、画面上の鍵盤用に固定する。
    static let screenTapVelocity: Int = 90

    /// 0...127 の写像テーブル。ノート ON ごとに `pow` を評価しないよう初回アクセス時に一度だけ作る。
    private static let table: [UInt8] = (0...127).map { raw in
        let shaped = pow(Double(raw) / 127.0, exponent) * 127.0
        return UInt8(max(1, min(127, Int(shaped.rounded()))))
    }

    /// 範囲外の入力も 1...127 にクランプして返す。無音になる 0 は返さない。
    static func map(_ rawVelocity: Int) -> UInt8 {
        table[max(0, min(127, rawVelocity))]
    }
}
