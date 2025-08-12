import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const LandingPage: React.FC = () => {
  const { user, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate('/main#dashboard', { replace: true });
    }
  }, [user, isGuest, loading, navigate]);

  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFaqId(prev => (prev === id ? null : id));
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
    <div className="lp-root text-white flex h-screen flex-col overflow-hidden">
      <Helmet>
        <title>Jazzify - ジャズ異世界で始まる音楽冒険</title>
        <meta name="description" content="ジャズ異世界で始まる音楽冒険。RPG風の学習やレッスン、コミュニティ機能でジャズを楽しく学べるプラットフォーム。" />
      </Helmet>

      {/* Local scroll container */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Header/Navigation */}
        <nav className="fixed top-0 left-0 right-0 w-full bg-slate-900 bg-opacity-90 backdrop-blur-md z-50 border-b border-purple-500 border-opacity-30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                <i className="fas fa-music mr-2"></i>Jazzify
              </h1>
              <div className="hidden md:flex space-x-6">
                {navLinks.map(link => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className="text-gray-300 hover:text-purple-400 transition"
                    onClick={(e) => handleAnchorClick(e, link.id)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-bg min-h-screen flex items-center justify-center pt-20">
          <div className="container mx-auto px-6 text-center">
            <div className="floating-animation">
              <h1 className="text-6xl md:text-8xl font-black mb-6 section-title">Jazzify</h1>
              <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto">
                ジャズ異世界で始まる音楽冒険<br />
                君は伝説のジャズソーサラーになれるか？
              </p>
            </div>
            <div className="magic-glow inline-block rounded-full p-1 bg-gradient-to-r from-purple-500 to-pink-500">
              <Link to="/login" className="bg-slate-900 px-8 py-4 rounded-full text-xl font-bold hover:bg-slate-800 transition inline-flex items-center">
                <i className="fas fa-play mr-2"></i>冒険を始める
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
              <p className="text-lg leading-relaxed text-gray-300">
                ここは、ジャズに憧れを持つ青年たちが集まる音楽の世界。<br />
                しかし、コードが覚えられず、なかなかジャズらしい演奏ができずに悩む者も多い。<br />
                そんな悩みを抱えた主人公が、突然ジャズ異世界に飛ばされてしまう...！<br />
                モンスターとセッションし、心を通わせることで元の世界に戻れるという。<br />
                果たして、君は伝説のジャズソーサラーになることができるのか？
              </p>
            </div>

            {/* Character Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Protagonist */}
              <div className="character-card rounded-2xl p-8 text-center floating-animation">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                  <i className="fas fa-user text-4xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-blue-300">不破市太郎 (ファイ)</h3>
                <div className="text-sm text-purple-300 mb-4">主人公・見習いジャズマン</div>
                <p className="text-gray-300 leading-relaxed">
                  ジャズに憧れを持つ青年。ジャズ研究会に所属していたが、コードが覚えられず、なかなかジャズらしくならないことに悩んでいた。突然ジャズ異世界に飛ばされてしまう。
                </p>
                <div className="mt-6 flex justify-center space-x-4 text-sm">
                  <span className="bg-blue-600 px-3 py-1 rounded-full">初心者</span>
                  <span className="bg-purple-600 px-3 py-1 rounded-full">努力家</span>
                </div>
              </div>

              {/* Master */}
              <div className="character-card rounded-2xl p-8 text-center floating-animation" style={{ animationDelay: '0.5s' }}>
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center">
                  <i className="fas fa-guitar text-4xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-green-300">ジャ爺 (ジャジィ)</h3>
                <div className="text-sm text-purple-300 mb-4">師匠・エレキベース占い師</div>
                <p className="text-gray-300 leading-relaxed">
                  異世界の住人で、エレキベースを弾く占い師。ファイが元の世界に戻れるよう、ジャズの奥義を伝授し、ジャズソーサラー（大魔法使い）への道を導く。
                </p>
                <div className="mt-6 flex justify-center space-x-4 text-sm">
                  <span className="bg-green-600 px-3 py-1 rounded-full">賢者</span>
                  <span className="bg-teal-600 px-3 py-1 rounded-full">ベーシスト</span>
                </div>
              </div>

              {/* Monsters */}
              <div className="character-card rounded-2xl p-8 text-center floating-animation" style={{ animationDelay: '1s' }}>
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-400 to-red-600 flex items-center justify-center">
                  <i className="fas fa-dragon text-4xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-pink-300">異世界のモンスター</h3>
                <div className="text-sm text-purple-300 mb-4">セッション相手・音楽愛好家</div>
                <p className="text-gray-300 leading-relaxed">
                  ジャズを愛し、何らかの楽器をたしなんでいる異世界の住人たち。ファイと旅の道中で出会うといつもセッションを申し出てくる音楽好きな仲間たち。
                </p>
                <div className="mt-6 flex justify-center space-x-4 text-sm">
                  <span className="bg-pink-600 px-3 py-1 rounded-full">音楽愛好家</span>
                  <span className="bg-red-600 px-3 py-1 rounded-full">セッション仲間</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Modes Section */}
        <section id="modes" className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title">
              <i className="fas fa-gamepad mr-4"></i>学習モード
            </h2>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Legend Mode */}
              <div className="feature-card rounded-2xl p-8 magic-glow">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center">
                    <i className="fas fa-crown text-2xl text-white"></i>
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
              </div>

              {/* Fantasy Mode */}
              <div className="feature-card rounded-2xl p-8 magic-glow">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                    <i className="fas fa-magic text-2xl text-white"></i>
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
              </div>

              {/* Lesson Mode */}
              <div className="feature-card rounded-2xl p-8 magic-glow">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-teal-600 flex items-center justify-center">
                    <i className="fas fa-graduation-cap text-2xl text-white"></i>
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
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section id="community" className="py-20 story-gradient">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title">
              <i className="fas fa-users mr-4"></i>コミュニティ機能
            </h2>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Practice Diary */}
              <div className="feature-card rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <i className="fas fa-book text-2xl text-white"></i>
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
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                    <i className="fas fa-trophy text-2xl text-white"></i>
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
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                    <i className="fas fa-ranking-star text-2xl text-white"></i>
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
            <h2 className="text-5xl font-bold text-center mb-16 section-title">
              <i className="fas fa-cogs mr-4"></i>対応機種・技術仕様
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <i className="fas fa-mobile-alt text-xl text-white"></i>
                </div>
                <h3 className="text-lg font-bold text-blue-300 mb-2">スマートフォン</h3>
                <p className="text-sm text-gray-400">iOS・Android対応</p>
              </div>

              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <i className="fas fa-desktop text-xl text-white"></i>
                </div>
                <h3 className="text-lg font-bold text-green-300 mb-2">PCブラウザ</h3>
                <p className="text-sm text-gray-400">Chrome・Safari・Firefox</p>
              </div>

              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <i className="fas fa-piano text-xl text-white"></i>
                </div>
                <h3 className="text-lg font-bold text-purple-300 mb-2">MIDI対応</h3>
                <p className="text-sm text-gray-400">キーボード接続可能</p>
              </div>

              <div className="feature-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                  <i className="fas fa-microphone text-xl text-white"></i>
                </div>
                <h3 className="text-lg font-bold text-pink-300 mb-2">音声入力</h3>
                <p className="text-sm text-gray-400">ピッチ認識機能</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 story-gradient">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title">
              <i className="fas fa-gem mr-4"></i>料金プラン
            </h2>

            <div className="grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="pricing-card rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-300 mb-4">フリー</h3>
                <div className="text-4xl font-bold text-white mb-6">¥0<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-8">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>基本レッスン（10回まで）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>ファンタジーモード（Lv.5まで）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>練習日記（月5投稿）</li>
                  <li><i className="fas fa-times text-red-400 mr-2"></i>レジェンドモード</li>
                  <li><i className="fas fa-times text-red-400 mr-2"></i>MIDI接続</li>
                </ul>
                <Link to="/signup" className="block w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition text-center">無料で始める</Link>
              </div>

              {/* Standard Plan */}
              <div className="pricing-card rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-blue-300 mb-4">スタンダード</h3>
                <div className="text-4xl font-bold text-white mb-6">¥980<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-8">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>基本レッスン（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>ファンタジーモード（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>練習日記（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>レジェンドモード（3曲まで）</li>
                  <li><i className="fas fa-times text-red-400 mr-2"></i>MIDI接続</li>
                </ul>
                <Link to="/signup" className="block w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition text-center">スタンダードを選ぶ</Link>
              </div>

              {/* Premium Plan */}
              <div className="pricing-card premium rounded-2xl p-8 text-center transform scale-105">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-3 py-1 rounded-full inline-block mb-4">おすすめ</div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-4">プレミアム</h3>
                <div className="text-4xl font-bold text-white mb-6">¥1,980<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-8">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>全レッスン（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>ファンタジーモード（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>コミュニティ機能（全て）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>レジェンドモード（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>MIDI接続</li>
                </ul>
                <Link to="/signup" className="block w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition text-center">プレミアムを選ぶ</Link>
              </div>

              {/* Platinum Plan */}
              <div className="pricing-card rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-purple-300 mb-4">プラチナ</h3>
                <div className="text-4xl font-bold text-white mb-6">¥2,980<span className="text-sm text-gray-400">/月</span></div>
                <ul className="space-y-3 text-sm text-gray-400 mb-8">
                  <li><i className="fas fa-check text-green-400 mr-2"></i>全機能（無制限）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>個人レッスン（月2回）</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>専用コンシェルジュ</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>楽譜ダウンロード</li>
                  <li><i className="fas fa-check text-green-400 mr-2"></i>優先サポート</li>
                </ul>
                <Link to="/signup" className="block w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition text-center">プラチナを選ぶ</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 section-title">
              <i className="fas fa-question-circle mr-4"></i>よくある質問
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
