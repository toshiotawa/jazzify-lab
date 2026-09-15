import Foundation

/// 耳コピバトルの音量 UserDefaults キーと読み込み。`EarTrainingSettingsSheet` と `EarTrainingAudio` で共有。
enum EarTrainingBattleVolumePreferences {
    static let masterKey = "earTraining.master"
    static let musicKey = "earTraining.music"
    static let defaultMaster: Double = 1.0
    static let defaultMusic: Double = 0.7
    /// `music × master` のデフォルト（未永続化時の伴奏音量）。
    static let defaultPhraseVolume: Float = Float(defaultMusic * defaultMaster)

    static func loadPersisted() -> (master: Double, music: Double, piano: Double, sfx: Double) {
        (
            master: loadDouble(key: masterKey, fallback: defaultMaster),
            music: loadDouble(key: musicKey, fallback: defaultMusic),
            piano: Double(SurvivalGameAudio.shared.pianoVolume),
            sfx: Double(SurvivalGameAudio.shared.sfxVolume)
        )
    }

    static func loadDouble(key: String, fallback: Double) -> Double {
        let stored = UserDefaults.standard.object(forKey: key) as? Double
        return stored ?? fallback
    }

    static func save(master: Double, music: Double) {
        UserDefaults.standard.set(clamped(master), forKey: masterKey)
        UserDefaults.standard.set(clamped(music), forKey: musicKey)
    }

    /// フレーズ / 伴奏の実効音量（`master × music` を 0...1 に閉じる）。
    static func phraseVolume(master: Double, music: Double) -> Float {
        Float(clamped(master) * clamped(music))
    }

    static func loadPhraseVolume() -> Float {
        phraseVolume(
            master: loadDouble(key: masterKey, fallback: defaultMaster),
            music: loadDouble(key: musicKey, fallback: defaultMusic)
        )
    }

    private static func clamped(_ value: Double) -> Double {
        max(0, min(1, value))
    }
}
