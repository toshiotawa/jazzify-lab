import SwiftUI
import UIKit

@MainActor
final class OrientationManager: ObservableObject {
    static let shared = OrientationManager()

    @Published var allowedOrientations: UIInterfaceOrientationMask = .allButUpsideDown

    private init() {}

    func lock(_ orientations: UIInterfaceOrientationMask) {
        allowedOrientations = orientations
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

        if mask == .landscape || mask == .landscapeLeft || mask == .landscapeRight {
            geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: .landscapeRight)
        } else if mask == .portrait {
            geometryPreferences = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: .portrait)
        } else {
            return
        }

        windowScene.requestGeometryUpdate(geometryPreferences) { _ in }
    }
}
