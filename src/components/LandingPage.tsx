import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ChevronDown, Music, Mic, Gamepad2, GraduationCap, Users, Check, X, Plus, Minus } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { user, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate('/main#dashboard', { replace: true });
    }
  }, [user, isGuest, loading, navigate]);

  // スクロールアニメーション用
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      question: "MIDIキーボードは必要ですか？",
      answer: "いいえ、必須ではありません。マイク入力によるピッチ認識にも対応しているため、アコースティックピアノや声でも練習できます。ただし、MIDIキーボードを使用することで、より正確な判定が可能になります。"
    },
    {
      question: "どのくらいで上達しますか？",
      answer: "個人差はありますが、毎日30分の練習を3ヶ月続けることで、基本的なジャズのコード進行が弾けるようになります。ゲーム要素により楽しく継続できるため、従来の学習方法より早い上達が期待できます。"
    },
    {
      question: "初心者でも始められますか？",
      answer: "はい、完全初心者の方でも大丈夫です。ファンタジーモードでは、RPGゲームのように少しずつレベルアップしながら、自然に音楽理論やコードを覚えることができます。"
    },
    {
      question: "どのブラウザに対応していますか？",
      answer: "Chrome、Firefox、Safari、Edgeの最新版に対応しています。最高のパフォーマンスを得るには、Chromeの使用を推奨します。"
    },
    {
      question: "解約はいつでもできますか？",
      answer: "はい、いつでも解約可能です。解約後も、その月の終わりまではサービスをご利用いただけます。また、無料プランへの変更も可能です。"
    }
  ];

  const plans = [
    {
      name: "フリー",
      price: "0",
      features: [
        { text: "基本的な音ゲーモード", included: true },
        { text: "3曲まで", included: true },
        { text: "コミュニティ機能", included: true },
        { text: "全曲アクセス", included: false },
        { text: "ファンタジーモード", included: false },
        { text: "レッスンモード", included: false },
        { text: "広告なし", included: false }
      ],
      recommended: false
    },
    {
      name: "スタンダード",
      price: "980",
      features: [
        { text: "基本的な音ゲーモード", included: true },
        { text: "全曲アクセス", included: true },
        { text: "コミュニティ機能", included: true },
        { text: "ファンタジーモード", included: true },
        { text: "レッスンモード", included: false },
        { text: "優先サポート", included: false },
        { text: "広告なし", included: true }
      ],
      recommended: true
    },
    {
      name: "プレミアム",
      price: "1,980",
      features: [
        { text: "すべての機能", included: true },
        { text: "全曲アクセス", included: true },
        { text: "コミュニティ機能", included: true },
        { text: "ファンタジーモード", included: true },
        { text: "レッスンモード", included: true },
        { text: "優先サポート", included: true },
        { text: "広告なし", included: true }
      ],
      recommended: false
    },
    {
      name: "プラチナ",
      price: "4,980",
      features: [
        { text: "すべての機能", included: true },
        { text: "全曲アクセス", included: true },
        { text: "コミュニティ機能", included: true },
        { text: "ファンタジーモード", included: true },
        { text: "レッスンモード", included: true },
        { text: "1対1レッスン月1回", included: true },
        { text: "専用サポート", included: true }
      ],
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <Helmet>
        <title>Jazzify - ゲームで学ぶジャズピアノ</title>
        <meta name="description" content="RPG感覚でジャズピアノをマスター。MIDIキーボードやマイク入力に対応した次世代音楽学習プラットフォーム" />
      </Helmet>

      {/* ヒーローセクション */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* 背景エフェクト */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              Jazzify
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300">
              ゲームで楽しく、本格的にジャズピアノをマスター
            </p>
            <p className="text-lg text-gray-400">
              MIDIキーボードやマイク入力に対応。<br />
              RPG感覚で音楽理論を身につけよう！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                to="/login" 
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                無料で始める
              </Link>
              <Link 
                to="/main#dashboard" 
                onClick={() => useAuthStore.getState().enterGuestMode()} 
                className="px-8 py-4 bg-slate-700/50 border border-slate-600 rounded-full font-bold text-lg hover:bg-slate-700 transform hover:scale-105 transition-all duration-300"
              >
                おためしプレイ
              </Link>
            </div>
          </div>
          
          <div className="relative flex justify-center">
            {/* プレースホルダー画像 - 後でdefault-avater.pngに置き換え */}
            <div className="relative">
              <img 
                src="/default_avater/default-avater.png" 
                alt="Jazzifyキャラクター" 
                className="w-full max-w-md animate-float"
                onError={(e) => {
                  // 画像が読み込めない場合のフォールバック
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiByeD0iMjAwIiBmaWxsPSIjNkI0NkMxIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE4MCIgcj0iODAiIGZpbGw9IiNGQkJGMjQiLz4KPHBhdGggZD0iTTEyMCAyODBDMTIwIDI4MCAxNjAgMzIwIDIwMCAzMjBDMjQwIDMyMCAyODAgMjgwIDI4MCAyODAiIHN0cm9rZT0iI0ZCQkYyNCIgc3Ryb2tlLXdpZHRoPSIxNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==';
                }}
              />
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                レベル∞ ジャズマスター
              </div>
            </div>
          </div>
        </div>

        {/* スクロールインジケーター */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-400" />
        </div>
      </section>

      {/* 5つの目玉要素セクション */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16 scroll-animate">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              5つの革新的機能
            </span>
          </h2>

          <div className="space-y-20">
            {/* 機能1: MIDI/マイク入力 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate">
              <div className="order-2 lg:order-1">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Music className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <Mic className="w-16 h-16 mx-auto text-blue-400" />
                    <p className="text-gray-400 mt-4">MIDIキーボード & マイク入力対応</p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold text-purple-300">1. 多彩な入力方法</h3>
                <p className="text-lg text-gray-300">
                  MIDIキーボードはもちろん、マイク入力でのピッチ認識にも対応。
                  アコースティックピアノでも、電子ピアノでも、あなたの環境に合わせて練習できます。
                </p>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-purple-600/20 border border-purple-600 rounded-full text-sm">
                    低レイテンシー
                  </span>
                  <span className="px-4 py-2 bg-purple-600/20 border border-purple-600 rounded-full text-sm">
                    高精度判定
                  </span>
                </div>
              </div>
            </div>

            {/* 機能2: 音ゲーモード */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-blue-300">2. 音ゲーモード</h3>
                <p className="text-lg text-gray-300">
                  ビル・エヴァンスなどジャズの巨匠のソロを完全再現。
                  ノーツが降ってくる本格的な音ゲーで、楽しみながら名演を学べます。
                </p>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-blue-600/20 border border-blue-600 rounded-full text-sm">
                    60FPS
                  </span>
                  <span className="px-4 py-2 bg-blue-600/20 border border-blue-600 rounded-full text-sm">
                    リアルタイム採点
                  </span>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-64 flex items-center justify-center">
                  <p className="text-gray-400">音ゲーモードGIF（後で追加）</p>
                </div>
              </div>
            </div>

            {/* 機能3: ファンタジーモード */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate">
              <div className="order-2 lg:order-1">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-64 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <img 
                        key={i}
                        src={`/stage_icons/${i}.png`} 
                        alt={`モンスター${i}`}
                        className="w-20 h-20 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold text-pink-300">3. ファンタジーモード</h3>
                <p className="text-lg text-gray-300">
                  RPGゲーム風にコードを覚えられる革新的なモード。
                  モンスターを倒しながら、自然に音楽理論が身につきます。
                </p>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-pink-600/20 border border-pink-600 rounded-full text-sm">
                    10ステージ
                  </span>
                  <span className="px-4 py-2 bg-pink-600/20 border border-pink-600 rounded-full text-sm">
                    レベルシステム
                  </span>
                </div>
              </div>
            </div>

            {/* 機能4: レッスンモード */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-green-300">4. ジャズピアノレッスン</h3>
                <p className="text-lg text-gray-300">
                  動画付きのレッスンコンテンツでステップバイステップ学習。
                  ブルース初級から始めて、着実にジャズピアノの実力を身につけましょう。
                </p>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-green-600/20 border border-green-600 rounded-full text-sm">
                    動画レッスン
                  </span>
                  <span className="px-4 py-2 bg-green-600/20 border border-green-600 rounded-full text-sm">
                    段階的カリキュラム
                  </span>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-64 flex items-center justify-center">
                  <GraduationCap className="w-24 h-24 text-green-400" />
                </div>
              </div>
            </div>

            {/* 機能5: コミュニティ */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate">
              <div className="order-2 lg:order-1">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-64 flex items-center justify-center">
                  <Users className="w-24 h-24 text-orange-400" />
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold text-orange-300">5. コミュニティ機能</h3>
                <p className="text-lg text-gray-300">
                  経験値システムによるランキングや練習日記でモチベーション維持。
                  同じ目標を持つ仲間と切磋琢磨できます。
                </p>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-orange-600/20 border border-orange-600 rounded-full text-sm">
                    ランキング
                  </span>
                  <span className="px-4 py-2 bg-orange-600/20 border border-orange-600 rounded-full text-sm">
                    練習日記
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 料金プランセクション */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16 scroll-animate">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              料金プラン
            </span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 scroll-animate">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-slate-800/50 backdrop-blur border rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
                  plan.recommended 
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                    : 'border-slate-700'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                      おすすめ
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold">
                    ¥{plan.price}
                    <span className="text-lg text-gray-400">/月</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className={`block w-full py-3 rounded-lg font-bold text-center transition-all duration-300 ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {plan.price === "0" ? "無料で始める" : "このプランを選ぶ"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ セクション */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16 scroll-animate">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              よくある質問
            </span>
          </h2>

          <div className="space-y-4 scroll-animate">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors duration-300"
                >
                  <span className="text-lg font-medium text-left">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <Minus className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                <div className={`px-6 transition-all duration-300 ${
                  openFaqIndex === index ? 'py-4' : 'max-h-0 overflow-hidden'
                }`}>
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8 scroll-animate">
          <h2 className="text-4xl lg:text-5xl font-bold">
            今すぐジャズの世界へ飛び込もう！
          </h2>
          <p className="text-xl text-gray-300">
            無料プランでも十分楽しめます。まずは気軽に始めてみましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              無料アカウント作成
            </Link>
            <Link 
              to="/main#dashboard" 
              onClick={() => useAuthStore.getState().enterGuestMode()} 
              className="px-8 py-4 bg-slate-700/50 border border-slate-600 rounded-full font-bold text-lg hover:bg-slate-700 transform hover:scale-105 transition-all duration-300"
            >
              ゲストでお試し
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Jazzify
              </h3>
              <p className="text-gray-400">
                ゲームで楽しく、本格的にジャズピアノをマスター
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold mb-4">リンク</h4>
              <div className="flex flex-col space-y-2">
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  利用規約
                </Link>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
                <Link to="/commercial" className="text-gray-400 hover:text-white transition-colors">
                  特定商取引法に基づく表記
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Jazzify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
