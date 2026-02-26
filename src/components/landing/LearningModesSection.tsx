import React from 'react';

export const LearningModesSection: React.FC = () => (
  <section id="modes" className="py-20" data-animate="slide-right text-up">
    <div className="container mx-auto px-6">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4"
        data-animate="from-behind heading-underline"
      >
        <img src="/stage_icons/1.png" alt="学習モード" className="w-16 h-16" loading="lazy" />
        学習モード
      </h2>

      <div
        className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        data-animate="alt-cards text-up"
      >
        {/* Legend Mode */}
        <div className="feature-card rounded-2xl p-8 magic-glow">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
              <img
                src="/monster_icons/monster_61.png"
                alt="レジェンドモード"
                className="w-14 h-14 object-contain"
                loading="lazy"
              />
            </div>
            <h3 className="text-2xl font-bold text-yellow-300">レジェンドモード</h3>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            ジャズの巨匠たちの伝説的なソロをプレイできるモード。名演奏を体感しながら学習できます。
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><i className="fas fa-star text-yellow-400 mr-2" aria-hidden="true"></i>巨匠の演奏を完全再現</li>
            <li><i className="fas fa-star text-yellow-400 mr-2" aria-hidden="true"></i>楽譜表示</li>
            <li><i className="fas fa-star text-yellow-400 mr-2" aria-hidden="true"></i>スロー再生機能</li>
            <li><i className="fas fa-star text-yellow-400 mr-2" aria-hidden="true"></i>移調、リピート機能</li>
          </ul>
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-yellow-500/40 text-xs text-yellow-200">
              <i className="fas fa-thumbs-up text-yellow-400" aria-hidden="true"></i>
              「ジャジィタイプのあなた」におすすめ！
            </div>
          </div>
        </div>

        {/* Fantasy Mode */}
        <div className="feature-card rounded-2xl p-8 magic-glow">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
              <img
                src="/monster_icons/monster_35.png"
                alt="ファンタジーモード"
                className="w-14 h-14 object-contain"
                loading="lazy"
              />
            </div>
            <h3 className="text-2xl font-bold text-purple-300">ファンタジーモード</h3>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            RPGゲーム風にコードを覚えられるモード。魔法を唱えるようにコード進行をマスターし、異世界のモンスターたちとセッションバトルを楽しめます。
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><i className="fas fa-magic text-purple-400 mr-2" aria-hidden="true"></i>RPG風コード学習</li>
            <li><i className="fas fa-magic text-purple-400 mr-2" aria-hidden="true"></i>リズムゲーム</li>
            <li><i className="fas fa-magic text-purple-400 mr-2" aria-hidden="true"></i>クイズゲーム</li>
            <li><i className="fas fa-magic text-purple-400 mr-2" aria-hidden="true"></i>ステージ風、段階的カリキュラム</li>
          </ul>
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-purple-500/40 text-xs text-purple-200">
              <i className="fas fa-thumbs-up text-purple-400" aria-hidden="true"></i>
              「ファイタイプのあなた」におすすめ！
            </div>
          </div>
        </div>

        {/* Lesson Mode */}
        <div className="feature-card rounded-2xl p-8 magic-glow">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
              <img
                src="/stage_icons/3.png"
                alt="レッスンモード"
                className="w-14 h-14 object-contain"
                loading="lazy"
              />
            </div>
            <h3 className="text-2xl font-bold text-blue-300">レッスンモード</h3>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            動画付きのレッスンコンテンツで基礎から応用まで体系的に学習。課題をクリアしながらカリキュラムを進めることで、確実にスキルアップできます。
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><i className="fas fa-video text-blue-400 mr-2" aria-hidden="true"></i>HD動画レッスン</li>
            <li><i className="fas fa-video text-blue-400 mr-2" aria-hidden="true"></i>段階的カリキュラム</li>
            <li><i className="fas fa-video text-blue-400 mr-2" aria-hidden="true"></i>課題チェック機能</li>
            <li><i className="fas fa-video text-blue-400 mr-2" aria-hidden="true"></i>マンツーマンサポートシステム</li>
          </ul>
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-blue-500/40 text-xs text-blue-200">
              <i className="fas fa-thumbs-up text-blue-400" aria-hidden="true"></i>
              「モンスタータイプ・ファイタイプのあなた」におすすめ！
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
