import Combine
import Foundation

/// Phrases マップ詳細カードの模範演奏プレビュー（Supabase + `SurvivalPhraseMapPreviewPlayer`）。
@MainActor
final class SurvivalPhrasePreviewModel: ObservableObject {
    enum Status: Equatable {
        case idle
        case loading
        case playing
    }

    @Published private(set) var status: Status = .idle
    @Published private(set) var errorMessage: String?

    private let player = SurvivalPhraseMapPreviewPlayer()
    private var loadTask: Task<Void, Never>?

    func stopPlayback() {
        loadTask?.cancel()
        loadTask = nil
        player.stop()
        status = .idle
        errorMessage = nil
    }

    func requestPreview(
        stage: SurvivalStageDefinition,
        mapCategory: SurvivalMapCategory,
        phrasesDefaultBgmUrlString: String,
        locale: AppLocale
    ) {
        guard stage.mapCategory == .phrases else { return }
        stopPlayback()
        errorMessage = nil
        status = .loading

        loadTask = Task { @MainActor in
            do {
                let rowUrl = try await SupabaseService.shared.fetchSurvivalPhraseBgmUrl(
                    mapCategory: mapCategory,
                    stageNumber: stage.stageNumber
                )
                let url = SurvivalPhrasePreviewURL.resolve(
                    phraseBgmUrl: rowUrl,
                    phrasesStageBgmFromSettings: phrasesDefaultBgmUrlString
                )
                if Task.isCancelled { return }
                self.status = .playing
                await self.player.play(url: url)
                if !Task.isCancelled {
                    self.status = .idle
                }
            } catch is CancellationError {
                self.stopPlayback()
            } catch {
                if Task.isCancelled {
                    self.stopPlayback()
                    return
                }
                self.status = .idle
                self.errorMessage = locale == .ja
                    ? "模範演奏を再生できませんでした。"
                    : "Could not play the demo track."
                self.player.stop()
            }
        }
    }
}
