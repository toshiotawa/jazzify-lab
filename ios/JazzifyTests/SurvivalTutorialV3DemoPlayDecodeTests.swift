import XCTest
@testable import Jazzify

final class SurvivalTutorialV3DemoPlayDecodeTests: XCTestCase {
    func testDecodesDemoPlayScene() throws {
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
                  "measure_number": 1
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
            XCTAssertEqual(scene.lines.count, 1)
        } else {
            XCTFail("Expected demoPlay scene")
        }
    }
}
