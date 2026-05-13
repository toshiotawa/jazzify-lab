import SwiftUI

/// コードスロット UI。WEB 版 `SurvivalCodeSlots.tsx` と同仕様。
/// - 通常ステージ / ボスステージ共に A/B の 2 スロット表示 (C / D は非表示)
/// - ラベル: A=🔫 Shot, B=👊 Punch
/// - 現コード表示 + 構成音の正解進捗バー + 次コード (NEXT) を同時表示
/// - ヒント時は構成音を pitch class 表示 + マリーゴールド色のリングで現在の HINT 対象スロットを強調
/// - 正解発動時 (triggerPulse 増加) は枠線＋内部を一瞬ライトアップ
/// - コードは時間切れ自動切替えを行わない (スキル発動するまで保持)
struct SurvivalCodeSlotsView: View {
    let uiSnapshot: SurvivalUISnapshot
    let isBossStage: Bool

    var body: some View {
        let isProgression = uiSnapshot.stageType == .progression
        let visibleIndices: [Int] = isProgression ? [1] : [0, 1]

        return HStack(alignment: .center, spacing: isBossStage ? 14 : 10) {
            ForEach(visibleIndices, id: \.self) { idx in
                progressionSlotRow(
                    index: idx,
                    isWide: isBossStage || isProgression,
                    isProgression: isProgression
                )
            }
        }
        .padding(.horizontal, 12)
    }

    @ViewBuilder
    private func progressionSlotRow(index idx: Int, isWide: Bool, isProgression: Bool) -> some View {
        let slot = uiSnapshot.slots[idx]
        let hinted = uiSnapshot.hintMode && uiSnapshot.hintSlotIndex == idx

        if isProgression,
           uiSnapshot.hintMode,
           let chord = slot.chord,
           let staffNames = chord.progressionStaffVoicingNames,
           !staffNames.isEmpty {
            let keyFf = chord.progressionStaffKeyFifths ?? 0
            let correctPc = SurvivalChordResolver.correctNotes(
                inputPitchClasses: slot.inputPitchClasses,
                target: chord
            )

            HStack(alignment: .center, spacing: 10) {
                SlotCell(
                    slot: slot,
                    style: SurvivalCodeSlotsView.slotStyle(for: idx),
                    isWide: isWide,
                    isHintTarget: hinted
                )
                .frame(maxWidth: .infinity)

                SurvivalProgressionStaffView(
                    chordDisplayName: chord.displayName,
                    voicingNames: staffNames,
                    keyFifths: keyFf,
                    correctPitchClasses: correctPc
                )
                .frame(width: 200, height: 132)
            }
            .frame(maxWidth: 640)
        } else {
            SlotCell(
                slot: slot,
                style: SurvivalCodeSlotsView.slotStyle(for: idx),
                isWide: isWide,
                isHintTarget: hinted
            )
            .frame(maxWidth: isProgression ? 360 : .infinity)
        }
    }

    // MARK: - Styling

    fileprivate struct SlotStyle {
        let label: String
        let gradient: [Color]
        let borderColor: Color
        let textColor: Color
    }

    fileprivate static func slotStyle(for index: Int) -> SlotStyle {
        switch index {
        case 0:
            return SlotStyle(
                label: "🔫 Shot",
                gradient: [Color.blue.opacity(0.80), Color(red: 0.1, green: 0.2, blue: 0.6).opacity(0.85)],
                borderColor: Color.blue.opacity(0.95),
                textColor: Color(red: 0.75, green: 0.88, blue: 1.0)
            )
        case 1:
            return SlotStyle(
                label: "👊 Punch",
                gradient: [Color.orange.opacity(0.80), Color(red: 0.7, green: 0.35, blue: 0.1).opacity(0.85)],
                borderColor: Color.orange.opacity(0.95),
                textColor: Color(red: 1.0, green: 0.82, blue: 0.55)
            )
        case 2:
            return SlotStyle(
                label: "🪄 Magic",
                gradient: [Color.purple.opacity(0.80), Color(red: 0.3, green: 0.1, blue: 0.55).opacity(0.85)],
                borderColor: Color.purple.opacity(0.95),
                textColor: Color(red: 0.85, green: 0.72, blue: 1.0)
            )
        default:
            return SlotStyle(
                label: "✨ Magic",
                gradient: [Color.pink.opacity(0.80), Color(red: 0.6, green: 0.1, blue: 0.35).opacity(0.85)],
                borderColor: Color.pink.opacity(0.95),
                textColor: Color(red: 1.0, green: 0.77, blue: 0.9)
            )
        }
    }

    fileprivate static func chordFontSize(length: Int, isWide: Bool) -> CGFloat {
        if isWide {
            if length > 10 { return 16 }
            if length > 6 { return 20 }
            if length > 4 { return 24 }
            return 30
        } else {
            if length > 10 { return 13 }
            if length > 6 { return 16 }
            if length > 4 { return 19 }
            return 23
        }
    }

    fileprivate static func nextFontSize(length: Int, isWide: Bool) -> CGFloat {
        if isWide {
            if length > 8 { return 12 }
            if length > 5 { return 14 }
            return 17
        } else {
            if length > 8 { return 11 }
            if length > 5 { return 13 }
            return 15
        }
    }

}

// MARK: - SlotCell (個別セル + フラッシュ演出)

/// 正解発動時のハイライト演出を自前 `@State` で保持するため、
/// 親 `SurvivalCodeSlotsView` からセルを切り出して `onChange(of:)` を使えるようにする。
private struct SlotCell: View {
    let slot: SurvivalCodeSlot
    let style: SurvivalCodeSlotsView.SlotStyle
    let isWide: Bool
    let isHintTarget: Bool

    /// 1.0 = フラッシュ直後, 0 = 通常。正解発動時に 1 → 0 へアニメーション減衰。
    @State private var flashLevel: Double = 0

    var body: some View {
        VStack(spacing: 5) {
            currentSlotView
            nextSlotView
        }
        .onChange(of: slot.triggerPulse) { _ in
            // 正解発動を検知したら即座に 1.0 へジャンプ → 短時間で 0 へ戻す。
            // `withAnimation` は CoreAnimation のレイヤ作成コストが発火時に乗るため、
            // 移動中にスキル発動すると一瞬ゲームループを止める原因になる。
            // fade は短め (0.28s) + shadow/blur を使わない軽量オーバーレイで代替。
            flashLevel = 1.0
            withAnimation(.easeOut(duration: 0.28)) {
                flashLevel = 0
            }
        }
    }

    // MARK: - 現行スロット

    private var currentSlotView: some View {
        let progress = slot.isEnabled ? slot.progressRatio : 0
        let isCompleted = slot.isEnabled && slot.totalNotes > 0 && slot.correctCount >= slot.totalNotes

        return ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 12)
                .fill(
                    LinearGradient(
                        colors: slot.isEnabled ? style.gradient : [Color.black.opacity(0.35)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            VStack(spacing: 0) {
                HStack(alignment: .top) {
                    Text(style.label)
                        .font(isWide ? .headline.bold() : .subheadline.bold())
                        .foregroundStyle(style.textColor.opacity(slot.isEnabled ? 1.0 : 0.4))
                    Spacer()
                }
                .padding(.horizontal, isWide ? 12 : 8)
                .padding(.top, isWide ? 6 : 4)

                Spacer(minLength: 0)

                chordNameView(isCompleted: isCompleted)

                Spacer(minLength: 0)
            }

            // 進捗ゲージ (WEB 版 `progressPercent` 緑バー)
            if slot.isEnabled, slot.totalNotes > 0 {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.black.opacity(0.45))
                            .frame(height: 5)
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: isCompleted
                                        ? [Color.yellow, Color.orange]
                                        : [Color.green, Color(red: 0.3, green: 0.85, blue: 0.3)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geo.size.width * CGFloat(progress), height: 5)
                    }
                }
                .frame(height: 5)
                .padding(.horizontal, 2)
                .padding(.bottom, 2)
            }
        }
        .frame(height: isWide ? 96 : 64)
        // 通常状態の枠線
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(slot.isEnabled ? style.borderColor : Color.gray.opacity(0.4), lineWidth: 1.8)
        )
        // ヒント対象スロットのリング（鍵盤 HINT のマリーゴールドに揃える）
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(red: 0.93, green: 0.62, blue: 0.13), lineWidth: isHintTarget ? 2.5 : 0)
        )
        // 正解発動時の白〜黄フラッシュ (flashLevel > 0 の間だけ可視)
        // `shadow` / `blur` / `compositingGroup` は発火時の GPU レイヤ構築コストが大きく、
        // コード完成の瞬間にメインスレッドを一瞬ブロックする原因となるため、
        // 半透明塗りつぶし + 境界線の組み合わせだけで「枠と枠内が光る」見た目を演出する。
        .overlay(
            ZStack {
                // 内部発光: 上下方向に明暗を付けたライト イエロー グラデーションを重ねる。
                // `.fill` だけなので CoreAnimation のレイヤ再構築コストはほぼゼロ。
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.55 * flashLevel),
                                Color.yellow.opacity(0.45 * flashLevel),
                                Color.white.opacity(0.35 * flashLevel)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .blendMode(.plusLighter)
                // 枠線: 白→黄→白のグラデーションでネオン縁取り。
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        LinearGradient(
                            colors: [Color.white, Color.yellow, Color.white],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        lineWidth: 4 * CGFloat(flashLevel)
                    )
            }
            .allowsHitTesting(false)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private func chordNameView(isCompleted: Bool) -> some View {
        if let chord = slot.chord, slot.isEnabled {
            Text(chord.displayName)
                .font(.system(size: SurvivalCodeSlotsView.chordFontSize(length: chord.displayName.count, isWide: isWide), weight: .bold))
                .foregroundStyle(isCompleted ? Color.yellow : Color.white)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .padding(.horizontal, 6)
        } else {
            Text(slot.isEnabled ? "—" : "🔒")
                .font(.title2.bold())
                .foregroundStyle(.gray)
        }
    }

    // MARK: - NEXT プレビュー

    private var nextSlotView: some View {
        let display: String = {
            guard slot.isEnabled, let next = slot.nextChord else { return "---" }
            return next.displayName
        }()
        return VStack(spacing: 0) {
            Text("NEXT")
                .font(.system(size: isWide ? 10 : 9, weight: .semibold))
                .foregroundStyle(.gray)
            Text(display)
                .font(.system(size: SurvivalCodeSlotsView.nextFontSize(length: display.count, isWide: isWide), weight: .bold))
                .foregroundStyle(style.textColor.opacity(slot.isEnabled ? 0.9 : 0.3))
                .lineLimit(1)
                .minimumScaleFactor(0.5)
        }
        .frame(maxWidth: .infinity)
        .frame(height: isWide ? 36 : 28)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(
                    LinearGradient(
                        colors: [Color.black.opacity(0.65), Color.black.opacity(0.8)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(style.borderColor.opacity(0.5), lineWidth: 1)
        )
        .opacity(slot.isEnabled ? 1.0 : 0.35)
    }
}
