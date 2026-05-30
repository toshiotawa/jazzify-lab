import AVFoundation

/// クエスト完了 / 完了前ジングル（`Jazzify/Resources/` 同梱 MP3）
enum QuestJinglePlayer {
    private static var completePlayer: AVAudioPlayer?
    private static var preCompletePlayer: AVAudioPlayer?
    private static var gameOverPlayer: AVAudioPlayer?

    private static let completeResource = "クエスト完了"
    private static let preCompleteResource = "課題完了前 クリアモーダル"
    private static let gameOverResource = "Gameover"

    static func playComplete() {
        play(resourceName: completeResource, cache: &completePlayer)
    }

    static func playPreComplete() {
        play(resourceName: preCompleteResource, cache: &preCompletePlayer)
    }

    static func playGameOver() {
        play(resourceName: gameOverResource, cache: &gameOverPlayer)
    }

    private static func play(resourceName: String, cache: inout AVAudioPlayer?) {
        if let player = cache, player.isPlaying {
            player.currentTime = 0
            player.play()
            return
        }

        guard let url = Bundle.main.url(forResource: resourceName, withExtension: "mp3") else {
            return
        }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.prepareToPlay()
            player.play()
            cache = player
        } catch {
            /* 無音動作 */
        }
    }
}
