import AVFoundation
import Foundation

@MainActor
final class OnboardingBgmController: ObservableObject {
    private var player: AVAudioPlayer?

    func start() {
        stop()
        guard let url = Bundle.main.url(forResource: "DrumLoop", withExtension: "mp3") else { return }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = -1
            p.volume = 0.45
            p.prepareToPlay()
            p.play()
            player = p
        } catch {
            player = nil
        }
    }

    func stop() {
        player?.stop()
        player = nil
    }
}
