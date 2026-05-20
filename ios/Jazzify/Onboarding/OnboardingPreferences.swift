import Foundation

/// 未ログインオンボーディングの表示済みバージョンを端末に保存する。
enum OnboardingPreferences {
    private static let completedVersionKey = "jazzify.onboarding.completedVersion_v1"

    /// オンボーディング内容を差し替えたらインクリメントし、再表示させる。
    static let currentVersion: Int = 1

    /// `false`: テスト用に「自動表示」を毎回試せる（ゲート無視）。
    /// `true`: 初回起動相当（未完了かつバージョン不一致）のときだけ自動表示。
    static let respectFirstLaunchGate: Bool = true

    private static var lastCompletedVersion: Int {
        UserDefaults.standard.object(forKey: completedVersionKey) as? Int ?? 0
    }

    /// ログイン画面表示時に、`fullScreenCover` を出すか。
    static func shouldShowAutomatically() -> Bool {
        if !respectFirstLaunchGate { return true }
        return lastCompletedVersion < currentVersion
    }

    static func markCompleted() {
        UserDefaults.standard.set(currentVersion, forKey: completedVersionKey)
    }

    static func resetForDebug() {
        UserDefaults.standard.removeObject(forKey: completedVersionKey)
    }
}
