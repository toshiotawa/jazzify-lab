import XCTest
@testable import Jazzify

final class SurvivalTutorialV3DrumLoopSourceResolverTests: XCTestCase {
    func testResolvePrefersRemoteWhenUrlPresent() {
        let url = "https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: url, hasBundledDrumLoop: true)
        guard case let .remote(remote) = source else {
            return XCTFail("Expected remote source")
        }
        XCTAssertEqual(remote.absoluteString, url)
    }

    func testResolveUsesBundledWhenUrlEmpty() {
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: "  ", hasBundledDrumLoop: true)
        XCTAssertEqual(source, .bundled)
    }

    func testResolveUsesBundledWhenUrlNil() {
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: nil, hasBundledDrumLoop: true)
        XCTAssertEqual(source, .bundled)
    }

    func testResolveNoneWhenNoUrlAndNoBundle() {
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: nil, hasBundledDrumLoop: false)
        XCTAssertEqual(source, .none)
    }

    func testResolveTrimsWhitespaceBeforeRemote() {
        let url = "https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"
        let source = SurvivalTutorialV3DrumLoopSourceResolver.resolve(
            urlString: "  \(url)  ",
            hasBundledDrumLoop: false
        )
        guard case let .remote(remote) = source else {
            return XCTFail("Expected remote source")
        }
        XCTAssertEqual(remote.absoluteString, url)
    }

    func testDemoPlayAudioResolverPrefersLocaleUrl() throws {
        let script = try decodeScript(
            audioTracksJson: """
            {"drum_loop":{"url":"https://cdn.example/fallback.mp3","volume":0.5}}
            """,
            demoAudioJson: """
            {"url_ja":"https://cdn.example/ja.mp3","url_en":"https://cdn.example/en.mp3","volume":0.28}
            """
        )
        guard case let .demoPlay(scene) = script.scenes[0] else {
            return XCTFail("Expected demo_play scene")
        }
        XCTAssertEqual(
            SurvivalTutorialV3DemoPlayAudioResolver.resolveUrlString(
                scene: scene,
                script: script,
                locale: .ja
            ),
            "https://cdn.example/ja.mp3"
        )
        XCTAssertEqual(
            SurvivalTutorialV3DemoPlayAudioResolver.resolveUrlString(
                scene: scene,
                script: script,
                locale: .en
            ),
            "https://cdn.example/en.mp3"
        )
        XCTAssertEqual(
            SurvivalTutorialV3DemoPlayAudioResolver.resolveVolume(scene: scene, script: script),
            0.28,
            accuracy: 0.0001
        )
    }

    func testDemoPlayAudioResolverFallsBackToDrumLoop() throws {
        let script = try decodeScript(
            audioTracksJson: """
            {"drum_loop":{"url":"https://cdn.example/fallback.mp3","volume":0.5}}
            """,
            demoAudioJson: "null"
        )
        guard case let .demoPlay(scene) = script.scenes[0] else {
            return XCTFail("Expected demo_play scene")
        }
        XCTAssertEqual(
            SurvivalTutorialV3DemoPlayAudioResolver.resolveUrlString(
                scene: scene,
                script: script,
                locale: .en
            ),
            "https://cdn.example/fallback.mp3"
        )
        XCTAssertEqual(
            SurvivalTutorialV3DemoPlayAudioResolver.resolveVolume(scene: scene, script: script),
            0.5,
            accuracy: 0.0001
        )
    }

    private func decodeScript(audioTracksJson: String, demoAudioJson: String) throws -> SurvivalTutorialScriptPayloadV3 {
        let json = """
        {
          "version": 3,
          "audioTracks": \(audioTracksJson),
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
              "bpm": 100,
              "chords": [],
              "lines": [],
              "audio": \(demoAudioJson)
            }
          ]
        }
        """.data(using: .utf8)!
        return try JSONDecoder().decode(SurvivalTutorialScriptPayloadV3.self, from: json)
    }
}

final class SurvivalTutorialDemoPlaySchedulerAnchorTests: XCTestCase {
    func testAnchoredDelaySecondsClampsNegativeToZero() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(atSeconds: 1.5, elapsedSeconds: 2.0),
            0,
            accuracy: 0.0001
        )
    }

    func testAnchoredDelaySecondsSubtractsElapsed() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(atSeconds: 1.5, elapsedSeconds: 0.5),
            1.0,
            accuracy: 0.0001
        )
    }

    func testAnchoredDelaySecondsAtAnchorIsFullDelay() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(atSeconds: 1.5, elapsedSeconds: 0),
            1.5,
            accuracy: 0.0001
        )
    }

    func testAnchoredDelaySecondsPositiveAdvanceFiresEarlier() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(
                atSeconds: 1.5,
                elapsedSeconds: 0.5,
                advanceSeconds: 0.2
            ),
            0.8,
            accuracy: 0.0001
        )
    }

    func testAnchoredDelaySecondsNegativeAdvanceFiresLater() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(
                atSeconds: 1.5,
                elapsedSeconds: 0.5,
                advanceSeconds: -0.3
            ),
            1.3,
            accuracy: 0.0001
        )
    }

    func testAnchoredDelaySecondsAdvanceClampsNegativeToZero() {
        XCTAssertEqual(
            SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(
                atSeconds: 0.1,
                elapsedSeconds: 0,
                advanceSeconds: 0.3
            ),
            0,
            accuracy: 0.0001
        )
    }

    func testMaxVoicingMidiIgnoresRestMeasures() throws {
        let scene = try decodeDemoPlayScene(
            chordsJson: """
            [
              {"startBeat":0,"durationBeats":2,"chordName":"Dm7","voicing":[53,57,60,64],"measureNumber":1},
              {"startBeat":12,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":4},
              {"startBeat":16,"durationBeats":0.5,"chordName":"C","voicing":[100],"measureNumber":5}
            ]
            """
        )
        XCTAssertEqual(SurvivalTutorialDemoPlayScheduler.maxVoicingMidi(in: scene.chords), 100)
    }

    func testDemoPlayScrollAnchorUsesScriptMaxNotOnboardingIiVi() throws {
        let scene = try decodeDemoPlayScene(
            chordsJson: """
            [
              {"startBeat":0,"durationBeats":2,"chordName":"Dm7","voicing":[53,57,60,64],"measureNumber":1},
              {"startBeat":16,"durationBeats":0.5,"chordName":"high","voicing":[100],"measureNumber":5}
            ]
            """
        )
        let scrollChords = SurvivalTutorialDemoPlayScheduler.resolvedChordsForKeyboardScroll(in: scene.chords)
        guard let maxMidi = SurvivalPhraseKeyboardScroll.maxPitchMidi(in: scrollChords) else {
            XCTFail("Expected max midi")
            return
        }
        XCTAssertEqual(maxMidi, 100)
        XCTAssertGreaterThan(
            SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: maxMidi),
            SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: 64)
        )
    }

    private func decodeDemoPlayScene(chordsJson: String) throws -> SurvivalTutorialV3DemoPlayScene {
        let json = """
        {
          "type": "demo_play",
          "bpm": 160,
          "chords": \(chordsJson)
        }
        """.data(using: .utf8)!
        return try JSONDecoder().decode(SurvivalTutorialV3DemoPlayScene.self, from: json)
    }
}
