import AVFoundation

/// 正解ルート音（FingerBass SF2）の出力経路別再生ポリシー。音高（MIDI / オクターブ）は変えない。
enum SurvivalRootBassRoutePolicy {
    static let defaultVelocity: UInt8 = 100
    static let speakerVelocity: UInt8 = 127
    static let defaultMixerGain: Float = 1.0
    static let speakerMixerGain: Float = 1.6
    /// high-shelf の中心周波数（Hz）。基音は変えずサンプル倍音のみ持ち上げる。
    static let speakerHighShelfFrequency: Float = 1_800
    static let speakerHighShelfGainDb: Float = 8
    static let defaultHighShelfGainDb: Float = 0

    /// 内蔵スピーカーが出力ルートに含まれるか（テスト可能な pure 判定）。
    static func usesBuiltInSpeaker(portTypes: [AVAudioSession.Port]) -> Bool {
        portTypes.contains(.builtInSpeaker)
    }

    static func gain(isBuiltInSpeaker: Bool) -> (mixerGain: Float, velocity: UInt8) {
        if isBuiltInSpeaker {
            return (speakerMixerGain, speakerVelocity)
        }
        return (defaultMixerGain, defaultVelocity)
    }

    static func highShelfGainDb(isBuiltInSpeaker: Bool) -> Float {
        isBuiltInSpeaker ? speakerHighShelfGainDb : defaultHighShelfGainDb
    }
}
