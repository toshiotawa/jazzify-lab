import XCTest
@testable import Jazzify

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
