import UIKit

@MainActor
final class ScreenRotationApplier {
    static let shared = ScreenRotationApplier()

    private init() {}

    func applyCurrentPreference() {
        apply(enabled: ScreenRotationPreferences.load())
    }

    func apply(enabled: Bool) {
        let transform = enabled
            ? CGAffineTransform(rotationAngle: .pi)
            : .identity

        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            for window in windowScene.windows {
                window.transform = transform
            }
        }
    }
}
