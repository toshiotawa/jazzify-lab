import SwiftUI
import UIKit

@MainActor
final class OrientationManager: ObservableObject {
    static let shared = OrientationManager()

    @Published var allowedOrientations: UIInterfaceOrientationMask = .portrait

    private init() {}

    func lock(_ orientations: UIInterfaceOrientationMask) {
        allowedOrientations = orientations
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
               ?? scene.windows.first?.rootViewController {
            root.setNeedsUpdateOfSupportedInterfaceOrientations()
        }
        rotateIfNeeded(orientations)
    }

    func unlock() {
        allowedOrientations = .portrait
    }

    private func rotateIfNeeded(_ mask: UIInterfaceOrientationMask) {
        guard let windowScene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first else { return }

        let target: UIInterfaceOrientationMask
        if mask.contains(.landscapeRight) {
            target = .landscapeRight
        } else if mask.contains(.landscapeLeft) {
            target = .landscapeLeft
        } else if mask == .portrait {
            target = .portrait
        } else {
            return
        }
        let geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: target)
        windowScene.requestGeometryUpdate(geometryPreferences) { _ in }
    }
}
