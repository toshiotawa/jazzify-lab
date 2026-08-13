import Foundation

/// OSMD バトルのターゲット演奏成功時カメラ（微ズーム／シェイク）抑制。
enum EarTrainingOsmdCameraEffectPreferences {
    static let storageKey = "earTraining.osmd.suppressTargetSuccessCameraZoom"

    static func loadSuppressTargetSuccessCameraZoom() -> Bool {
        UserDefaults.standard.bool(forKey: storageKey)
    }

    static func saveSuppressTargetSuccessCameraZoom(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: storageKey)
    }
}
