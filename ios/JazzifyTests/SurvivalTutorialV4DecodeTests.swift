import XCTest
@testable import Jazzify

final class SurvivalTutorialV4DecodeTests: XCTestCase {
    /// `scripts/build-survival-tutorial-v4.mjs` が出力する manifest と同形の JSON。
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
            { "ja": "ようこそ、サバイバルへ。", "en": "", "speaker": "fai", "startBeat": 0, "durationBeats": 2 },
            { "ja": "わしがジャ爺じゃ。", "en": "", "speaker": "jajii", "startBeat": 2 }
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
            { "ja": "Dm7、見ていてくれ。", "en": "", "speaker": "fai", "startBeat": 0, "durationBeats": 2 }
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
              "startBeat": 1,
              "durationBeats": 1,
              "measureNumber": 5,
              "chordName": "",
              "notes": [77],
              "noteNames": ["F5"],
              "noteStaves": [1],
              "bass": [],
              "bassNames": [],
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
            { "ja": "ドから弾いてみよう。", "en": "", "speaker": "fai", "startBeat": 0 }
          ]
        }
      ]
    }
    """

    func testDecodesV4Manifest() throws {
        let data = sampleJson.data(using: .utf8)!
        let manifest = try JSONDecoder().decode(SurvivalTutorialV4Manifest.self, from: data)
        XCTAssertTrue(manifest.isInterpretedV4)
        XCTAssertEqual(manifest.version, 4)
        XCTAssertEqual(manifest.id, "sample_stage_v4")
        XCTAssertEqual(manifest.scenes.count, 3)
        XCTAssertEqual(manifest.scenes.map(\.id), ["S1", "S2", "S3"])
    }

    func testDialogueSceneSpeakers() throws {
        let manifest = try JSONDecoder().decode(
            SurvivalTutorialV4Manifest.self,
            from: sampleJson.data(using: .utf8)!
        )
        guard case let .dialogue(scene) = manifest.scenes[0] else {
            return XCTFail("Expected dialogue scene")
        }
        XCTAssertEqual(scene.start.measure, 1)
        XCTAssertEqual(scene.lines[0].speaker, "fai")
        XCTAssertEqual(scene.lines[1].speaker, "jajii")
        XCTAssertEqual(scene.midi.endSec, 4, accuracy: 0.0001)
    }

    func testDemoSceneBassIsSeparateFromNotes() throws {
        let manifest = try JSONDecoder().decode(
            SurvivalTutorialV4Manifest.self,
            from: sampleJson.data(using: .utf8)!
        )
        guard case let .demo(scene) = manifest.scenes[1] else {
            return XCTFail("Expected demo scene")
        }
        XCTAssertTrue(scene.bgm.resetOnEnter)
        let first = scene.chords[0]
        XCTAssertEqual(first.chordName, "Dm7")
        XCTAssertEqual(first.notes, [53, 57, 60, 76])
        XCTAssertEqual(first.bass, [38])
        XCTAssertFalse(first.notes.contains(38))
        XCTAssertFalse(first.noteStaves?.contains(3) ?? false)
    }

    func testPlaySceneChunksAndChordNames() throws {
        let manifest = try JSONDecoder().decode(
            SurvivalTutorialV4Manifest.self,
            from: sampleJson.data(using: .utf8)!
        )
        guard case let .play(scene) = manifest.scenes[2] else {
            return XCTFail("Expected play scene")
        }
        let measure5 = scene.questions.filter { $0.measureNumber == 5 }
        XCTAssertEqual(measure5.map(\.chordName), ["Dm7", ""])
        XCTAssertEqual(measure5[0].bass, [38])
        XCTAssertEqual(measure5[1].bass, [])
        let rest = scene.questions.first { $0.measureNumber == 6 }
        XCTAssertEqual(rest?.notes, [])
        XCTAssertEqual(rest?.bass, [])
    }
}
