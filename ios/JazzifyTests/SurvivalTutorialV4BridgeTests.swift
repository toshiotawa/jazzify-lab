import XCTest
@testable import Jazzify

/// V4 manifest → V3 ペイロード変換(`SurvivalTutorialV4Bridge`)の検証。
/// Web の `survivalTutorialV4ManifestToV3Payload.test.ts` と同じ写像を確認する。
final class SurvivalTutorialV4BridgeTests: XCTestCase {
    private let sampleJson = """
    {
      "version": 4,
      "id": "sample_stage_v4",
      "assets": {
        "midi": "sampleStageV4.mid",
        "bgm": { "url": "sample_bgm_loop.mp3" }
      },
      "bpm": 120,
      "beatsPerMeasure": 4,
      "keyFifths": 0,
      "ui": {
        "hidePlayerHpBar": true,
        "hideSettingsButton": true,
        "hideBackButton": true,
        "hideMidiToggle": true,
        "showExitButton": true,
        "playerInvincible": true,
        "disableEnemyAttacks": true,
        "keyboardHintsDefault": true
      },
      "scenes": [
        {
          "id": "S1",
          "start": { "measure": 1, "beat": 1 },
          "end": { "measure": 3, "beat": 1 },
          "bgm": { "url": "sample_bgm_loop.mp3", "resetOnEnter": false },
          "keyFifths": 0,
          "beatsPerMeasure": 4,
          "bpm": 120,
          "midi": { "startTick": 0, "endTick": 3840, "startSec": 0, "endSec": 4 },
          "sceneType": "dialogue",
          "lines": [
            { "ja": "ようこそ。", "en": "Welcome.", "speaker": "fai", "startBeat": 0, "durationBeats": 2 },
            { "ja": "ジャ爺じゃ。", "en": "I am Jajii.", "speaker": "jajii", "startBeat": 2 }
          ]
        },
        {
          "id": "S2",
          "start": { "measure": 3, "beat": 1 },
          "end": { "measure": 5, "beat": 1 },
          "bgm": { "url": "sample_bgm_loop.mp3", "resetOnEnter": true },
          "keyFifths": 0,
          "beatsPerMeasure": 4,
          "bpm": 120,
          "midi": { "startTick": 3840, "endTick": 7680, "startSec": 4, "endSec": 8 },
          "sceneType": "demo",
          "chords": [
            {
              "startBeat": 0,
              "durationBeats": 2,
              "measureNumber": 3,
              "chordName": "Dm7",
              "notes": [53, 57, 60, 76],
              "noteNames": ["F3", "A3", "C4", "E5"],
              "noteStaves": [2, 2, 2, 1],
              "bass": [38],
              "bassNames": ["D2"],
              "keyFifths": 0
            }
          ],
          "lines": [
            { "ja": "Dm7。", "en": "Dm7.", "speaker": "fai", "startBeat": 0, "durationBeats": 2 }
          ]
        },
        {
          "id": "S3",
          "start": { "measure": 5, "beat": 1 },
          "end": { "measure": 7, "beat": 1 },
          "bgm": { "url": "sample_bgm_loop.mp3", "resetOnEnter": false },
          "keyFifths": 0,
          "beatsPerMeasure": 4,
          "bpm": 120,
          "midi": { "startTick": 7680, "endTick": 11520, "startSec": 8, "endSec": 12 },
          "sceneType": "play",
          "questions": [
            {
              "startBeat": 0,
              "durationBeats": 1,
              "measureNumber": 5,
              "chordName": "Dm7",
              "notes": [74],
              "noteNames": ["D5"],
              "noteStaves": [1],
              "bass": [38],
              "bassNames": ["D2"],
              "keyFifths": 0
            },
            {
              "startBeat": 4,
              "durationBeats": 4,
              "measureNumber": 6,
              "chordName": "",
              "notes": [],
              "bass": [],
              "keyFifths": 0
            }
          ],
          "lines": [
            { "ja": "弾いてみよう。", "en": "Try playing.", "speaker": "fai", "startBeat": 0 }
          ]
        }
      ]
    }
    """

    private func makeV3Payload() throws -> SurvivalTutorialScriptPayloadV3 {
        let manifest = try JSONDecoder().decode(
            SurvivalTutorialV4Manifest.self,
            from: sampleJson.data(using: .utf8)!
        )
        return try SurvivalTutorialV4Bridge.toV3Payload(manifest)
    }

    func testProducesInterpretedV3() throws {
        let payload = try makeV3Payload()
        XCTAssertTrue(payload.isInterpretedV3)
        XCTAssertEqual(payload.version, 3)
        // dialogue / demo / play / finish の 4 シーン。
        XCTAssertEqual(payload.scenes.count, 4)
        XCTAssertTrue(payload.scenes.last?.isFinish ?? false)
        XCTAssertEqual(payload.finish?.showCta, true)
    }

    func testSceneTypeMapping() throws {
        let payload = try makeV3Payload()
        guard case let .dialogueOnly(dialogue) = payload.scenes[0] else {
            return XCTFail("Expected dialogue_only scene")
        }
        XCTAssertEqual(dialogue.lines.count, 2)
        XCTAssertEqual(dialogue.lines[0].speaker, "fai")
        XCTAssertEqual(dialogue.lines[1].speaker, "jajii")
        XCTAssertEqual(dialogue.bgm?.url, "sample_bgm_loop.mp3")
        XCTAssertEqual(dialogue.bgm?.resetOnEnter, false)

        guard case let .demoPlay(demo) = payload.scenes[1] else {
            return XCTFail("Expected demo_play scene")
        }
        XCTAssertEqual(demo.bpm, 120, accuracy: 0.0001)
        let firstChord = demo.chords[0]
        XCTAssertEqual(firstChord.chordName, "Dm7")
        XCTAssertEqual(firstChord.voicing, [53, 57, 60, 76])
        XCTAssertEqual(firstChord.measure_number, 3)
        XCTAssertEqual(firstChord.voicing_staves, [2, 2, 2, 1])
        XCTAssertEqual(demo.lines.count, 1)
        XCTAssertEqual(demo.lines[0].startBeat, 0, accuracy: 0.0001)
        XCTAssertEqual(demo.bgm?.resetOnEnter, true)

        XCTAssertTrue(payload.scenes[2].isPhraseBattle)
        XCTAssertEqual(payload.scenes[2].bgm?.resetOnEnter, false)
    }

    func testPlayContentIncludesRestAndBass() throws {
        let payload = try makeV3Payload()
        guard case let .phraseBattle(phrase) = payload.scenes[2] else {
            return XCTFail("Expected phrase_battle scene")
        }
        XCTAssertEqual(phrase.playAlong, true)
        XCTAssertEqual(phrase.requiredLoops, 1)
        guard case let .phraseStage(block)? = payload.content[phrase.contentRef] else {
            return XCTFail("Expected phrase content block")
        }
        let chords = block.phrases[0].chords
        // 非休符塊 + 休符塊(measure6 notes=[]) も保持する。
        let voiced = chords.filter { !$0.voicing.isEmpty }
        XCTAssertEqual(voiced.first?.name, "Dm7")
        XCTAssertEqual(voiced.first?.voicing, [74])
        XCTAssertEqual(voiced.first?.measure_number, 5)
        XCTAssertEqual(voiced.first?.bass, [38])
        XCTAssertTrue(chords.contains { $0.voicing.isEmpty })
        XCTAssertEqual(block.stage.mapCategory, "phrases")
    }

    func testBgmMappedToDrumLoop() throws {
        let payload = try makeV3Payload()
        XCTAssertEqual(payload.audioTracks?.drum_loop?.url, "sample_bgm_loop.mp3")
    }
}
