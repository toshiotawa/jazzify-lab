import AVFoundation

/// AVAudioSession の出力ルート判定を共通化する。
enum AudioRouteHelper {
    /// ヘッドホン / 外部出力が接続されているか。
    /// 内蔵スピーカーのみのとき false（VPIO / エコーキャンセル推奨）。
    static func hasHeadphoneOutput(session: AVAudioSession = .sharedInstance()) -> Bool {
        session.currentRoute.outputs.contains { output in
            output.portType == .headphones
                || output.portType == .bluetoothA2DP
                || output.portType == .bluetoothHFP
                || output.portType == .usbAudio
        }
    }
}
