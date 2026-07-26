import Foundation

/// 鍵盤の MIDI ベロシティを、同梱 SF2 のベロシティレイヤーに乗りやすい値へ写像する。
///
/// `UprightPianoKW-20220221` は velRange 0-80 / 81-127 の 2 レイヤー構成。生のベロシティを
/// そのまま渡すと中庸なタッチでも 81 以上に入り強打レイヤーばかり鳴るため、緩い指数カーブで
/// 全体を弱打側へ寄せて音色差が出る領域を広げる。
enum PianoVelocityCurve {
    /// カーブの強さ。1.0 で無変換（実質カーブ無効）。大きいほど弱打側に寄る。
    static let exponent: Double = 1.15

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
