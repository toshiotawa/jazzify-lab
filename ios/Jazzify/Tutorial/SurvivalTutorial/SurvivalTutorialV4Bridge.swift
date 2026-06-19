import Foundation

// MARK: - Survival Tutorial V4 → V3 bridge
//
// Web の `src/components/survival/tutorial/v4/survivalTutorialV4ManifestToV3Payload.ts`
// と同じ写像で、デコード済み V4 manifest を既存の実績ある V3 ランタイム
// (`SurvivalTutorialV3LessonView` = V3 デモデザイン)で駆動できる
// `SurvivalTutorialScriptPayloadV3` へ変換する。
//
// 対応:
// - dialogue → `dialogue_only`(話者保持)
// - demo     → `demo_play`(staff1/2 voicing は表示+ピアノ再生。staff3 bass は非表示だが livePlayback でベース音源再生)
// - play     → `phrase_battle`(playAlong) + phrase ブロック。塊ごとに quote セリフ/休符塊送り/
//              staff3 bass を保持し、塊単位で逐次進める。
// - 末尾に `finish` を付与し CTA で完了
//
// `SurvivalTutorialScriptPayloadV3` は decode 専用のため、V3 相当の JSON 辞書を
// 組み立てて `JSONDecoder` で再デコードする(既存 V3 構造体は不変)。

enum SurvivalTutorialV4Bridge {
    enum BridgeError: Error {
        case encodingFailed
    }

    /// V4 manifest → V3 ペイロード。Web ブリッジと同じ写像。
    static func toV3Payload(_ manifest: SurvivalTutorialV4Manifest) throws -> SurvivalTutorialScriptPayloadV3 {
        let dict = v3PayloadDictionary(from: manifest)
        let data = try JSONSerialization.data(withJSONObject: dict, options: [])
        return try JSONDecoder().decode(SurvivalTutorialScriptPayloadV3.self, from: data)
    }

    // MARK: - Dictionary builders

    private static func v3PayloadDictionary(from manifest: SurvivalTutorialV4Manifest) -> [String: Any] {
        var content: [String: Any] = [:]
        var scenes: [[String: Any]] = []

        for scene in manifest.scenes {
            switch scene {
            case let .dialogue(dialogue):
                scenes.append(dialogueScene(dialogue))
            case let .demo(demo):
                scenes.append(demoScene(demo))
            case let .play(play):
                let contentRef = "v4-play:\(play.id)"
                let quotes = assignPlayQuotes(play)
                content[contentRef] = playContentBlock(play, quoteByIndex: quotes.quoteByIndex)
                scenes.append(playScene(play, contentRef: contentRef, intro: quotes.intro))
            }
        }

        scenes.append(["type": "finish"])

        var payload: [String: Any] = [
            "version": 3,
            "ui": uiDictionary(manifest.ui),
            "content": content,
            "scenes": scenes,
            "finish": ["showCta": true],
        ]

        if let bgmUrl = manifest.assets.bgm?.url, !bgmUrl.isEmpty {
            payload["audioTracks"] = ["drum_loop": ["url": bgmUrl]]
        }

        return payload
    }

    private static let defaultUiDictionary: [String: Any] = [
        "hidePlayerHpBar": true,
        "hideSettingsButton": true,
        "hideBackButton": true,
        "hideMidiToggle": true,
        "showExitButton": true,
        "playerInvincible": true,
        "disableEnemyAttacks": true,
        "keyboardHintsDefault": true,
    ]

    private static func uiDictionary(_ ui: SurvivalTutorialV3UiOverrides?) -> [String: Any] {
        guard let ui else { return defaultUiDictionary }
        var dict: [String: Any] = [
            "hidePlayerHpBar": ui.hidePlayerHpBar,
            "hideSettingsButton": ui.hideSettingsButton,
            "hideBackButton": ui.hideBackButton,
            "playerInvincible": ui.playerInvincible,
            "disableEnemyAttacks": ui.disableEnemyAttacks,
            "keyboardHintsDefault": ui.keyboardHintsDefault,
        ]
        if let hideMidiToggle = ui.hideMidiToggle { dict["hideMidiToggle"] = hideMidiToggle }
        if let showExitButton = ui.showExitButton { dict["showExitButton"] = showExitButton }
        return dict
    }

    // MARK: - Scenes

    private static func dialogueScene(_ scene: SurvivalTutorialV4DialogueScene) -> [String: Any] {
        [
            "type": "dialogue_only",
            "bgm": bgmDictionary(scene.bgm),
            "lines": scene.lines.map(dialogueLine),
        ]
    }

    private static func demoScene(_ scene: SurvivalTutorialV4DemoScene) -> [String: Any] {
        [
            "type": "demo_play",
            "bgm": bgmDictionary(scene.bgm),
            "bpm": scene.bpm,
            "beatsPerMeasure": scene.beatsPerMeasure,
            "keyFifths": scene.keyFifths,
            "chords": scene.chords.map(demoChordEvent),
            "lines": scene.lines.map(demoLine),
            "livePlayback": true,
            "endHoldBeats": 0,
        ]
    }

    /// 各塊（onset 単位）にセリフを割り当てる。塊の startBeat <= line.startBeat となる
    /// 最後の塊に紐付け（=その拍で鳴っている塊にセリフを同期）。最初の塊より前のセリフは intro。
    private static func assignPlayQuotes(
        _ scene: SurvivalTutorialV4PlayScene
    ) -> (quoteByIndex: [Int: SurvivalTutorialV4Line], intro: SurvivalTutorialV4Line?) {
        var quoteByIndex: [Int: SurvivalTutorialV4Line] = [:]
        var intro: SurvivalTutorialV4Line?
        let sortedLines = scene.lines.sorted { $0.startBeat < $1.startBeat }
        for line in sortedLines {
            var idx = -1
            for i in scene.questions.indices {
                if scene.questions[i].startBeat <= line.startBeat {
                    idx = i
                } else {
                    break
                }
            }
            if idx < 0 {
                if intro == nil { intro = line }
                continue
            }
            if quoteByIndex[idx] == nil { quoteByIndex[idx] = line }
        }
        return (quoteByIndex, intro)
    }

    private static func playScene(
        _ scene: SurvivalTutorialV4PlayScene,
        contentRef: String,
        intro: SurvivalTutorialV4Line?
    ) -> [String: Any] {
        let introDialogue: [String: Any] = intro.map(dialogueLine) ?? ["ja": "", "en": ""]
        return [
            "type": "phrase_battle",
            "bgm": bgmDictionary(scene.bgm),
            "contentRef": contentRef,
            "requiredLoops": 1,
            "playAlong": true,
            "dialogue": [
                "intro": introDialogue,
                "onReveal": ["ja": "", "en": ""],
                "onCorrectRemaining": ["ja": "", "en": ""],
            ],
        ]
    }

    private static func bgmDictionary(_ bgm: SurvivalTutorialV4SceneBgm) -> [String: Any] {
        var dict: [String: Any] = ["resetOnEnter": bgm.resetOnEnter]
        if let url = bgm.url { dict["url"] = url }
        return dict
    }

    private static func playContentBlock(
        _ scene: SurvivalTutorialV4PlayScene,
        quoteByIndex: [Int: SurvivalTutorialV4Line]
    ) -> [String: Any] {
        var chords: [[String: Any]] = []
        for (idx, chunk) in scene.questions.enumerated() {
            var chord: [String: Any] = [
                "name": chunk.chordName,
                "voicing": chunk.notes,
                "measure_number": chunk.measureNumber,
            ]
            if let names = chunk.noteNames { chord["voicingNames"] = names }
            if let staves = chunk.noteStaves { chord["voicing_staves"] = staves }
            if let quote = quoteByIndex[idx] { chord["quote"] = dialogueLine(quote) }
            if !chunk.bass.isEmpty { chord["bass"] = chunk.bass }
            chords.append(chord)
        }
        let phrase: [String: Any] = [
            "order_index": 0,
            "title": scene.id,
            "title_en": scene.id,
            "audio_url": scene.bgm.url ?? NSNull(),
            "loop_duration_sec": NSNull(),
            "key_fifths": scene.keyFifths,
            "chords": chords,
        ]
        return [
            "stage": [
                "name": scene.id,
                "nameEn": scene.id,
                "chordDisplayName": scene.id,
                "chordDisplayNameEn": scene.id,
                "stageType": "progression",
                "mapCategory": "phrases",
            ],
            "phrases": [phrase],
        ]
    }

    // MARK: - Lines & chords

    private static func dialogueLine(_ line: SurvivalTutorialV4Line) -> [String: Any] {
        var dict: [String: Any] = ["ja": line.ja, "en": line.en]
        if let speaker = line.speaker { dict["speaker"] = speaker }
        return dict
    }

    private static func demoLine(_ line: SurvivalTutorialV4Line) -> [String: Any] {
        var dict: [String: Any] = ["ja": line.ja, "en": line.en, "startBeat": line.startBeat]
        if let speaker = line.speaker { dict["speaker"] = speaker }
        if let durationBeats = line.durationBeats { dict["durationBeats"] = durationBeats }
        return dict
    }

    private static func demoChordEvent(_ chunk: SurvivalTutorialV4Chunk) -> [String: Any] {
        var dict: [String: Any] = [
            "startBeat": chunk.startBeat,
            "durationBeats": chunk.durationBeats,
            "chordName": chunk.chordName,
            "voicing": chunk.notes,
            "measureNumber": chunk.measureNumber,
        ]
        if let names = chunk.noteNames { dict["voicingNames"] = names }
        if let staves = chunk.noteStaves { dict["voicing_staves"] = staves }
        if let keyFifths = chunk.keyFifths { dict["keyFifths"] = keyFifths }
        if !chunk.bass.isEmpty { dict["bass"] = chunk.bass }
        return dict
    }
}
