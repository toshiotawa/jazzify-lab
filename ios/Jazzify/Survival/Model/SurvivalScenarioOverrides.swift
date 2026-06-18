import Foundation

/// オンボーディング／シナリオ用。`isActive == false` のとき既存サバイバルと同一挙動。
struct SurvivalScenarioOverrides: Sendable, Equatable {
    var isActive: Bool = false

    var hideHud: Bool = false
    var hideStageTitle: Bool = false
    var hideHintBadge: Bool = false
    var hidePauseButton: Bool = false
    var hideKillCounter: Bool = false
    var hideTimerDisplay: Bool = false
    var hideStatusStrip: Bool = false
    var hidePlayerHpBar: Bool = false

    var hideStaff: Bool = false
    var hideChordSlots: Bool = false
    var hideChordPad: Bool = false
    var hideComboBadge: Bool = false
    /// demo_play 等、別の譜面オーバーレイを使う場面で内蔵進行譜を抑制する。
    var suppressScenarioStaff: Bool = false
    var scenarioStaffClef: Int = 2
    var hideStaffOnBSlotCompletion: Bool = false
    var useChordMidiNotesForHintHighlights: Bool = false

    var disableJoystick: Bool = false

    var disableTimeLimitClear: Bool = false
    var disableKillQuotaClear: Bool = false
    var disableResultScreen: Bool = false

    var playerInvincible: Bool = false
    var freezeAllEnemyAi: Bool = false
    var disableEnemyAttacks: Bool = false

    var blockChordPadInput: Bool = false
    var blockMidiGameInput: Bool = false
    var blockSlotEvaluation: Bool = false

    var disableSurvivalBgm: Bool = false
    var suppressAutoSpawn: Bool = false

    /// v3 `dialogue_only` 等でジャ爺を lesson + シナリオ中にも出す。
    var tutorialDialogueJajii: Bool = false

    /// v3 チュートリアル: ファイ・ジャ爺の吹き出しを足下に配置（尾はキャラ向き）。
    var speechBubblesBelowCharacter: Bool = false

    /// demo_play: ジャ爺を出現ワールド座標に固定（漂い・追従なし）。
    var freezeTutorialDemoJajii: Bool = false

    /// demo_play: 外部スケジューラが指定する鍵盤ハイライト MIDI。
    var demoKeyboardMidis: [Int] = []

    /// B スロット完成時、通常の B パンチの代わりに発動させるスロット（A=弾、B=パンチ）。`nil` でデフォルト。
    var bChordCompletionAttackOverride: SurvivalSlotIndex? = nil
    /// B スロット完成時にコンボ必殺（360°）を発動。`true` のとき `bChordCompletionAttackOverride` は無視。
    var bChordCompletionUseSpecial: Bool = false

    func toRuntimeState() -> SurvivalScenarioRuntimeState {
        guard isActive else { return .inactive }
        return SurvivalScenarioRuntimeState(
            isActive: true,
            hideHud: hideHud,
            hideStageTitle: hideStageTitle,
            hideHintBadge: hideHintBadge,
            hidePauseButton: hidePauseButton,
            hideKillCounter: hideKillCounter,
            hideTimerDisplay: hideTimerDisplay,
            hideStatusStrip: hideStatusStrip,
            hidePlayerHpBar: hidePlayerHpBar,
            hideStaff: hideStaff,
            hideChordSlots: hideChordSlots,
            hideChordPad: hideChordPad,
            hideComboBadge: hideComboBadge,
            suppressScenarioStaff: suppressScenarioStaff,
            scenarioStaffClef: scenarioStaffClef,
            hideStaffOnBSlotCompletion: hideStaffOnBSlotCompletion,
            useChordMidiNotesForHintHighlights: useChordMidiNotesForHintHighlights,
            disableJoystick: disableJoystick,
            disableTimeLimitClear: disableTimeLimitClear,
            disableKillQuotaClear: disableKillQuotaClear,
            disableResultScreen: disableResultScreen,
            playerInvincible: playerInvincible,
            freezeAllEnemyAi: freezeAllEnemyAi,
            disableEnemyAttacks: disableEnemyAttacks,
            blockChordPadInput: blockChordPadInput,
            blockMidiGameInput: blockMidiGameInput,
            blockSlotEvaluation: blockSlotEvaluation,
            disableSurvivalBgm: disableSurvivalBgm,
            suppressAutoSpawn: suppressAutoSpawn,
            tutorialDialogueJajii: tutorialDialogueJajii,
            speechBubblesBelowCharacter: speechBubblesBelowCharacter,
            freezeTutorialDemoJajii: freezeTutorialDemoJajii,
            demoKeyboardMidis: demoKeyboardMidis,
            bChordCompletionAttackOverride: bChordCompletionAttackOverride,
            bChordCompletionUseSpecial: bChordCompletionUseSpecial
        )
    }
}
