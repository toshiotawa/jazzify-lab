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
}
