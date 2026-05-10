import Foundation

/// サバイバル 1 セッションがオーディオを束ねる薄い境界（当面は `SurvivalGameAudio.shared` へ委譲）。
@MainActor
final class SurvivalAudioController {
    func setBgmUrls(odd: URL?, even: URL?) {
        SurvivalGameAudio.shared.setBgmUrls(odd: odd, even: even)
    }

    func start() {
        SurvivalGameAudio.shared.start()
    }

    func stop() {
        SurvivalGameAudio.shared.stop()
    }

    func switchWavePhase(useEven: Bool) {
        SurvivalGameAudio.shared.switchWavePhase(useEven: useEven)
    }

    func playEffect(_ effect: SurvivalGameAudio.SoundEffect) {
        SurvivalGameAudio.shared.playEffect(effect)
    }

    func playSynthBassRoot(midi: Int) {
        SurvivalGameAudio.shared.playSynthBassRoot(midi: midi)
    }

    func pianoNoteOn(midi: Int, velocity: Int) {
        SurvivalGameAudio.shared.pianoNoteOn(midi: midi, velocity: velocity)
    }

    func pianoNoteOff(midi: Int) {
        SurvivalGameAudio.shared.pianoNoteOff(midi: midi)
    }

    func pianoNoteOnRealtime(midi: Int, velocity: Int) {
        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
    }

    func pianoNoteOffRealtime(midi: Int) {
        SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: midi)
    }
}
