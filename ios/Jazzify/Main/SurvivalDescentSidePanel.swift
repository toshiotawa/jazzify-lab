import SwiftUI

/// サバイバル降下マップの情報パネル (iOS 版)
/// Web 版 `src/components/survival/descent/DescentSidePanel.tsx` を SwiftUI に移植。
/// - 全体進捗 / 現在ブロック進捗 / 選択ステージ詳細 / ヒントモード / 開始ボタン
/// - iPhone: ボトムシート (中サイズ/大サイズ) で表示
/// - iPad: マップ右側の固定サイドパネル (幅 320pt) で常時表示
struct SurvivalDescentSidePanel: View {
    let locale: AppLocale
    let totalClearedCount: Int
    let totalStages: Int
    let activeBlock: SurvivalBlockMeta?
    let blockClearedCount: Int
    let selectedStage: SurvivalStageDefinition?
    /// ログインユーザーが当該ステージをクリアした累計回数（未プレイは0）
    let selectedStageClearCount: Int
    let selectedStageIsUnlocked: Bool
    let selectedStageIsCleared: Bool
    @Binding var hintMode: Bool
    let playLocked: Bool
    let onStart: () -> Void
    let onRequestUpgrade: () -> Void

    private var isEnglishCopy: Bool { locale == .en }

    private var totalProgressPct: Int {
        Int((Double(totalClearedCount) / Double(max(1, totalStages)) * 100).rounded())
    }

    private var blockProgressPct: Int {
        guard let activeBlock, !activeBlock.stageNumbers.isEmpty else { return 0 }
        return Int((Double(blockClearedCount) / Double(activeBlock.stageNumbers.count) * 100).rounded())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                totalProgressCard
                if let activeBlock {
                    blockProgressCard(activeBlock)
                }
                stageCard
                Text(isEnglishCopy
                     ? "Tap a stage on the map to view details."
                     : "マップのステージをタップすると詳細が表示されます。")
                    .font(.system(size: 10))
                    .tracking(1)
                    .foregroundStyle(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 4)
            }
            .padding(18)
        }
        .background(
            LinearGradient(
                colors: [
                    Color(red: 20 / 255, green: 12 / 255, blue: 31 / 255).opacity(0.9),
                    Color(red: 6 / 255, green: 4 / 255, blue: 16 / 255).opacity(0.95),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.yellow.opacity(0.18), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Cards

    private var totalProgressCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(isEnglishCopy ? "TOTAL PROGRESS" : "全体進捗")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(1.5)
                    .foregroundStyle(.gray)
                Spacer()
                Text("\(totalProgressPct)%")
                    .font(.system(size: 14, design: .monospaced).bold())
                    .foregroundStyle(Color(hex: "fde68a"))
            }
            ProgressBar(
                value: Double(totalProgressPct) / 100.0,
                colors: [Color(hex: "fbbf24"), Color(hex: "fb923c")],
                glow: true
            )
            .frame(height: 6)
        }
        .padding(12)
        .background(Color.black.opacity(0.3))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func blockProgressCard(_ block: SurvivalBlockMeta) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(isEnglishCopy ? "CURRENT BLOCK" : "現在のブロック")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(1.5)
                    .foregroundStyle(.gray)
                Spacer()
                Text("\(blockClearedCount) / \(block.stageNumbers.count)")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(.gray)
            }
            Text(block.localizedLabel(locale))
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(.white)
            ProgressBar(
                value: Double(blockProgressPct) / 100.0,
                colors: [Color(hex: "c084fc"), Color(hex: "f472b6")],
                glow: false
            )
            .frame(height: 4)
        }
        .padding(12)
        .background(Color.black.opacity(0.3))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    @ViewBuilder
    private var stageCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let stage = selectedStage {
                HStack(alignment: .firstTextBaseline) {
                    Text(isEnglishCopy ? "STAGE \(stage.stageNumber)" : "ステージ \(stage.stageNumber)")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(1.8)
                        .foregroundStyle(Color(hex: "fde68a").opacity(0.85))
                    Spacer()
                    statusBadge
                }

                Text(stage.localizedName(locale))
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 2)

                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)],
                    spacing: 8
                ) {
                    infoTile(
                        label: isEnglishCopy ? "Type" : "タイプ",
                        value: stageTypeText(stage: stage),
                        valueColor: .white
                    )
                    if stage.mapCategory != .songs {
                        infoTile(
                            label: isEnglishCopy ? "Chord Type" : "コードタイプ",
                            value: stage.localizedChordDisplay(locale),
                            valueColor: .white
                        )
                        infoTile(
                            label: isEnglishCopy ? "Root" : "ルート",
                            value: stage.localizedRootPattern(locale),
                            valueColor: .white
                        )
                    }
                    infoTile(
                        label: isEnglishCopy ? "Total clears" : "累計クリア回数",
                        value: "\(selectedStageClearCount)",
                        valueColor: Color(hex: "bae6fd")
                    )
                    infoTile(
                        label: isEnglishCopy ? "Clear" : "クリア条件",
                        value: clearConditionText(stage: stage),
                        valueColor: Color(hex: "6ee7b7")
                    )
                    .gridCellColumns(2)
                }

                hintToggle(disabled: playLocked)

                if !selectedStageIsUnlocked && !playLocked {
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 11, weight: .bold))
                        Text(isEnglishCopy
                             ? "Clear Stage \(stage.stageNumber - 1) to unlock"
                             : "ステージ\(stage.stageNumber - 1)をクリアで解放")
                            .font(.system(size: 11))
                    }
                    .foregroundStyle(Color(hex: "fca5a5"))
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(red: 120 / 255, green: 20 / 255, blue: 30 / 255).opacity(0.2))
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.red.opacity(0.2), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }

                startButton
            } else {
                Text(isEnglishCopy
                     ? "Select a stage on the map to see details."
                     : "マップ上のステージを選ぶと詳細が表示されます。")
                    .font(.system(size: 13))
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            }
        }
        .padding(16)
        .background(Color.black.opacity(0.4))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.yellow.opacity(0.22), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Pieces

    @ViewBuilder
    private var statusBadge: some View {
        if selectedStageIsCleared {
            badgeView(
                text: isEnglishCopy ? "Cleared" : "クリア済",
                icon: "checkmark",
                bg: Color.green.opacity(0.2),
                fg: Color(hex: "6ee7b7")
            )
        } else if selectedStageIsUnlocked {
            badgeView(
                text: isEnglishCopy ? "Unlocked" : "解放中",
                icon: nil,
                bg: Color.yellow.opacity(0.2),
                fg: Color(hex: "fde68a")
            )
        } else {
            badgeView(
                text: isEnglishCopy ? "Locked" : "未解放",
                icon: "lock.fill",
                bg: Color.gray.opacity(0.2),
                fg: Color(hex: "9ca3af")
            )
        }
    }

    private func badgeView(text: String, icon: String?, bg: Color, fg: Color) -> some View {
        HStack(spacing: 3) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 9, weight: .bold))
            }
            Text(text)
                .font(.system(size: 10, weight: .semibold))
        }
        .foregroundStyle(fg)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(bg)
        .clipShape(Capsule())
    }

    private func infoTile(label: String, value: String, valueColor: Color) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.system(size: 10))
                .foregroundStyle(.gray)
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(valueColor)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private func hintToggle(disabled: Bool) -> some View {
        Button {
            if !disabled { hintMode.toggle() }
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: hintMode ? "checkmark.square.fill" : "square")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(hintMode ? Color(hex: "fbbf24") : Color.gray)
                VStack(alignment: .leading, spacing: 2) {
                    Text(isEnglishCopy ? "HINT MODE" : "HINTモード")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(hex: "fde68a"))
                    Text(isEnglishCopy
                         ? "Shows keyboard hints. Clears not recorded."
                         : "鍵盤ヒント表示。クリア記録はされません。")
                        .font(.system(size: 10))
                        .foregroundStyle(.gray)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            .background(Color.black.opacity(0.35))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .opacity(disabled ? 0.5 : 1.0)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }

    @ViewBuilder
    private var startButton: some View {
        let enabled = playLocked || selectedStageIsUnlocked
        let isUpgrade = playLocked
        Button {
            if playLocked { onRequestUpgrade() } else { onStart() }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: isUpgrade ? "lock.fill" : "play.fill")
                    .font(.system(size: 14, weight: .bold))
                Text(startButtonLabel)
                    .font(.system(size: 14, weight: .bold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                Group {
                    if isUpgrade {
                        LinearGradient(
                            colors: [Color(hex: "d97706"), Color(hex: "ea580c")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    } else if selectedStageIsUnlocked {
                        LinearGradient(
                            colors: [Color(hex: "9333ea"), Color(hex: "db2777")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    } else {
                        LinearGradient(
                            colors: [Color(hex: "374151"), Color(hex: "1f2937")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .shadow(color: .black.opacity(0.35), radius: 6, y: 2)
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }

    private var startButtonLabel: String {
        if playLocked { return isEnglishCopy ? "Upgrade" : "アップグレード" }
        return isEnglishCopy ? "Start" : "開始"
    }

    private func clearConditionText(stage: SurvivalStageDefinition) -> String {
        if isBossStage(stage) {
            return isEnglishCopy ? "Boss x1" : "ボス x1"
        }
        return isEnglishCopy ? "90s + 150 Kills" : "90秒 + 150体"
    }

    /// ステージのタイプ表示（Progression / Random）。
    private func stageTypeText(stage: SurvivalStageDefinition) -> String {
        switch stage.stageType {
        case .progression:
            return isEnglishCopy ? "Progression" : "コード進行"
        case .phrases:
            return isEnglishCopy ? "Phrases" : "フレーズ"
        case .random:
            return isEnglishCopy ? "Random" : "ランダム"
        }
    }

    /// ボス戦 (= 各ブロック最終ステージ) かどうか。`SurvivalViewModel.isBossStage` と同じ判定基準
    /// `SurvivalBossEngine.isBlockLastStage(stageNumber:in:)` を参照して判定を揃える。
    /// `isMixedStage` はブロックに `trailingMixedGroup` がある場合のみ true になるため、
    /// `trailingMixedGroup=nil` のブロック末尾 (例: Major-5 / M7-5 など) を拾えない。
    private func isBossStage(_ stage: SurvivalStageDefinition) -> Bool {
        SurvivalBossEngine.isBlockLastStage(stageNumber: stage.stageNumber, in: stage.mapCategory)
    }
}

/// 共通プログレスバー
struct ProgressBar: View {
    let value: Double
    let colors: [Color]
    let glow: Bool

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 999)
                    .fill(Color.white.opacity(0.05))
                RoundedRectangle(cornerRadius: 999)
                    .fill(
                        LinearGradient(
                            colors: colors,
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: max(0, min(1, value)) * geo.size.width)
                    .shadow(
                        color: glow ? colors.last?.opacity(0.6) ?? .clear : .clear,
                        radius: glow ? 5 : 0
                    )
            }
        }
    }
}
