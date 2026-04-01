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
        guard mask.contains(.portrait),
              let windowScene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first else { return }

        let geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: .portrait)
        windowScene.requestGeometryUpdate(geometryPreferences) { _ in }
    }
}
