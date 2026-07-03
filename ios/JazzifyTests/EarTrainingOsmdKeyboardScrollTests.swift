import XCTest
@testable import Jazzify

/// WEB `CHORD_OSMD_JUDGMENT_*` と iOS `EarTrainingChordOSMDBattleController` の判定窓ロジック（純粋関数テスト用）。
private enum OsmdJudgmentTiming {
    static let windowSec = 0.3
    static let offsetSec = 0.04

    static func judgedCenter(targetTimeSec: Double) -> Double {
        targetTimeSec + offsetSec
    }

    static func isWithinWindow(phraseTime: Double, targetTimeSec: Double) -> Bool {
        let judged = judgedCenter(targetTimeSec: targetTimeSec)
        let delta = phraseTime - judged
        return delta >= -windowSec && delta <= windowSec
    }

    static func shouldPruneActiveTarget(currentTime: Double, targetTimeSec: Double) -> Bool {
        currentTime > targetTimeSec + offsetSec + windowSec
    }
}

final class EarTrainingOsmdKeyboardScrollTests: XCTestCase {
    func testResolvedOsmdTargetsFromScoreDefaultsTrueForChordOsmdMode() {
        let stage = makeOsmdStage(osmdTargetsFromScore: nil)
        XCTAssertTrue(stage.resolvedOsmdTargetsFromScore)
    }

    func testResolvedOsmdTargetsFromScoreExplicitFalse() {
        let stage = makeOsmdStage(osmdTargetsFromScore: false)
        XCTAssertFalse(stage.resolvedOsmdTargetsFromScore)
    }

    func testResolvedOsmdTargetsFromScoreExplicitTrue() {
        let stage = makeOsmdStage(osmdTargetsFromScore: true)
        XCTAssertTrue(stage.resolvedOsmdTargetsFromScore)
    }

    func testResolvedOsmdTargetsFromScoreNonOsmdModeDefaultsFalse() {
        let stage = makeOsmdStage(mode: .phrase, osmdTargetsFromScore: nil)
        XCTAssertFalse(stage.resolvedOsmdTargetsFromScore)
    }

    func testCollectAttacksHighNoteDrivesScrollAnchor() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1">
          <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>1</divisions></attributes>
              <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
              <note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration></note>
            </measure>
          </part>
        </score-partwise>
        """
        let prepared = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXmlWithMeta(xml)
        let attacks = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(prepared.xml)
        XCTAssertFalse(attacks.isEmpty)
        let maxMidi = attacks.flatMap(\.midis).max()
        XCTAssertEqual(maxMidi, 79)
        XCTAssertEqual(
            SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: maxMidi!),
            81
        )
    }

    func testJudgmentWindowMatchesWebOffsetAndWidth() {
        let targetTimeSec = 0.0
        XCTAssertTrue(OsmdJudgmentTiming.isWithinWindow(phraseTime: -0.21, targetTimeSec: targetTimeSec))
        XCTAssertFalse(OsmdJudgmentTiming.isWithinWindow(phraseTime: -0.22, targetTimeSec: targetTimeSec))
        XCTAssertTrue(OsmdJudgmentTiming.isWithinWindow(phraseTime: 0.34, targetTimeSec: targetTimeSec))
        XCTAssertFalse(OsmdJudgmentTiming.isWithinWindow(phraseTime: 0.35, targetTimeSec: targetTimeSec))
        XCTAssertEqual(OsmdJudgmentTiming.judgedCenter(targetTimeSec: 1.0), 1.04)
    }

    func testCountInEarlyInputWithinWindowForFirstTarget() {
        XCTAssertTrue(OsmdJudgmentTiming.isWithinWindow(phraseTime: -0.05, targetTimeSec: 0))
    }

    func testActiveTargetPruneUsesOffsetPlusWindow() {
        let targetTimeSec = 1.0
        XCTAssertFalse(OsmdJudgmentTiming.shouldPruneActiveTarget(currentTime: 1.34, targetTimeSec: targetTimeSec))
        XCTAssertTrue(OsmdJudgmentTiming.shouldPruneActiveTarget(currentTime: 1.35, targetTimeSec: targetTimeSec))
    }

    private func makeOsmdStage(
        mode: EarTrainingMode = .chordOSMD,
        osmdTargetsFromScore: Bool?
    ) -> EarTrainingStageDetail {
        EarTrainingStageDetail(
            id: UUID(),
            slug: "osmd-test",
            title: "Test",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            bpm: 120,
            beatsPerMeasure: 4,
            beatType: 4,
            loopMeasures: 4,
            maxLoopsPerPhrase: 4,
            countInBeats: 0,
            timeLimitSec: 120,
            playerHp: 100,
            enemyHp: 100,
            perCorrectNoteDamage: 10,
            goodCompletionDamage: 20,
            greatCompletionDamage: 30,
            perfectCompletionDamage: 40,
            missDamage: 5,
            failDamage: 10,
            perfectMaxMisses: 0,
            greatMaxMisses: 2,
            backgroundTheme: nil,
            isActive: true,
            mode: mode,
            keyFifths: 0,
            phrases: nil,
            osmdTargetsFromScore: osmdTargetsFromScore
        )
    }
}
