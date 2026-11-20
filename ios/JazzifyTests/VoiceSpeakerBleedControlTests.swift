import XCTest
@testable import Jazzify

final class VoiceSpeakerBleedControlTests: XCTestCase {
    func testDuckFactorWhenVoiceInactive() {
        XCTAssertEqual(
            VoiceInputAudioPolicy.duckFactor(hasHeadphones: false, voiceInputActive: false),
            1,
            accuracy: 0.0001
        )
    }

    func testDuckFactorSpeakerVsHeadphones() {
        XCTAssertEqual(
            VoiceInputAudioPolicy.duckFactor(hasHeadphones: false, voiceInputActive: true),
            VoiceInputAudioPolicy.defaultSpeakerDuckFactor,
            accuracy: 0.0001
        )
        XCTAssertEqual(
            VoiceInputAudioPolicy.duckFactor(hasHeadphones: true, voiceInputActive: true),
            1,
            accuracy: 0.0001
        )
    }

    func testSeparateTracksMelodyGainMutesOnSpeakerWithVoice() {
        XCTAssertEqual(
            VoiceInputAudioPolicy.separateTracksMelodyGain(hasHeadphones: false, voiceInputActive: true),
            0,
            accuracy: 0.0001
        )
        XCTAssertEqual(
            VoiceInputAudioPolicy.separateTracksMelodyGain(hasHeadphones: true, voiceInputActive: true),
            VoiceInputAudioPolicy.defaultMelodyGain,
            accuracy: 0.0001
        )
    }

    func testNoteOnThresholdScalesWithOutputLevel() {
        let quiet = VoiceInputAudioPolicy.noteOnThresholdDb(hasHeadphones: false, effectiveOutputLevel: 0)
        let loud = VoiceInputAudioPolicy.noteOnThresholdDb(hasHeadphones: false, effectiveOutputLevel: 1)
        XCTAssertLessThan(quiet, loud)
        XCTAssertEqual(quiet, -34, accuracy: 0.01)
        XCTAssertEqual(loud, -26, accuracy: 0.01)
        XCTAssertEqual(
            VoiceInputAudioPolicy.noteOnThresholdDb(hasHeadphones: true, effectiveOutputLevel: 1),
            -120,
            accuracy: 0.01
        )
    }

    func testInputGatePeakHoldAndBypass() {
        var gate = VoiceSpeakerInputGate()
        gate.recordChunkRms(linearRms: 0.1, nowMs: 0)
        let threshold = -30.0
        XCTAssertTrue(gate.allowsNoteOn(hasHeadphones: true, thresholdDb: threshold))
        XCTAssertTrue(gate.allowsNoteOn(hasHeadphones: false, thresholdDb: threshold))
        XCTAssertTrue(gate.allowsNoteOn(hasHeadphones: false, thresholdDb: -50))

        gate.recordChunkRms(linearRms: 1e-6, nowMs: 50)
        XCTAssertTrue(gate.allowsNoteOn(hasHeadphones: false, thresholdDb: threshold))

        gate.recordChunkRms(linearRms: 1e-6, nowMs: 200)
        XCTAssertFalse(gate.allowsNoteOn(hasHeadphones: false, thresholdDb: threshold))

        gate.reset()
        XCTAssertFalse(gate.allowsNoteOn(hasHeadphones: false, thresholdDb: threshold))
    }

    func testRmsLinearToDb() {
        XCTAssertEqual(VoiceSpeakerInputGate.rmsLinearToDb(0), -120, accuracy: 0.01)
        XCTAssertEqual(VoiceSpeakerInputGate.rmsLinearToDb(0.1), -20, accuracy: 0.1)
    }
}