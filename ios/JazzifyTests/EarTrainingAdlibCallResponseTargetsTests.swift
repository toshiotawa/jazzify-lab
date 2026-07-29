import XCTest
@testable import Jazzify

final class EarTrainingAdlibCallResponseTargetsTests: XCTestCase {
    private func miniScore(_ measureInner: String) -> String {
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1">
          <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">\(measureInner)</measure>
          </part>
        </score-partwise>
        """
    }

    func testCollectAttacksKeepsVoice1ChordClusterAndIgnoresOtherVoices() {
        let xml = miniScore("""
        <attributes><divisions>1</divisions></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
        <note><chord/><pitch><step>E</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
        <note><chord/><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
        <note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
        <note><chord/><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
        <backup><duration>1</duration></backup>
        <note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration><voice>2</voice></note>
        <backup><duration>1</duration></backup>
        <note><pitch><step>A</step><octave>5</octave></pitch><duration>1</duration><voice>3</voice></note>
        """)

        let attacks = EarTrainingAdlibCallResponseTargets.collectAttacks(from: xml)
        XCTAssertEqual(attacks.count, 1)
        // C4=60, Eb4=63, F4=65, G4=67, Bb4=70
        XCTAssertEqual(attacks[0].midis, [60, 63, 65, 67, 70])
    }

    func testCollectAttacksReturnsEmptyForCallMeasureWithoutVoice1Notes() {
        let xml = miniScore("""
        <attributes><divisions>1</divisions></attributes>
        <note><rest/><duration>1</duration><voice>1</voice></note>
        <backup><duration>1</duration></backup>
        <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>4</voice></note>
        """)

        XCTAssertTrue(EarTrainingAdlibCallResponseTargets.collectAttacks(from: xml).isEmpty)
    }

    func testBuildTargetsProducesPitchClassSetAndGuideMidis() {
        let attacks = [
            ChordOsmdMusicXmlAttack(measureNumber: 1, beatStartInMeasure: 1, midis: [60, 63, 65, 67, 70]),
        ]
        let targets = EarTrainingAdlibCallResponseTargets.buildTargets(attacks: attacks, bpm: 120, beatsPerMeasure: 4)

        XCTAssertEqual(targets.count, 1)
        XCTAssertEqual(targets[0].targetTimeSec, 0, accuracy: 1e-5)
        XCTAssertEqual(targets[0].acceptedPitchClasses.sorted(), [0, 3, 5, 7, 10])
        XCTAssertEqual(targets[0].guideMidis, [60, 63, 65, 67, 70])
    }

    func testMatchesIsOctaveEquivalentSoC3MatchesRegisteredC5() {
        let attacks = [ChordOsmdMusicXmlAttack(measureNumber: 1, beatStartInMeasure: 1, midis: [72])]
        let targets = EarTrainingAdlibCallResponseTargets.buildTargets(attacks: attacks, bpm: 120, beatsPerMeasure: 4)

        XCTAssertTrue(EarTrainingAdlibCallResponseTargets.matches(targets[0], midi: 48)) // C3
        XCTAssertTrue(EarTrainingAdlibCallResponseTargets.matches(targets[0], midi: 60)) // C4
        XCTAssertTrue(EarTrainingAdlibCallResponseTargets.matches(targets[0], midi: 72)) // C5
        XCTAssertFalse(EarTrainingAdlibCallResponseTargets.matches(targets[0], midi: 61)) // C#
    }

    func testMatchesCompletesOnAnySingleChordTone() {
        let attacks = [ChordOsmdMusicXmlAttack(measureNumber: 1, beatStartInMeasure: 1, midis: [60, 63, 65, 67, 70])]
        let targets = EarTrainingAdlibCallResponseTargets.buildTargets(attacks: attacks, bpm: 120, beatsPerMeasure: 4)

        XCTAssertTrue(EarTrainingAdlibCallResponseTargets.matches(targets[0], midi: 67))
        XCTAssertFalse(EarTrainingAdlibCallResponseTargets.matches(targets[0], midi: 64))
    }

    func testHitRatioDenominatorIsTargetCount() {
        let attacks = [
            ChordOsmdMusicXmlAttack(measureNumber: 1, beatStartInMeasure: 1, midis: [60, 63, 65]),
            ChordOsmdMusicXmlAttack(measureNumber: 1, beatStartInMeasure: 2, midis: [67, 70]),
        ]
        let targets = EarTrainingAdlibCallResponseTargets.buildTargets(attacks: attacks, bpm: 120, beatsPerMeasure: 4)

        XCTAssertEqual(targets.count, 2)
        XCTAssertEqual(
            EarTrainingAdlibCallResponseTargets.hitRatio(targetCount: targets.count, completedCount: 1),
            0.5,
            accuracy: 1e-5
        )
        XCTAssertEqual(
            EarTrainingAdlibCallResponseTargets.hitRatio(targetCount: targets.count, completedCount: 2),
            1,
            accuracy: 1e-5
        )
    }

    func testHintGroupsSplitOnGuideMidiChange() {
        let cde = [60, 62, 64]
        let cdef = [60, 62, 64, 65]
        var attacks: [ChordOsmdMusicXmlAttack] = []
        for beat in 1...4 {
            attacks.append(ChordOsmdMusicXmlAttack(measureNumber: 2, beatStartInMeasure: Double(beat), midis: cde))
        }
        for beat in 1...4 {
            attacks.append(ChordOsmdMusicXmlAttack(measureNumber: 3, beatStartInMeasure: Double(beat), midis: cdef))
        }
        let targets = EarTrainingAdlibCallResponseTargets.buildTargets(attacks: attacks, bpm: 120, beatsPerMeasure: 4)
        let groups = EarTrainingAdlibCallResponseTargets.buildHintGroups(from: targets)

        XCTAssertEqual(groups.count, 2)
        XCTAssertEqual(groups[0].startIndex, 0)
        XCTAssertEqual(groups[0].endIndex, 3)
        XCTAssertEqual(groups[0].guideMidis, cde)
        XCTAssertEqual(groups[1].startIndex, 4)
        XCTAssertEqual(groups[1].endIndex, 7)
        XCTAssertEqual(groups[1].guideMidis, cdef)
    }

    func testActiveHintKeepsPriorGroupUntilSettledEvenIfNextThrowStarted() {
        let cde = [60, 62, 64]
        let cdef = [60, 62, 64, 65]
        var attacks: [ChordOsmdMusicXmlAttack] = []
        for beat in 1...4 {
            attacks.append(ChordOsmdMusicXmlAttack(measureNumber: 2, beatStartInMeasure: Double(beat), midis: cde))
        }
        for beat in 1...4 {
            attacks.append(ChordOsmdMusicXmlAttack(measureNumber: 3, beatStartInMeasure: Double(beat), midis: cdef))
        }
        let targets = EarTrainingAdlibCallResponseTargets.buildTargets(attacks: attacks, bpm: 120, beatsPerMeasure: 4)
        let groups = EarTrainingAdlibCallResponseTargets.buildHintGroups(from: targets)
        var settled = Set<String>()

        func resolve(_ phraseTimeSec: Double) -> [Int]? {
            EarTrainingAdlibCallResponseTargets.resolveActiveHintGuideMidis(
                targets: targets,
                groups: groups,
                phraseTimeSec: phraseTimeSec,
                hammerLeadSec: 2,
                lateWindowSec: 0.3,
                resolveJudgedTargetTimeSec: { $0 },
                isLastTargetSettled: { settled.contains($0) }
            )
        }

        XCTAssertEqual(resolve(0), cde)
        XCTAssertNil(resolve(-0.01))
        XCTAssertEqual(resolve(2), cde)
        XCTAssertEqual(resolve(3.7), cde)
        XCTAssertEqual(resolve(3.81), cdef)

        settled.insert(targets[3].id)
        XCTAssertEqual(resolve(3.5), cdef)
        settled.removeAll()

        XCTAssertEqual(resolve(5.7), cdef)
        XCTAssertNil(resolve(5.81))
        settled.insert(targets[7].id)
        XCTAssertNil(resolve(5.5))
    }
}
