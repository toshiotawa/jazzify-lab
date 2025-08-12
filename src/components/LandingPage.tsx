import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const LandingPage: React.FC = () => {
  const { user, isGuest, loading, enterGuestMode } = useAuthStore();
  const navigate = useNavigate();

  // トップページではログイン済みでも自動リダイレクトしない

  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const handleGuestClick = () => {
    enterGuestMode();
    navigate('/main#dashboard');
  };

  const navLinks = useMemo(
    () => [
      { id: 'story', label: 'ストーリー' },
      { id: 'modes', label: '学習モード' },
      { id: 'community', label: 'コミュニティ' },
      { id: 'pricing', label: '料金プラン' },
      { id: 'faq', label: 'FAQ' },
    ],
    []
  );

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="lp-root text-white flex h-screen flex-col overflow-hidden" style={{ fontFamily: '"Noto Serif JP", serif' }}>
      <Helmet>
        <title>Jazzify - ジャズ異世界で始まる音楽冒険</title>
        <meta name="description" content="ジャズ異世界で始まる音楽冒険。RPG風の学習やレッスン、コミュニティ機能でジャズを楽しく学べるプラットフォーム。" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Local scroll container */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Header/Navigation */}
        <nav className="fixed top-0 left-0 right-0 w-full bg-slate-900 bg-opacity-90 backdrop-blur-md z-50 border-b border-purple-500 border-opacity-30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                <img src="/default_avater/default-avater.png" alt="Jazzify ロゴ" className="w-8 h-8 rounded-full" />
                Jazzify
              </h1>
              <div className="hidden md:flex items-center gap-3">
                <button onClick={handleGuestClick} className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition text-sm font-semibold">
                  おためしプレイ
                </button>
                <Link to="/signup" className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition text-sm font-bold">
                  ログイン/無料トライアル
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-bg min-h-screen flex items-center justify-center pt-20">
          <div className="container mx-auto px-6 text-center">
            <div>
              <h1 className="text-6xl md:text-8xl font-black mb-6 section-title">Jazzify</h1>
              <p className="text-xl md:text-3xl text-purple-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                練習を冒険に。<br />
                あなたの演奏、今日からジャズ化。
              </p>
            </div>
            <div className="inline-block mb-8">
              <Link
                to="/signup"
                aria-label="無料トライアルを始める"
                className="relative block rounded-2xl overflow-hidden text-white font-extrabold tracking-wide shadow-2xl border border-white/20 ring-1 ring-white/10"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(/first-view.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  maxWidth: '48rem',
                  height: '12rem'
                }}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-black/5 to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 shadow-lg">
                    無料トライアルを始める
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section id="story" className="py-20 story-gradient">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title">
              <i className="fas fa-book-open mr-4"></i>Story
            </h2>

            <div className="max-w-4xl mx-auto mb-16 p-8 rounded-2xl character-card">
              <h3 className="text-2xl font-bold mb-6 text-purple-300">物語の始まり</h3>
              <p className="text-lg leading-relaxed text-gray-300 space-y-3">
                <span className="block">ここは、ジャズに憧れを持つ青年たちが集まる音楽の世界。</span>
                <span className="block">しかし、コードが覚えられず、なかなかジャズらしい演奏ができずに悩む者も多い。</span>
                <span className="block">そんな悩みを抱えた主人公が、突然ジャズ異世界に飛ばされてしまう...！</span>
                <span className="block">モンスターとセッションし、心を通わせることで元の世界に戻れるという。</span>
                <span className="block">果たして、君は伝説のジャズソーサラーになることができるのか？</span>
              </p>
              <p className="text-lg leading-relaxed text-gray-300 mt-6">
                世界観は遊び心、学習はガチ。— そんな“冒険する学習体験”がJazzifyです。
              </p>
              <p className="text-sm text-gray-400 mt-4">
                “Jazzify” は接尾語「-fy」（〇〇化する）から生まれた言葉。あなたの演奏を「ジャズ化」するという意味を込めています。
              </p>
            </div>

            {/* Character Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Protagonist */}
              <div className="character-card rounded-2xl p-8 text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/default_avater/default-avater.png" alt="不破市太郎 (ファイ)" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-blue-300">不破市太郎 (ファイ)</h3>
                <p className="text-gray-300 leading-relaxed">
                  ジャズに憧れを持つ青年。ジャズ研究会に所属していたが、コードが覚えられず、なかなかジャズらしくならないことに悩んでいた。突然ジャズ異世界に飛ばされてしまう。
                </p>
                <ul className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                  <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">初心者</li>
                  <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">コードを覚えたい</li>
                  <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">作曲に役立てたい</li>
                  <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">何から始めればいい？</li>
                </ul>
              </div>

              {/* Master */}
              <div className="character-card rounded-2xl p-8 text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/stage_icons/5.png" alt="ジャ爺 (ジャジィ)" className="w-24 h-24 object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-green-300">ジャ爺 (ジャジィ)</h3>
                <p className="text-gray-300 leading-relaxed">
                  異世界の住人で、エレキベースを弾く占い師。ファイが元の世界に戻れるよう、ジャズの奥義を伝授し、ジャズソーサラー（大魔法使い）への道を導く。
                </p>
                <ul className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                  <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">練習時間が取れない</li>
                </ul>
              </div>

              {/* Monsters */}
              <div className="character-card rounded-2xl p-8 text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/monster_icons/monster_43.png" alt="異世界のモンスター" className="w-24 h-24 object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-pink-300">異世界のモンスター</h3>
                <p className="text-gray-300 leading-relaxed">
                  ジャズを愛し、何らかの楽器をたしなんでいる異世界の住人たち。ファイと旅の道中で出会うといつもセッションを申し出てくる音楽好きな仲間たち。
                </p>
                <ul className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                  <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">ジャズらしくならない</li>
                  <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">1からきちんと学びたい</li>
                </ul>
              </div>
            </div>
            <div className="mt-12 text-center">
              <h4 className="text-2xl font-bold mb-4">あなたはどのタイプ？</h4>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                <span className="px-4 py-2 rounded-full bg-slate-800">ファイタイプ</span>
                <span className="px-4 py-2 rounded-full bg-slate-800">ジャジィタイプ</span>
                <span className="px-4 py-2 rounded-full bg-slate-800">モンスタータイプ</span>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Modes Section */}
        <section id="modes" className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4">
              <img src="/stage_icons/1.png" alt="学習モード" className="w-16 h-16" />
              学習モード
            </h2>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Legend Mode */}
              <div className="feature-card rounded-2xl p-8 magic-glow">
                <div className="w-full h-32 mb-6 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-sm text-gray-500">
                  画像（準備中）
                </div>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/monster_icons/monster_61.png" alt="レジェンドモード" className="w-14 h-14 object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-300">レジェンドモード</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  ジャズの巨匠たちの伝説的なソロをプレイできるモード。マイルス・デイビス、ジョン・コルトレーン、ビル・エヴァンスなどの名演奏を体感しながら学習できます。
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><i className="fas fa-star text-yellow-400 mr-2"></i>巨匠の演奏を完全再現</li>
                  <li><i className="fas fa-star text-yellow-400 mr-2"></i>楽譜とタブ譜表示</li>
                  <li><i className="fas fa-star text-yellow-400 mr-2"></i>スロー再生機能</li>
                  <li><i className="fas fa-star text-yellow-400 mr-2"></i>フレーズ分析機能</li>
                </ul>
                <div className="mt-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-yellow-500/40 text-xs text-yellow-200">
                    <i className="fas fa-thumbs-up text-yellow-400"></i>
                    「ファイタイプのあなた」におすすめ！
                  </div>
                </div>
              </div>

              {/* Fantasy Mode */}
              <div className="feature-card rounded-2xl p-8 magic-glow">
                <div className="w-full h-32 mb-6 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-sm text-gray-500">
                  画像（準備中）
                </div>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/monster_icons/monster_35.png" alt="ファンタジーモード" className="w-14 h-14 object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-300">ファンタジーモード</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  RPGゲーム風にコードを覚えられるモード。魔法を唱えるようにコード進行をマスターし、異世界のモンスターたちとセッションバトルを楽しめます。
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><i className="fas fa-magic text-purple-400 mr-2"></i>RPG風コード学習</li>
                  <li><i className="fas fa-magic text-purple-400 mr-2"></i>セッションバトル</li>
                  <li><i className="fas fa-magic text-purple-400 mr-2"></i>スキルツリーシステム</li>
                  <li><i className="fas fa-magic text-purple-400 mr-2"></i>アイテム収集機能</li>
                </ul>
                <div className="mt-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-purple-500/40 text-xs text-purple-200">
                    <i className="fas fa-thumbs-up text-purple-400"></i>
                    「ジャジィタイプのあなた」におすすめ！
                  </div>
                </div>
              </div>

              {/* Lesson Mode */}
              <div className="feature-card rounded-2xl p-8 magic-glow">
                <div className="w-full h-32 mb-6 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-sm text-gray-500">
                  画像（準備中）
                </div>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/stage_icons/3.png" alt="レッスンモード" className="w-14 h-14 object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-300">レッスンモード</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  動画付きのレッスンコンテンツで基礎から応用まで体系的に学習。課題をクリアしながらカリキュラムを進めることで、確実にスキルアップできます。
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><i className="fas fa-video text-blue-400 mr-2"></i>HD動画レッスン</li>
                  <li><i className="fas fa-video text-blue-400 mr-2"></i>段階的カリキュラム</li>
                  <li><i className="fas fa-video text-blue-400 mr-2"></i>課題チェック機能</li>
                  <li><i className="fas fa-video text-blue-400 mr-2"></i>進捗管理システム</li>
                </ul>
                <div className="mt-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-blue-500/40 text-xs text-blue-200">
                    <i className="fas fa-thumbs-up text-blue-400"></i>
                    「モンスタータイプのあなた」におすすめ！
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section id="community" className="py-20 story-gradient">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4">
              <img src="/monster_icons/monster_49.png" alt="コミュニティ機能" className="w-16 h-16" />
              コミュニティ機能
            </h2>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Practice Diary */}
              <div className="feature-card rounded-2xl p-8">
                <div className="w-full h-32 mb-6 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-sm text-gray-500">
                  画像（準備中）
                </div>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/monster_icons/monster_32.png" alt="練習日記" className="w-14 h-14 object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-300">練習日記</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  その日の練習内容や感想を仲間と共有できる機能。コメントやいいねで交流し、モチベーション維持に役立てよう。
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-edit text-green-400 mr-3"></i>
                    日記投稿・編集機能
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-comment text-green-400 mr-3"></i>
                    コメント機能
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-heart text-green-400 mr-3"></i>
                    いいね機能
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-share text-green-400 mr-3"></i>
                    SNS共有機能
                  </div>
                </div>
              </div>

              {/* Experience System */}
              <div className="feature-card rounded-2xl p-8">
                <div className="w-full h-32 mb-6 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-sm text-gray-500">
                  画像（準備中）
                </div>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/stage_icons/8.png" alt="経験値システム" className="w-14 h-14 object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-orange-300">経験値システム</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  レッスンクリアやセッション参加で経験値を獲得。レベルアップすることで新しいコンテンツや機能がアンロックされます。
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-star text-orange-400 mr-3"></i>
                    レベルアップシステム
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-unlock text-orange-400 mr-3"></i>
                    コンテンツアンロック
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-medal text-orange-400 mr-3"></i>
                    バッジ獲得システム
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-chart-line text-orange-400 mr-3"></i>
                    成長グラフ表示
                  </div>
                </div>
              </div>

              {/* Ranking System */}
              <div className="feature-card rounded-2xl p-8">
                <div className="w-full h-32 mb-6 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-sm text-gray-500">
                  画像（準備中）
                </div>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/monster_icons/monster_52.png" alt="ランキングシステム" className="w-14 h-14 object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-300">ランキングシステム</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  レベル上位者がランキングに掲載される競争システム。友達と切磋琢磨しながら上達を目指そう。
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-list text-purple-400 mr-3"></i>
                    総合ランキング
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-calendar text-purple-400 mr-3"></i>
                    月間ランキング
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-music text-purple-400 mr-3"></i>
                    楽器別ランキング
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <i className="fas fa-crown text-purple-400 mr-3"></i>
                    殿堂入りシステム
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Features */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4">
              <img src="/stage_icons/10.png" alt="対応機種・技術仕様" className="w-16 h-16" />
              対応機種・技術仕様
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/monster_icons/monster_22.png" alt="スマートフォン" className="w-14 h-14 object-contain" />
                </div>
                <h3 className="text-lg font-bold text-blue-300 mb-2">スマートフォン</h3>
                <p className="text-sm text-gray-400">iOS・Android対応</p>
              </div>

              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/monster_icons/monster_40.png" alt="PCブラウザ" className="w-14 h-14 object-contain" />
                </div>
                <h3 className="text-lg font-bold text-green-300 mb-2">PCブラウザ</h3>
                <p className="text-sm text-gray-400">Chrome・Safari・Firefox</p>
              </div>

              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/monster_icons/monster_13.png" alt="MIDI対応" className="w-14 h-14 object-contain" />
                </div>
                <h3 className="text-lg font-bold text-purple-300 mb-2">MIDI対応</h3>
                <p className="text-sm text-gray-400">キーボード接続可能</p>
              </div>

              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/monster_icons/monster_47.png" alt="音声入力" className="w-14 h-14 object-contain" />
                </div>
                <h3 className="text-lg font-bold text-pink-300 mb-2">音声入力</h3>
                <p className="text-sm text-gray-400">ピッチ認識機能</p>
              </div>
            </div>
          </div>
        </section>

        {/* Creator Section */}
        <section id="creator" className="py-20 story-gradient">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4">
              <img src="/stage_icons/4.png" alt="製作者紹介" className="w-16 h-16" />
              製作者紹介
            </h2>
            <div className="max-w-3xl mx-auto feature-card rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                <img src="/default_avater/default-avater.png" alt="永吉俊雄" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold mb-2">永吉俊雄</h3>
                <p className="text-gray-300 leading-relaxed">
                  プロフィール文はプレースホルダーです。ここに自己紹介や開発への想いなどのテキストが入ります。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 story-gradient">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4">
              <img src="/stage_icons/10.png" alt="料金プラン" className="w-16 h-16" />
              料金プラン
            </h2>

            <div className="grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="pricing-card rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-300 mb-4">フリー</h3>
                <div className="text-4xl font-bold text-white mb-6">¥0<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-0">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>基本レッスン（10回まで）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>ファンタジーモード（Lv.5まで）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>練習日記（月5投稿）</li>
                  <li><i className="fas fa-times text-red-400 mr-2"></i>レジェンドモード</li>
                  <li><i className="fas fa-times text-red-400 mr-2"></i>MIDI接続</li>
                </ul>
              </div>

              {/* Standard Plan */}
              <div className="pricing-card rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-blue-300 mb-4">スタンダード</h3>
                <div className="text-4xl font-bold text-white mb-6">¥980<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-0">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>基本レッスン（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>ファンタジーモード（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>練習日記（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>レジェンドモード（3曲まで）</li>
                  <li><i className="fas fa-times text-red-400 mr-2"></i>MIDI接続</li>
                </ul>
              </div>

              {/* Premium Plan */}
              <div className="pricing-card premium rounded-2xl p-8 text-center transform scale-105">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-3 py-1 rounded-full inline-block mb-4">おすすめ</div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-4">プレミアム</h3>
                <div className="text-4xl font-bold text-white mb-6">¥1,980<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-0">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>全レッスン（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>ファンタジーモード（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>コミュニティ機能（全て）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>レジェンドモード（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>MIDI接続</li>
                </ul>
              </div>

              {/* Platinum Plan */}
              <div className="pricing-card rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-purple-300 mb-4">プラチナ</h3>
                <div className="text-4xl font-bold text-white mb-6">¥2,980<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-0">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>全機能（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>個人レッスン（月2回）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>専用コンシェルジュ</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>楽譜ダウンロード</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>優先サポート</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4">
              <img src="/stage_icons/1.png" alt="よくある質問" className="w-16 h-16" />
              よくある質問
            </h2>

            <div className="max-w-4xl mx-auto space-y-6">
              {[1, 2, 3, 4, 5].map((id) => (
                <div key={id} className="faq-item rounded-xl p-6">
                  <button
                    className="w-full flex items-center justify-between cursor-pointer"
                    onClick={() => toggleFAQ(id)}
                    aria-expanded={openFaqId === id}
                    aria-controls={`faq-content-${id}`}
                  >
                    <h3 className="text-lg font-bold text-white">
                      {id === 1 && '楽器未経験者でも大丈夫ですか？'}
                      {id === 2 && 'どんな楽器に対応していますか？'}
                      {id === 3 && 'オフラインでも使用できますか？'}
                      {id === 4 && 'プラン変更はいつでもできますか？'}
                      {id === 5 && 'キャンセル・返金は可能ですか？'}
                    </h3>
                    <i className={`fas ${openFaqId === id ? 'fa-chevron-up' : 'fa-chevron-down'} text-purple-400`}></i>
                  </button>
                  <div
                    id={`faq-content-${id}`}
                    className={`mt-4 text-gray-400 ${openFaqId === id ? '' : 'hidden'}`}
                  >
                    {id === 1 && 'はい、全く問題ありません。Jazzifyは初心者の方を想定して作られており、楽器を触ったことがない方でも楽しく学習できる仕組みになっています。ファンタジーモードでは、ゲーム感覚でコードを覚えることができます。'}
                    {id === 2 && 'ピアノ、ギター、ベース、サックス、トランペットなど、主要なジャズ楽器に対応しています。MIDIキーボードやマイク入力にも対応しているため、お持ちの楽器で学習していただけます。'}
                    {id === 3 && '一部のコンテンツはダウンロードしてオフラインでご利用いただけます。ただし、コミュニティ機能やランキング機能など、一部の機能はインターネット接続が必要です。'}
                    {id === 4 && 'はい、プラン変更はいつでも可能です。アップグレードの場合は即座に新機能がご利用いただけ、ダウングレードの場合は次回請求日から新プランが適用されます。'}
                    {id === 5 && '月額プランはいつでもキャンセル可能です。キャンセル後も現在の請求期間内はサービスをご利用いただけます。初回登録から7日以内であれば、返金対応も承っております。'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">今すぐ無料トライアルを始める</h2>
            <p className="text-gray-300 mb-8">登録は数分で完了。おためしプレイも可能です。</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/signup" className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition font-bold">
                無料トライアルを始める
              </Link>
              <button onClick={handleGuestClick} className="px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 transition font-semibold">
                おためしプレイ
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 bg-slate-900 border-t border-purple-500 border-opacity-30">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                  <i className="fas fa-music mr-2"></i>Jazzify
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  ジャズ異世界で始まる音楽冒険。初心者から上級者まで、すべてのジャズ愛好家のための学習プラットフォームです。
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">サービス</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  {navLinks.slice(1, 4).map(l => (
                    <li key={l.id}>
                      <a href={`#${l.id}`} className="hover:text-purple-400 transition" onClick={(e) => handleAnchorClick(e, l.id)}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                  <li><Link to="/signup" className="hover:text-purple-400 transition">無料体験</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">サポート</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#faq" className="hover:text-purple-400 transition" onClick={(e) => handleAnchorClick(e, 'faq')}>よくある質問</a></li>
                  <li><Link to="/contact" className="hover:text-purple-400 transition">お問い合わせ</Link></li>
                  <li><Link to="/terms" className="hover:text-purple-400 transition">利用規約</Link></li>
                  <li><Link to="/privacy" className="hover:text-purple-400 transition">プライバシーポリシー</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">フォローする</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="Twitter">
                    <i className="fab fa-twitter text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="Facebook">
                    <i className="fab fa-facebook text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="YouTube">
                    <i className="fab fa-youtube text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="Instagram">
                    <i className="fab fa-instagram text-xl"></i>
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} Jazzify. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
