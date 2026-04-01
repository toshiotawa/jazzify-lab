import SwiftUI
import UIKit

@MainActor
final class OrientationManager: ObservableObject {
    static let shared = OrientationManager()

    @Published var allowedOrientations: UIInterfaceOrientationMask = .allButUpsideDown

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
        allowedOrientations = .allButUpsideDown
    }

    private func rotateIfNeeded(_ mask: UIInterfaceOrientationMask) {
        guard let windowScene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first else { return }

        let geometryPreferences: UIWindowScene.GeometryPreferences.iOS

        if mask.contains(.landscapeLeft) || mask.contains(.landscapeRight) {
            geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: .landscapeRight)
        } else if mask.contains(.portrait) {
            geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: .portrait)
        } else {
            return
        }

        windowScene.requestGeometryUpdate(geometryPreferences) { _ in }
    }
}
