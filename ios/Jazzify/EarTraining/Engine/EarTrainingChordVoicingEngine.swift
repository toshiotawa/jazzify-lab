import Foundation

/// Web `EarTrainingChordVoicingAttempt` ([src/types/index.ts]) と同等。
struct EarTrainingChordVoicingAttempt: Sendable, Equatable {
    let phraseId: UUID
    var pressedByChord: [UUID: Set<Int>]
    var missByChord: [UUID: Int]
    var completedChordIds: Set<UUID>
    var awardedChordIds: Set<UUID>
    var failedChordIds: Set<UUID>
}

/// 耳コピヴォイシング練習モード用の鍵盤ヒント状態。
/// Web `src/utils/earTrainingChordVoicingHints.ts` と同じ意味。
enum VoicingHintState: Sendable, Equatable {
    case pending
    case completed
}

/// Web `earTrainingChordVoicingEngine.ts` を 1:1 で移植する。
enum EarTrainingChordVoicingEngine {
    static let maxMissesPerChord = 5
    private static let displayBoundaryEpsilonSec = 0.001
    private static let harmonyGroupEpsilonSec = 0.001
    private static let harmonyTimeWindowEpsilonSec = 0.0005

    static func midiToPitchClass(_ midiNote: Int) -> Int {
        ((midiNote % 12) + 12) % 12
    }

    /// Web `noteNameToPitchClass` 相当（ダブル臨時記号にも対応）。
    static func noteNameToPitchClass(_ noteName: String) -> Int? {
        let trimmed = noteName.trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first else { return nil }
        let upper = String(first).uppercased()
        let baseMap: [String: Int] = [
            "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
        ]
        guard var pc = baseMap[upper] else { return nil }
        var index = trimmed.index(after: trimmed.startIndex)
        while index < trimmed.endIndex {
            let ch = trimmed[index]
            if ch == "x" {
                pc += 2
            } else if ch == "#" || ch == "♯" {
                pc += 1
            } else if ch == "b" || ch == "♭" {
                pc -= 1
            } else {
                break
            }
            index = trimmed.index(after: index)
        }
        return ((pc % 12) + 12) % 12
    }

    static func voicingPitchClasses(for chord: EarTrainingPhraseChordDetail) -> [Int] {
        guard let voicing = chord.voicing, !voicing.isEmpty else { return [] }
        var seen = Set<Int>()
        var ordered: [Int] = []
        for name in voicing {
            if let pc = noteNameToPitchClass(name), !seen.contains(pc) {
                seen.insert(pc)
                ordered.append(pc)
            }
        }
        return ordered
    }

    /// Web `parseVoicingNoteName(...).midi`（`src/utils/voicingMusicXml.ts`）と同等。
    /// オクターブまで含めた音名（例 "G3", "F#4", "Bb3"）から MIDI 番号を返す。
    static func noteNameToMidi(_ noteName: String) -> Int? {
        let trimmed = noteName.trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first else { return nil }
        let upper = String(first).uppercased()
        let baseSemitones: [String: Int] = [
            "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
        ]
        guard let semitone = baseSemitones[upper] else { return nil }

        var alter = 0
        var index = trimmed.index(after: trimmed.startIndex)
        accidentalLoop: while index < trimmed.endIndex {
            let ch = trimmed[index]
            switch ch {
            case "x":
                alter += 2
            case "#", "♯":
                alter += 1
            case "b", "♭":
                alter -= 1
            default:
                break accidentalLoop
            }
            index = trimmed.index(after: index)
        }

        let octaveString = String(trimmed[index...])
        guard let octave = Int(octaveString) else { return nil }
        return (octave + 1) * 12 + semitone + alter
    }

    /// Web `computeVoicingKeyboardHints(...)` 相当。voicing 文字列の各音を
    /// オクターブ付き MIDI に展開し、押下済み PC があるノートは `.completed`、
    /// それ以外は `.pending` として返す。
    static func voicingKeyboardHints(
        voicing: [String]?,
        pressedPitchClasses: Set<Int>
    ) -> [Int: VoicingHintState] {
        guard let voicing, !voicing.isEmpty else { return [:] }
        var result: [Int: VoicingHintState] = [:]
        for name in voicing {
            guard let midi = noteNameToMidi(name), result[midi] == nil else { continue }
            let pc = midiToPitchClass(midi)
            result[midi] = pressedPitchClasses.contains(pc) ? .completed : .pending
        }
        return result
    }

    static func chordHasVoicingNotes(_ chord: EarTrainingPhraseChordDetail) -> Bool {
        (chord.voicing?.count ?? 0) > 0
    }

    private static func chordNeedsPitchClass(
        attempt: EarTrainingChordVoicingAttempt,
        chord: EarTrainingPhraseChordDetail?,
        pitchClass: Int
    ) -> Bool {
        guard let chord, !attempt.completedChordIds.contains(chord.id) else { return false }
        let targetPcs = voicingPitchClasses(for: chord)
        guard targetPcs.contains(pitchClass) else { return false }
        return !(attempt.pressedByChord[chord.id]?.contains(pitchClass) ?? false)
    }

    static func selectJudgmentChord(
        attempt: EarTrainingChordVoicingAttempt,
        primaryChord: EarTrainingPhraseChordDetail?,
        overlapChord: EarTrainingPhraseChordDetail?,
        midiNote: Int
    ) -> EarTrainingPhraseChordDetail? {
        let inputPc = midiToPitchClass(midiNote)
        if chordNeedsPitchClass(attempt: attempt, chord: primaryChord, pitchClass: inputPc) {
            return primaryChord
        }
        if chordNeedsPitchClass(attempt: attempt, chord: overlapChord, pitchClass: inputPc) {
            return overlapChord
        }
        return primaryChord
    }

    static func createAttempt(for phrase: EarTrainingPhraseDetail) -> EarTrainingChordVoicingAttempt {
        var completedChordIds = Set<UUID>()
        for chord in phrase.chords ?? [] where !chordHasVoicingNotes(chord) {
            completedChordIds.insert(chord.id)
        }
        return EarTrainingChordVoicingAttempt(
            phraseId: phrase.id,
            pressedByChord: [:],
            missByChord: [:],
            completedChordIds: completedChordIds,
            awardedChordIds: [],
            failedChordIds: []
        )
    }

    struct InputResult {
        var attempt: EarTrainingChordVoicingAttempt
        var hitPitchClass: Int?
        var chordJustCompleted: Bool
        var enemyDamage: Int
        var playerDamage: Int
        var evaluationMissAdded: Bool
        /// Web `firstWrongJustHappened`。構成音外の「そのコードで最初の1回」のみ true。
        var firstWrongJustHappened: Bool
    }

    enum WrongNotesPolicy {
        case `default`
        case firstOnlyPerChord
    }

    static func handleNoteOn(
        attempt: EarTrainingChordVoicingAttempt,
        activeChord: EarTrainingPhraseChordDetail?,
        midiNote: Int,
        damage: EarTrainingDamageConfig,
        suppressMissRecording: Bool = false,
        wrongNotesPolicy: WrongNotesPolicy = .default
    ) -> InputResult {
        guard let chord = activeChord else {
            return InputResult(
                attempt: attempt,
                hitPitchClass: nil,
                chordJustCompleted: false,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false,
                firstWrongJustHappened: false
            )
        }
        let chordId = chord.id
        if attempt.completedChordIds.contains(chordId) {
            return InputResult(
                attempt: attempt,
                hitPitchClass: nil,
                chordJustCompleted: false,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false,
                firstWrongJustHappened: false
            )
        }
        let targetPcs = voicingPitchClasses(for: chord)
        if targetPcs.isEmpty {
            return InputResult(
                attempt: attempt,
                hitPitchClass: nil,
                chordJustCompleted: false,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false,
                firstWrongJustHappened: false
            )
        }
        let inputPc = midiToPitchClass(midiNote)
        var pressed = attempt.pressedByChord[chordId] ?? Set<Int>()
        let isTargetTone = targetPcs.contains(inputPc)
        if !isTargetTone {
            if suppressMissRecording {
                return InputResult(
                    attempt: attempt,
                    hitPitchClass: nil,
                    chordJustCompleted: false,
                    enemyDamage: 0,
                    playerDamage: 0,
                    evaluationMissAdded: false,
                    firstWrongJustHappened: false
                )
            }
            if wrongNotesPolicy == .firstOnlyPerChord {
                let currentMiss = attempt.missByChord[chordId] ?? 0
                if currentMiss >= 1 {
                    return InputResult(
                        attempt: attempt,
                        hitPitchClass: nil,
                        chordJustCompleted: false,
                        enemyDamage: 0,
                        playerDamage: 0,
                        evaluationMissAdded: false,
                        firstWrongJustHappened: false
                    )
                }
                var next = attempt
                next.missByChord[chordId] = 1
                return InputResult(
                    attempt: next,
                    hitPitchClass: nil,
                    chordJustCompleted: false,
                    enemyDamage: 0,
                    playerDamage: 0,
                    evaluationMissAdded: true,
                    firstWrongJustHappened: true
                )
            }
            var next = attempt
            let currentMiss = next.missByChord[chordId] ?? 0
            let evaluationMissAdded = currentMiss < maxMissesPerChord
            if evaluationMissAdded {
                next.missByChord[chordId] = currentMiss + 1
            }
            return InputResult(
                attempt: next,
                hitPitchClass: nil,
                chordJustCompleted: false,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: evaluationMissAdded,
                firstWrongJustHappened: evaluationMissAdded && currentMiss == 0
            )
        }
        if pressed.contains(inputPc) {
            return InputResult(
                attempt: attempt,
                hitPitchClass: inputPc,
                chordJustCompleted: false,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false,
                firstWrongJustHappened: false
            )
        }
        pressed.insert(inputPc)
        var next = attempt
        next.pressedByChord[chordId] = pressed
        let completed = !targetPcs.isEmpty && targetPcs.allSatisfy { pressed.contains($0) }
        if completed {
            next.completedChordIds.insert(chordId)
        }
        return InputResult(
            attempt: next,
            hitPitchClass: inputPc,
            chordJustCompleted: completed,
            enemyDamage: damage.perCorrectNote,
            playerDamage: 0,
            evaluationMissAdded: false,
            firstWrongJustHappened: false
        )
    }

    static func isAllChordsCompleted(
        phrase: EarTrainingPhraseDetail,
        attempt: EarTrainingChordVoicingAttempt
    ) -> Bool {
        let chords = phrase.chords ?? []
        guard !chords.isEmpty else { return false }
        return chords.allSatisfy { chord in
            !chordHasVoicingNotes(chord) || attempt.completedChordIds.contains(chord.id)
        }
    }

    static func acknowledgeChordAward(
        attempt: EarTrainingChordVoicingAttempt,
        chordId: UUID
    ) -> EarTrainingChordVoicingAttempt {
        if attempt.awardedChordIds.contains(chordId) {
            return attempt
        }
        var next = attempt
        next.awardedChordIds.insert(chordId)
        return next
    }

    static func totalMissCount(_ attempt: EarTrainingChordVoicingAttempt) -> Int {
        attempt.missByChord.values.reduce(0, +)
    }

    /// Web `EarTrainingHarmonyHudRow` 相当（同一 harmony 区間は 1 行）。
    struct HarmonyHudRow: Sendable, Equatable {
        let representativeId: UUID
        let chordName: String
        let voicingIds: [UUID]
    }

    struct JudgmentTargets: Sendable {
        let primary: EarTrainingPhraseChordDetail?
        let overlap: EarTrainingPhraseChordDetail?
    }

    private struct HarmonyTimelineGroup {
        let chords: [EarTrainingPhraseChordDetail]
        let segmentStart: Double
        let segmentEnd: Double
    }

    private static func isSameHarmonyGroup(
        _ chord: EarTrainingPhraseChordDetail,
        _ next: EarTrainingPhraseChordDetail
    ) -> Bool {
        guard chord.chordName == next.chordName else { return false }
        guard let end = chord.endTimeSec, let nextEnd = next.endTimeSec,
              end.isFinite, nextEnd.isFinite else { return false }
        return abs(end - nextEnd) <= harmonyGroupEpsilonSec
    }

    private static func timedChords(for phrase: EarTrainingPhraseDetail) -> [EarTrainingPhraseChordDetail] {
        (phrase.chords ?? [])
            .filter { $0.startTimeSec != nil }
            .sorted {
                let leftStart = $0.startTimeSec ?? 0
                let rightStart = $1.startTimeSec ?? 0
                if leftStart != rightStart {
                    return leftStart < rightStart
                }
                return $0.orderIndex < $1.orderIndex
            }
    }

    private static func buildHarmonyTimelineGroups(
        from timed: [EarTrainingPhraseChordDetail]
    ) -> [HarmonyTimelineGroup] {
        guard !timed.isEmpty else { return [] }
        var groups: [HarmonyTimelineGroup] = []
        var run: [EarTrainingPhraseChordDetail] = [timed[0]]
        func flush(_ chords: [EarTrainingPhraseChordDetail]) {
            guard !chords.isEmpty,
                  let end = chords[0].endTimeSec,
                  end.isFinite
            else { return }
            let start = chords.reduce(Double.infinity) { current, chord in
                min(current, chord.startTimeSec ?? Double.infinity)
            }
            guard start.isFinite else { return }
            groups.append(HarmonyTimelineGroup(chords: chords, segmentStart: start, segmentEnd: end))
        }

        for index in 1..<timed.count {
            let prev = timed[index - 1]
            let curr = timed[index]
            if isSameHarmonyGroup(prev, curr) {
                run.append(curr)
            } else {
                flush(run)
                run = [curr]
            }
        }
        flush(run)
        return groups
    }

    static func harmonyHudRows(for phrase: EarTrainingPhraseDetail) -> [HarmonyHudRow] {
        let timed = timedChords(for: phrase)
        guard !timed.isEmpty else { return [] }
        return buildHarmonyTimelineGroups(from: timed).map { group in
            let first = group.chords[0]
            return HarmonyHudRow(
                representativeId: first.id,
                chordName: first.chordName,
                voicingIds: group.chords.map { $0.id }
            )
        }
    }

    static func harmonyRow(containingChordId chordId: UUID, phrase: EarTrainingPhraseDetail) -> HarmonyHudRow? {
        let rows = harmonyHudRows(for: phrase)
        if let row = rows.first(where: { $0.voicingIds.contains(chordId) }) {
            return row
        }
        guard let chord = phrase.chords?.first(where: { $0.id == chordId }) else { return nil }
        return HarmonyHudRow(representativeId: chord.id, chordName: chord.chordName, voicingIds: [chord.id])
    }

    static func isHarmonySegmentFullyCompleted(
        attempt: EarTrainingChordVoicingAttempt,
        row: HarmonyHudRow
    ) -> Bool {
        row.voicingIds.allSatisfy { attempt.completedChordIds.contains($0) }
    }

    private static func firstPlayableChord(
        in chords: [EarTrainingPhraseChordDetail]
    ) -> EarTrainingPhraseChordDetail? {
        chords.first { chordHasVoicingNotes($0) }
    }

    private static func firstIncompletePlayableChord(
        in group: HarmonyTimelineGroup,
        completedChordIds: Set<UUID>
    ) -> EarTrainingPhraseChordDetail? {
        group.chords.first { chord in
            chordHasVoicingNotes(chord) && !completedChordIds.contains(chord.id)
        }
    }

    private static func isPositiveFinite(_ value: Double?) -> Bool {
        guard let value else { return false }
        return value.isFinite && value > 0
    }

    private static func halfBeatSec(bpm: Int) -> Double {
        guard bpm > 0 else { return 0 }
        return 30 / Double(bpm)
    }

    private static func groupPlayablesCompleted(
        _ group: HarmonyTimelineGroup,
        completedChordIds: Set<UUID>
    ) -> Bool {
        group.chords.allSatisfy { chord in
            !chordHasVoicingNotes(chord) || completedChordIds.contains(chord.id)
        }
    }

    /// `groupIndex` より後のグループにある最初のプレイアブル・コードの開始時刻。
    private static func nextPlayableChordStartAfterGroup(
        groups: [HarmonyTimelineGroup],
        groupIndex: Int,
        loopDurationSec: Double? = nil
    ) -> Double? {
        var j = groupIndex + 1
        while j < groups.count {
            if let fp = firstPlayableChord(in: groups[j].chords),
               let start = fp.startTimeSec, start.isFinite {
                return start
            }
            j += 1
        }
        if isPositiveFinite(loopDurationSec),
           let firstGroup = groups.first,
           let fp = firstPlayableChord(in: firstGroup.chords),
           let start = fp.startTimeSec,
           start.isFinite,
           let loopDurationSec {
            return loopDurationSec + start
        }
        return nil
    }

    private static func computeGroupEffectiveWindowSec(
        groups: [HarmonyTimelineGroup],
        groupIndex: Int,
        halfSec: Double,
        completedChordIds: Set<UUID>,
        loopDurationSec: Double? = nil
    ) -> (effStart: Double, effEnd: Double) {
        let group = groups[groupIndex]
        let prevCompleted: Bool
        if groupIndex > 0 {
            prevCompleted = groupPlayablesCompleted(groups[groupIndex - 1], completedChordIds: completedChordIds)
        } else {
            prevCompleted = isPositiveFinite(loopDurationSec)
                && groups.count > 1
                && groupPlayablesCompleted(groups[groups.count - 1], completedChordIds: completedChordIds)
        }
        let thisCompleted = groupPlayablesCompleted(group, completedChordIds: completedChordIds)
        let playable = firstPlayableChord(in: group.chords)
        let thisFirstStart: Double = {
            guard let playable,
                  let start = playable.startTimeSec,
                  start.isFinite else { return group.segmentStart }
            return start
        }()

        let effStart: Double
        if playable != nil, prevCompleted, halfSec > 0 {
            effStart = thisFirstStart - halfSec
        } else {
            effStart = group.segmentStart
        }

        var effEnd = group.segmentEnd
        if thisCompleted,
           halfSec > 0,
           let nextPlayStart = nextPlayableChordStartAfterGroup(
            groups: groups,
            groupIndex: groupIndex,
            loopDurationSec: loopDurationSec
           ) {
            effEnd = min(group.segmentEnd, nextPlayStart - halfSec)
        }

        return (effStart, effEnd)
    }

    private static func containsLoopTime(
        loopTime: Double,
        effStart: Double,
        effEnd: Double,
        loopDurationSec: Double?
    ) -> Bool {
        let eps = harmonyTimeWindowEpsilonSec
        if loopTime + eps >= effStart && loopTime + eps < effEnd {
            return true
        }
        if isPositiveFinite(loopDurationSec), effStart < 0, let loopDurationSec {
            let wrappedStart = loopDurationSec + effStart
            return loopTime + eps >= wrappedStart && loopTime + eps < loopDurationSec
        }
        return false
    }

    private static func chordGroupIndex(
        groups: [HarmonyTimelineGroup],
        chordId: UUID
    ) -> Int? {
        groups.firstIndex { group in group.chords.contains { $0.id == chordId } }
    }

    private static func nextGroupIndex(
        groups: [HarmonyTimelineGroup],
        groupIndex: Int,
        loopDurationSec: Double?
    ) -> (index: Int, firstStart: Double)? {
        var j = groupIndex + 1
        while j < groups.count {
            if let fp = firstPlayableChord(in: groups[j].chords),
               let start = fp.startTimeSec, start.isFinite {
                return (j, start)
            }
            j += 1
        }
        if isPositiveFinite(loopDurationSec),
           let firstGroup = groups.first,
           let fp = firstPlayableChord(in: firstGroup.chords),
           let start = fp.startTimeSec,
           start.isFinite,
           let loopDurationSec {
            return (0, loopDurationSec + start)
        }
        return nil
    }

    /// Web `getFirstIncompleteVoicingChord` — セルフペース進行の表示・判定用。
    static func firstIncompleteVoicingChord(
        phrase: EarTrainingPhraseDetail,
        completedChordIds: Set<UUID>
    ) -> EarTrainingPhraseChordDetail? {
        let chords = phrase.chords ?? []
        if chords.isEmpty { return nil }
        let timed = timedChords(for: phrase)
        if timed.isEmpty {
            let sorted = chords.sorted { $0.orderIndex < $1.orderIndex }
            return sorted.first { chordHasVoicingNotes($0) && !completedChordIds.contains($0.id) }
        }
        let groups = buildHarmonyTimelineGroups(from: timed)
        for group in groups {
            if let chord = firstIncompletePlayableChord(in: group, completedChordIds: completedChordIds) {
                return chord
            }
        }
        return nil
    }

    /// Web `getEarTrainingChordDisplayAtTime` と同じ表示対象を返す。
    /// 同一 harmony では未完成の先頭 voicing を保持し、グループ完成後は次プレイアブル開始の半拍前までラベルを維持する。
    static func chordDisplayAt(
        phrase: EarTrainingPhraseDetail,
        loopTime: Double,
        bpm: Int,
        completedChordIds: Set<UUID>,
        loopDurationSec: Double? = nil
    ) -> EarTrainingPhraseChordDetail? {
        let chords = phrase.chords ?? []
        guard !chords.isEmpty else { return nil }

        let timed = timedChords(for: phrase)
        guard !timed.isEmpty else {
            return chords.first
        }

        let groups = buildHarmonyTimelineGroups(from: timed)
        let halfSec = halfBeatSec(bpm: bpm)

        for groupIndex in groups.indices {
            let group = groups[groupIndex]
            let window = computeGroupEffectiveWindowSec(
                groups: groups,
                groupIndex: groupIndex,
                halfSec: halfSec,
                completedChordIds: completedChordIds,
                loopDurationSec: loopDurationSec
            )

            if !containsLoopTime(
                loopTime: loopTime,
                effStart: window.effStart,
                effEnd: window.effEnd,
                loopDurationSec: loopDurationSec
            ) {
                continue
            }

            guard let playableChord = firstPlayableChord(in: group.chords) else {
                return group.chords.first
            }

            for chord in group.chords where chordHasVoicingNotes(chord) && !completedChordIds.contains(chord.id) {
                return chord
            }

            return playableChord
        }
        return nil
    }

    /// Web `getEarTrainingNextChordDisplayBoundarySec` と同じく、次に表示対象が変わり得る境界を返す。
    static func nextChordDisplayBoundarySec(
        phrase: EarTrainingPhraseDetail,
        loopTimeSec: Double,
        bpm: Int,
        completedChordIds: Set<UUID>,
        loopDurationSec: Double? = nil
    ) -> Double? {
        let timed = timedChords(for: phrase)
        guard !timed.isEmpty else { return nil }

        let groups = buildHarmonyTimelineGroups(from: timed)
        let halfSec = halfBeatSec(bpm: bpm)
        let threshold = loopTimeSec + displayBoundaryEpsilonSec
        var nextBoundary = Double.infinity

        for groupIndex in groups.indices {
            let window = computeGroupEffectiveWindowSec(
                groups: groups,
                groupIndex: groupIndex,
                halfSec: halfSec,
                completedChordIds: completedChordIds,
                loopDurationSec: loopDurationSec
            )
            let wrappedStart: Double = {
                if isPositiveFinite(loopDurationSec), window.effStart < 0, let loopDurationSec {
                    return loopDurationSec + window.effStart
                }
                return window.effStart
            }()
            if wrappedStart > threshold && wrappedStart < nextBoundary {
                nextBoundary = wrappedStart
            }
            if window.effStart >= 0 && window.effStart > threshold && window.effStart < nextBoundary {
                nextBoundary = window.effStart
            }
            if window.effEnd > threshold && window.effEnd < nextBoundary {
                nextBoundary = window.effEnd
            }
        }
        return nextBoundary.isFinite ? nextBoundary : nil
    }

    static func judgmentTargetsAt(
        phrase: EarTrainingPhraseDetail,
        loopTime: Double,
        bpm: Int,
        completedChordIds: Set<UUID>,
        displayChord: EarTrainingPhraseChordDetail?,
        loopDurationSec: Double? = nil
    ) -> JudgmentTargets {
        let primary = displayChord ?? chordDisplayAt(
            phrase: phrase,
            loopTime: loopTime,
            bpm: bpm,
            completedChordIds: completedChordIds,
            loopDurationSec: loopDurationSec
        )
        let timed = timedChords(for: phrase)
        guard !timed.isEmpty, let primary else {
            return JudgmentTargets(primary: primary, overlap: nil)
        }

        let groups = buildHarmonyTimelineGroups(from: timed)
        guard let currentGroupIndex = chordGroupIndex(groups: groups, chordId: primary.id) else {
            return JudgmentTargets(primary: primary, overlap: nil)
        }
        let halfSec = halfBeatSec(bpm: bpm)
        guard halfSec > 0,
              let next = nextGroupIndex(
                groups: groups,
                groupIndex: currentGroupIndex,
                loopDurationSec: loopDurationSec
              )
        else {
            return JudgmentTargets(primary: primary, overlap: nil)
        }

        let nextGroup = groups[next.index]
        guard !groupPlayablesCompleted(nextGroup, completedChordIds: completedChordIds) else {
            return JudgmentTargets(primary: primary, overlap: nil)
        }

        let overlapStart = next.firstStart - halfSec
        let inOverlap: Bool
        if isPositiveFinite(loopDurationSec), let loopDurationSec, next.firstStart > loopDurationSec {
            inOverlap = loopTime >= overlapStart && loopTime < loopDurationSec
        } else {
            inOverlap = loopTime >= overlapStart && loopTime < next.firstStart
        }
        guard inOverlap,
              let overlap = firstIncompletePlayableChord(in: nextGroup, completedChordIds: completedChordIds),
              overlap.id != primary.id
        else {
            return JudgmentTargets(primary: primary, overlap: nil)
        }
        return JudgmentTargets(primary: primary, overlap: overlap)
    }
}
