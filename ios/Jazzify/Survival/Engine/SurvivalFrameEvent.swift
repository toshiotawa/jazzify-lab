import Foundation

/// ゲームループが 1 フレームで発生させる副作用。音・永続化は `SurvivalGameSession` が処理する。
enum SurvivalFrameEvent: Equatable {
    case playEffect(SurvivalGameAudio.SoundEffect)
    case switchWavePhase(useEven: Bool)
    case playSynthBassRoot(midi: Int)
    /// ステージ終了（クリア/ゲームオーバー）。Supabase 送信可否はセッション側で判定する。
    case stageEnded(cleared: Bool)
}
