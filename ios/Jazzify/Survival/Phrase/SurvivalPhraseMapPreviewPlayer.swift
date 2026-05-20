import AVFoundation
import Foundation

/// Phrases 降下マップ: 模範演奏 URL を 1 回だけ再生（ループなし）。
@MainActor
final class SurvivalPhraseMapPreviewPlayer {
    private var player: AVPlayer?
    private var observers: [Any] = []
    private var playContinuation: CheckedContinuation<Void, Never>?

    func play(url: URL) async {
        stop(restoreMapBgm: true)
        SurvivalMapAudio.shared.duckForPhrasePreview()
        let item = AVPlayerItem(url: url)
        let p = AVPlayer(playerItem: item)
        player = p

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            playContinuation = cont

            let finish: () -> Void = { [weak self] in
                guard let self else { return }
                guard let c = self.playContinuation else { return }
                self.playContinuation = nil
                for o in self.observers {
                    NotificationCenter.default.removeObserver(o)
                }
                self.observers.removeAll()
                self.player?.pause()
                self.player = nil
                SurvivalMapAudio.shared.restoreAfterPhrasePreview()
                c.resume()
            }

            let o1 = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: item,
                queue: .main
            ) { _ in
                finish()
            }
            let o2 = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemFailedToPlayToEndTime,
                object: item,
                queue: .main
            ) { _ in
                finish()
            }
            observers = [o1, o2]
            p.play()
        }
    }

    func stop(restoreMapBgm: Bool = true) {
        if let c = playContinuation {
            playContinuation = nil
            for o in observers {
                NotificationCenter.default.removeObserver(o)
            }
            observers.removeAll()
            player?.pause()
            player = nil
            if restoreMapBgm {
                SurvivalMapAudio.shared.restoreAfterPhrasePreview()
            }
            c.resume()
            return
        }
        for o in observers {
            NotificationCenter.default.removeObserver(o)
        }
        observers.removeAll()
        player?.pause()
        player = nil
        if restoreMapBgm {
            SurvivalMapAudio.shared.restoreAfterPhrasePreview()
        }
    }
}
