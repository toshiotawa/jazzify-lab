import XCTest
@testable import Jazzify

final class EarTrainingChordOsmdScoreLyricEventsTests: XCTestCase {
    private func miniScorePartwise(_ measureBody: String) -> String {
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1"><part id="P1">
        <measure number="1">
        \(measureBody)
        </measure>
        </part></score-partwise>
        """
    }

    func testCollectScoreLyricEventsEmitsFullVerseSnapshotOnChange() {
        let xml = miniScorePartwise("""
        <attributes><divisions>1</divisions></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>v1</text></lyric></note>
        <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><lyric number="2"><text>v2</text></lyric></note>
        <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><lyric number="5"><text>overlay</text></lyric></note>
        """)
        let events = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdScoreLyricEvents(xml, bpm: 120, beatsPerMeasure: 4)
        XCTAssertEqual(events.count, 6)
        XCTAssertEqual(events[0].targetTimeSec, 0, accuracy: 1e-9)
        XCTAssertEqual(events[0].verseNumber, 1)
        XCTAssertEqual(events[0].text, "v1")
        XCTAssertEqual(events[1].targetTimeSec, 0.5, accuracy: 1e-9)
        XCTAssertEqual(events[1].verseNumber, 1)
        XCTAssertEqual(events[1].text, "v1")
        XCTAssertEqual(events[2].targetTimeSec, 0.5, accuracy: 1e-9)
        XCTAssertEqual(events[2].verseNumber, 2)
        XCTAssertEqual(events[2].text, "v2")
        XCTAssertEqual(events[3].targetTimeSec, 1, accuracy: 1e-9)
        XCTAssertEqual(events[3].verseNumber, 1)
        XCTAssertEqual(events[3].text, "v1")
        XCTAssertEqual(events[4].targetTimeSec, 1, accuracy: 1e-9)
        XCTAssertEqual(events[4].verseNumber, 2)
        XCTAssertEqual(events[4].text, "v2")
        XCTAssertEqual(events[5].targetTimeSec, 1, accuracy: 1e-9)
        XCTAssertEqual(events[5].verseNumber, 5)
        XCTAssertEqual(events[5].text, "overlay")
    }

    func testCollectScoreLyricEventsKeepsUnchangedSecondVerseWhenFirstVerseChanges() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1"><part id="P1">
        <measure number="1">
        <attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
        <note><rest/><duration>4</duration><voice>1</voice><type>half</type></note>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><type>quarter</type>
        <lyric number="1"><text>F7(alt)</text></lyric><lyric number="2"><text>4th Voicing</text></lyric></note>
        </measure>
        <measure number="2">
        <note><pitch><step>D</step><octave>4</octave></pitch><duration>8</duration><voice>1</voice><type>whole</type>
        <lyric number="1"><text>Bb7(mixo)</text></lyric><lyric number="2"><text>4th Voicing</text></lyric></note>
        </measure>
        </part></score-partwise>
        """
        let events = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdScoreLyricEvents(xml, bpm: 120, beatsPerMeasure: 4)
        let bb7Time = 2.0
        let bb7Batch = events.filter { abs($0.targetTimeSec - bb7Time) < 1e-9 }
        XCTAssertEqual(bb7Batch.map(\.verseNumber).sorted(), [1, 2])
        XCTAssertEqual(bb7Batch.first(where: { $0.verseNumber == 1 })?.text, "Bb7(mixo)")
        XCTAssertEqual(bb7Batch.first(where: { $0.verseNumber == 2 })?.text, "4th Voicing")
        let resolved = EarTrainingChordOsmdMusicXmlNormalizer.resolveActiveScoreLyricTextAtTime(
            events: events,
            phraseTimeSec: bb7Time,
            calibrateTargetTimeSec: { $0 }
        )
        XCTAssertEqual(resolved, "Bb7(mixo)\n4th Voicing")
    }

    func testCollectScoreLyricEventsDropsThirdVerseWhenAbsentInNewEvent() {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1"><part id="P1">
        <measure number="1">
        <attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
        <note><pitch><step>G</step><alter>-1</alter><octave>4</octave></pitch><duration>8</duration><voice>1</voice><type>quarter</type>
        <lyric number="1"><text>Ab6</text></lyric><lyric number="2"><text>Ab Pentatonic</text></lyric><lyric number="3"><text>Voicing</text></lyric></note>
        </measure>
        <measure number="2">
        <note><pitch><step>F</step><octave>4</octave></pitch><duration>8</duration><voice>1</voice><type>quarter</type>
        <lyric number="1"><text>F7(alt)</text></lyric><lyric number="2"><text>4th Voicing</text></lyric></note>
        </measure>
        </part></score-partwise>
        """
        let events = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdScoreLyricEvents(xml, bpm: 120, beatsPerMeasure: 4)
        let f7Time = 2.0
        let f7Batch = events.filter { abs($0.targetTimeSec - f7Time) < 1e-9 }
        XCTAssertEqual(f7Batch.map(\.verseNumber).sorted(), [1, 2])
        let resolved = EarTrainingChordOsmdMusicXmlNormalizer.resolveActiveScoreLyricTextAtTime(
            events: events,
            phraseTimeSec: f7Time,
            calibrateTargetTimeSec: { $0 }
        )
        XCTAssertEqual(resolved, "F7(alt)\n4th Voicing")
    }

    func testCollectScoreLyricEventsClearsBlankVerseInCluster() {
        let xml = miniScorePartwise("""
        <attributes><divisions>1</divisions></attributes>
        <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration>
        <lyric number="1"><text>Top</text></lyric><lyric number="2"><text>Bottom</text></lyric><lyric number="3"><text>Extra</text></lyric></note>
        <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration>
        <lyric number="1"><text>Next</text></lyric><lyric number="3"><text></text></lyric></note>
        """)
        let events = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdScoreLyricEvents(xml, bpm: 120, beatsPerMeasure: 4)
        let resolved = EarTrainingChordOsmdMusicXmlNormalizer.resolveActiveScoreLyricTextAtTime(
            events: events,
            phraseTimeSec: 0.5,
            calibrateTargetTimeSec: { $0 }
        )
        XCTAssertEqual(resolved, "Next\nBottom")
    }
}
