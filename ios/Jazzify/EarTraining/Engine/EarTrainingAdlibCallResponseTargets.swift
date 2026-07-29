import Foundation

/// アドリブ C&R バトルの判定ターゲット（MusicXML voice 1 のみ・オクターブ等価・1音一致で完了）。
/// Web `src/utils/earTrainingAdlibCallResponse.ts` と同等。
struct AdlibCallResponseTarget: Equatable, Sendable {
    let id: String
    let orderIndex: Int
    let targetTimeSec: Double
    let measureNumber: Int
    /// 正解となる pitch class 集合（オクターブ等価）
    let acceptedPitchClasses: Set<Int>
    /// 鍵盤ガイド用の MusicXML 登録 MIDI（オクターブ展開しない）
    let guideMidis: [Int]
}

enum EarTrainingAdlibCallResponseTargets {
    /// アドリブ C&R: MusicXML voice 1 のみを判定ターゲットとする
    static let targetVoice = 1

    private static func midiToPitchClass(_ midi: Int) -> Int {
        ((midi % 12) + 12) % 12
    }

    private static func targetId(measureNumber: Int, beatStartInMeasure: Double, orderIndex: Int) -> String {
        "acr:\(measureNumber):\(String(format: "%.4f", beatStartInMeasure)):\(orderIndex)"
    }

    /// MusicXML から voice1 アタックを収集する。
    static func collectAttacks(from musicXmlText: String) -> [ChordOsmdMusicXmlAttack] {
        EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(musicXmlText, targetVoice: targetVoice)
    }

    /// voice1 アタックからアドリブ C&R ターゲットを生成。コール小節は voice1 音符が無いため自動的にターゲット 0。
    static func buildTargets(
        attacks: [ChordOsmdMusicXmlAttack],
        bpm: Double,
        beatsPerMeasure: Int,
        isSwing: Bool = false
    ) -> [AdlibCallResponseTarget] {
        guard !attacks.isEmpty else { return [] }

        let sorted = attacks.sorted { lhs, rhs in
            let timeLhs = EarTrainingChordOsmdParrySpan.lyricTargetTimeSec(
                measureNumber: lhs.measureNumber,
                beatStartInMeasure: lhs.beatStartInMeasure,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing
            )
            let timeRhs = EarTrainingChordOsmdParrySpan.lyricTargetTimeSec(
                measureNumber: rhs.measureNumber,
                beatStartInMeasure: rhs.beatStartInMeasure,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing
            )
            if abs(timeLhs - timeRhs) > 1e-9 { return timeLhs < timeRhs }
            if lhs.measureNumber != rhs.measureNumber { return lhs.measureNumber < rhs.measureNumber }
            return lhs.beatStartInMeasure < rhs.beatStartInMeasure
        }

        var results: [AdlibCallResponseTarget] = []
        results.reserveCapacity(sorted.count)
        for (orderIndex, attack) in sorted.enumerated() {
            var pitchClasses = Set<Int>()
            var guideMidis: [Int] = []
            var seenGuide = Set<Int>()
            for raw in attack.midis {
                pitchClasses.insert(midiToPitchClass(raw))
                if !seenGuide.contains(raw) {
                    seenGuide.insert(raw)
                    guideMidis.append(raw)
                }
            }
            guard !pitchClasses.isEmpty else { continue }
            guideMidis.sort()
            let targetTimeSec = EarTrainingChordOsmdParrySpan.lyricTargetTimeSec(
                measureNumber: attack.measureNumber,
                beatStartInMeasure: attack.beatStartInMeasure,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing
            )
            results.append(
                AdlibCallResponseTarget(
                    id: targetId(
                        measureNumber: attack.measureNumber,
                        beatStartInMeasure: attack.beatStartInMeasure,
                        orderIndex: orderIndex
                    ),
                    orderIndex: orderIndex,
                    targetTimeSec: targetTimeSec,
                    measureNumber: attack.measureNumber,
                    acceptedPitchClasses: pitchClasses,
                    guideMidis: guideMidis
                )
            )
        }
        return results
    }

    /// 連続する同一 guideMidis（完全一致）の音群。
    struct HintGroup: Equatable, Sendable {
        let startIndex: Int
        let endIndex: Int
        let guideMidis: [Int]
    }

    static func areSameGuideMidis(_ a: [Int], _ b: [Int]) -> Bool {
        a == b
    }

    /// 連続ターゲットを guideMidis 完全一致でグループ化。
    static func buildHintGroups(from targets: [AdlibCallResponseTarget]) -> [HintGroup] {
        guard !targets.isEmpty else { return [] }
        var groups: [HintGroup] = []
        var startIndex = 0
        for i in 1..<targets.count {
            if !areSameGuideMidis(targets[startIndex].guideMidis, targets[i].guideMidis) {
                groups.append(
                    HintGroup(
                        startIndex: startIndex,
                        endIndex: i - 1,
                        guideMidis: targets[startIndex].guideMidis
                    )
                )
                startIndex = i
            }
        }
        groups.append(
            HintGroup(
                startIndex: startIndex,
                endIndex: targets.count - 1,
                guideMidis: targets[startIndex].guideMidis
            )
        )
        return groups
    }

    /**
     アクティブな鍵盤ガイド音群を返す。
     - 開始: 音群先頭ターゲットのハンマー射出時刻（judged - hammerLead）
     - 終了: 音群末尾ターゲットの判定窓終了、または末尾が settle したら早期終了
     - 前の音群が残っている間は次の射出が始まっても前のガイドを維持
     */
    static func resolveActiveHintGuideMidis(
        targets: [AdlibCallResponseTarget],
        groups: [HintGroup],
        phraseTimeSec: Double,
        hammerLeadSec: Double,
        lateWindowSec: Double,
        resolveJudgedTargetTimeSec: (Double) -> Double,
        isLastTargetSettled: (String) -> Bool
    ) -> [Int]? {
        guard !targets.isEmpty, !groups.isEmpty, phraseTimeSec.isFinite else { return nil }
        for group in groups {
            guard targets.indices.contains(group.startIndex),
                  targets.indices.contains(group.endIndex)
            else { continue }
            let first = targets[group.startIndex]
            let last = targets[group.endIndex]
            let throwStartSec = resolveJudgedTargetTimeSec(first.targetTimeSec) - hammerLeadSec
            if phraseTimeSec + 1e-9 < throwStartSec {
                break
            }
            if isLastTargetSettled(last.id) {
                continue
            }
            let lastWindowEndSec = resolveJudgedTargetTimeSec(last.targetTimeSec) + lateWindowSec
            if phraseTimeSec > lastWindowEndSec + 1e-9 {
                continue
            }
            return group.guideMidis
        }
        return nil
    }

    /// オクターブ等価でターゲットに含まれるか。1音一致で正解。
    static func matches(_ target: AdlibCallResponseTarget, midi: Int) -> Bool {
        target.acceptedPitchClasses.contains(midiToPitchClass(midi))
    }

    /// 精度分母はターゲット数（1ターゲット = 1ノート）。
    static func hitRatio(targetCount: Int, completedCount: Int) -> Double {
        guard targetCount > 0 else { return 1 }
        return max(0, min(1, Double(completedCount) / Double(targetCount)))
    }
}
