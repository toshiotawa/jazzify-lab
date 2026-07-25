import UIKit

@MainActor
final class ScreenRotationApplier {
    static let shared = ScreenRotationApplier()

    private init() {}

    /// 180° 回転後の見た目に合わせたセーフエリア（物理 inset の上下左右を入れ替え）。
    static func rotated(_ insets: UIEdgeInsets) -> UIEdgeInsets {
        UIEdgeInsets(
            top: insets.bottom,
            left: insets.right,
            bottom: insets.top,
            right: insets.left
        )
    }

    static func keyWindowBaseInsets() -> UIEdgeInsets {
        keyWindow?.safeAreaInsets ?? .zero
    }

    /// 180° 回転設定を反映した見た目上のセーフエリア。`window.safeAreaInsets` 直読み箇所向け。
    static func keyWindowEffectiveInsets() -> UIEdgeInsets {
        let base = keyWindowBaseInsets()
        return ScreenRotationPreferences.load() ? rotated(base) : base
    }

    private static var keyWindow: UIWindow? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }
    }

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
                applySafeAreaCompensation(to: window, enabled: enabled)
            }
        }
    }

    private func applySafeAreaCompensation(to window: UIWindow, enabled: Bool) {
        let insets = enabled ? Self.compensation(base: window.safeAreaInsets) : .zero
        guard let root = window.rootViewController else { return }
        applyAdditionalSafeAreaInsets(insets, startingFrom: root)
    }

    /// `additionalSafeAreaInsets` に渡す差分。基準は `window.safeAreaInsets`（transform の影響を受けない）なので冪等。
    private static func compensation(base: UIEdgeInsets) -> UIEdgeInsets {
        let rotated = rotated(base)
        return UIEdgeInsets(
            top: rotated.top - base.top,
            left: rotated.left - base.left,
            bottom: rotated.bottom - base.bottom,
            right: rotated.right - base.right
        )
    }

    private func applyAdditionalSafeAreaInsets(
        _ insets: UIEdgeInsets,
        startingFrom viewController: UIViewController
    ) {
        var current: UIViewController? = viewController
        while let viewController = current {
            viewController.additionalSafeAreaInsets = insets
            current = viewController.presentedViewController
        }
    }
}
