import SwiftUI
import UIKit

/// シーン5の「3つの柱」カード。Asset Catalog に画像があれば表示し、無ければ SF Symbol で代用。
struct OnboardingPillarCardView: View {
    let caption: String
    let systemImage: String
    /// Asset Catalog 名（例: `onboarding_pillar_chords`）。無い場合は `systemImage` のみ。
    let imageAssetName: String?

    var body: some View {
        VStack(spacing: 12) {
            if let name = imageAssetName, UIImage(named: name) != nil {
                Image(name)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 120)
                    .cornerRadius(8)
            } else {
                Image(systemName: systemImage)
                    .font(.system(size: 44))
                    .foregroundStyle(.purple)
            }
            Text(caption)
                .font(.headline)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
        }
        .padding(24)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.75)))
        .allowsHitTesting(false)
    }
}
