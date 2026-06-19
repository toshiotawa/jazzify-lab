import XCTest
@testable import Jazzify

final class SurvivalTutorialV3DemoPlayDecodeTests: XCTestCase {
    func testDecodesDemoPlaySceneWithMeasureNumber() throws {
        let json = """
        {
          "version": 3,
          "ui": {
            "hidePlayerHpBar": true,
            "hideSettingsButton": true,
            "hideBackButton": true,
            "playerInvincible": true,
            "disableEnemyAttacks": true,
            "keyboardHintsDefault": true
          },
          "content": {},
          "scenes": [
            {
              "type": "demo_play",
              "bpm": 160,
              "beatsPerMeasure": 4,
              "chords": [
                {
                  "startBeat": 0,
                  "durationBeats": 2,
                  "chordName": "Dm7",
                  "voicing": [53, 57, 60, 64],
                  "voicingNames": ["F3", "A3", "C4", "E4"],
                  "voicing_staves": [2, 2, 2, 2],
                  "measureNumber": 1,
                  "keyFifths": 0
                }
              ],
              "lines": [
                {
                  "ja": "test",
                  "en": "test",
                  "speaker": "jajii",
                  "startBeat": 2,
                  "durationBeats": 2
                }
              ]
            },
            { "type": "finish" }
          ]
        }
        """.data(using: .utf8)!

        let payload = try JSONDecoder().decode(SurvivalTutorialScriptPayloadV3.self, from: json)
        XCTAssertTrue(payload.isInterpretedV3)
        XCTAssertEqual(payload.scenes.count, 2)
        if case let .demoPlay(scene) = payload.scenes[0] {
            XCTAssertEqual(scene.bpm, 160)
            XCTAssertEqual(scene.chords.count, 1)
            XCTAssertEqual(scene.chords[0].measure_number, 1)
            XCTAssertEqual(scene.lines.count, 1)
        } else {
            XCTFail("Expected demoPlay scene")
        }
    }

    func testDecodesDemoPlayChordWithLegacyMeasureNumberSnakeCase() throws {
        let json = """
        {
          "version": 3,
          "ui": {
            "hidePlayerHpBar": true,
            "hideSettingsButton": true,
            "hideBackButton": true,
            "playerInvincible": true,
            "disableEnemyAttacks": true,
            "keyboardHintsDefault": true
          },
          "content": {},
          "scenes": [
            {
              "type": "demo_play",
              "bpm": 120,
              "chords": [
                {
                  "startBeat": 0,
                  "durationBeats": 4,
                  "chordName": "C",
                  "voicing": [60],
                  "measure_number": 2
                }
              ],
              "lines": []
            },
            { "type": "finish" }
          ]
        }
        """.data(using: .utf8)!

        let payload = try JSONDecoder().decode(SurvivalTutorialScriptPayloadV3.self, from: json)
        if case let .demoPlay(scene) = payload.scenes[0] {
            XCTAssertEqual(scene.chords[0].measure_number, 2)
        } else {
            XCTFail("Expected demoPlay scene")
        }
    }

    /// `developer-demo-play-v3` migration と同形式の DB 行（script 列のみ）。
    func testDecodesSurvivalTutorialScriptRowLikeDbSeed() throws {
        let json = """
        {
          "id": "developer-demo-play-v3",
          "title": "サバイバルチュートリアル（デモプレイ v3）",
          "title_en": "Survival Tutorial (demo play v3)",
          "script": {
            "version": 3,
            "audioTracks": {
              "drum_loop": {
                "url": "https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3",
                "volume": 0.35
              }
            },
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
            "content": {},
            "scenes": [
              {
                "type": "demo_play",
                "bpm": 160,
                "beatsPerMeasure": 4,
                "keyFifths": 0,
                "chords": [
                  {
                    "startBeat": 0,
                    "durationBeats": 2,
                    "chordName": "Dm7",
                    "voicing": [53, 57, 60, 64],
                    "voicingNames": ["F3", "A3", "C4", "E4"],
                    "voicing_staves": [2, 2, 2, 2],
                    "measureNumber": 1,
                    "keyFifths": 0
                  }
                ],
                "lines": [
                  {
                    "ja": "Dm7、2拍。",
                    "en": "Dm7, two beats.",
                    "speaker": "fai",
                    "startBeat": 0,
                    "durationBeats": 2
                  }
                ],
              },
              { "type": "finish" }
            ],
            "finish": { "showCta": true }
          }
        }
        """.data(using: .utf8)!

        let row = try JSONDecoder().decode(SurvivalTutorialScriptRow.self, from: json)
        XCTAssertEqual(row.id, "developer-demo-play-v3")
        guard let v3 = row.script.interpretedV3, v3.isInterpretedV3 else {
            XCTFail("Expected interpreted v3 script")
            return
        }
        if case let .demoPlay(scene) = v3.scenes[0] {
            XCTAssertEqual(scene.chords[0].chordName, "Dm7")
            XCTAssertEqual(scene.chords[0].measure_number, 1)
        } else {
            XCTFail("Expected demo_play as first scene")
        }
    }
}
