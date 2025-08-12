import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const LandingPage: React.FC = () => {
  const { user, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();

  const heroRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const modesRef = useRef<HTMLDivElement | null>(null);
  const rpgRef = useRef<HTMLDivElement | null>(null);
  const pricingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate('/main#dashboard', { replace: true });
    }
  }, [user, isGuest, loading, navigate]);

  // Enable scroll on LP only
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = previousOverflow || 'hidden';
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero
    if (heroRef.current) {
      gsap.from(heroRef.current.querySelectorAll('.hero-stagger'), {
        y: 20,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out',
        stagger: 0.15,
      });
    }

    const animateSection = (container: HTMLDivElement | null) => {
      if (!container) return;
      const elements = container.querySelectorAll('.reveal');
      elements.forEach((el) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el as Element,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    };

    animateSection(featuresRef.current);
    animateSection(modesRef.current);
    animateSection(rpgRef.current);
    animateSection(pricingRef.current);
  }, []);

  // LP content
  return (
    <div className="min-h-screen w-full bg-gradient-game text-white overflow-x-hidden">
      <Helmet>
        <title>Jazzify - 次世代ジャズ学習RPG</title>
        <meta name="description" content="MIDIキーボード/マイク対応、音ゲー・ファンタジー・レッスン・コミュニティで学ぶ次世代ジャズ学習RPG。" />
      </Helmet>

      {/* Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon001.png" alt="Jazzify" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-wide">Jazzify</span>
          </div>
          <nav className="flex items-center gap-3 md:gap-4">
            <a href="#features" className="text-sm md:text-base text-gray-200 hover:text-white transition">特徴</a>
            <a href="#modes" className="text-sm md:text-base text-gray-200 hover:text-white transition">モード</a>
            <a href="#pricing" className="text-sm md:text-base text-gray-200 hover:text-white transition">プラン</a>
            <Link to="/login" className="btn btn-outline btn-sm">ログイン / 会員登録</Link>
            <Link to="/main#dashboard" onClick={() => useAuthStore.getState().enterGuestMode()} className="btn btn-primary btn-sm">おためしプレイ</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="/default_avater/default-avater.png" alt="主人公" className="w-full h-full object-contain object-center scale-110 md:scale-100" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 pt-20 md:pt-28 pb-16 md:pb-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 hero-stagger">
              <img src="/stage_icons/4.png" alt="icon" className="w-10 h-10" />
              <span className="text-sm md:text-base text-white/80">次世代ジャズ学習RPG</span>
            </div>
            <h1 className="hero-stagger text-4xl md:text-6xl font-extrabold leading-tight mt-4">
              プレイして、覚える。
              <span className="block text-gradient">ジャズが強くなる。</span>
            </h1>
            <p className="hero-stagger text-gray-200 mt-5 max-w-2xl">
              MIDIキーボード/マイク入力でリアル演奏を認識。音ゲー×RPG×レッスン×コミュニティで、楽しみながら着実に上達。
            </p>
            <div className="hero-stagger mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn btn-primary btn-lg">今すぐはじめる</Link>
              <Link to="/main#dashboard" onClick={() => useAuthStore.getState().enterGuestMode()} className="btn btn-secondary btn-lg">おためしプレイ</Link>
            </div>
            <div className="hero-stagger mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2"><img src="/stage_icons/1.png" className="w-8 h-8"/><span>MIDI対応</span></div>
              <div className="flex items-center gap-2"><img src="/stage_icons/2.png" className="w-8 h-8"/><span>マイク入力</span></div>
              <div className="flex items-center gap-2"><img src="/stage_icons/3.png" className="w-8 h-8"/><span>音ゲーモード</span></div>
              <div className="flex items-center gap-2"><img src="/stage_icons/5.png" className="w-8 h-8"/><span>RPG学習</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} className="relative border-t border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24">
          <h2 className="reveal text-3xl md:text-4xl font-bold mb-10 flex items-center gap-3">
            <img src="/stage_icons/6.png" className="w-10 h-10" />
            目玉要素
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-2">MIDIキーボード、マイク入力のピッチ認識にも対応</h3>
              <p className="text-gray-300">本格的な演奏をそのままゲームへ。リアルタイムで判定し、演奏スキルが経験値になる。</p>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-2">音ゲーモード</h3>
              <p className="text-gray-300 mb-4">ジャズの巨匠のソロをプレイできる。ビートに合わせてテクニックを体に刻もう。</p>
              <div className="aspect-video rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center text-gray-400">GIF Coming Soon</div>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-2">ファンタジーモード</h3>
              <p className="text-gray-300 mb-4">RPG風の冒険でコードやスケールを攻略。楽しみながら理論を定着させる。</p>
              <div className="aspect-video rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center text-gray-400">GIF Coming Soon</div>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-2">レッスンモード</h3>
              <p className="text-gray-300 mb-4">動画付きレッスンとステージクリアでカリキュラムを進行。確かな実力を積み上げよう。</p>
              <div className="aspect-video rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center text-gray-400">GIF Coming Soon</div>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6 md:col-span-2">
              <h3 className="text-xl font-semibold mb-2">コミュニティ</h3>
              <p className="text-gray-300 mb-4">経験値によるレベルランキング、練習日記とコメントで仲間と高め合う。</p>
              <div className="aspect-[3/1] rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center text-gray-400">Image Coming Soon</div>
            </div>
          </div>
        </div>
      </section>

      {/* RPG style section */}
      <section ref={rpgRef} className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24">
          <div className="reveal bg-slate-900/60 border border-emerald-500/40 rounded-2xl p-6 md:p-10">
            <div className="fantasy-pixel-font text-3xl md:text-4xl text-emerald-300 mb-4">FANTASY MODE</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">RPG風にコードを覚える</h3>
            <p className="text-gray-300 max-w-3xl">冒険の途中でコードやスケールの試練が登場。バトル形式で演奏し、クリアすると新しい魔法（ボイシング/フレーズ）を習得。学習がそのまま強さに。</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="reveal bg-black/30 border border-white/10 rounded-xl p-4 text-sm">クエストで学ぶ: 段階的なカリキュラム</div>
              <div className="reveal bg-black/30 border border-white/10 rounded-xl p-4 text-sm">バトルで鍛える: 入力判定×反復練習</div>
              <div className="reveal bg-black/30 border border-white/10 rounded-xl p-4 text-sm">報酬で進化: 新スキル/アイテムを獲得</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modes showcase */}
      <section id="modes" ref={modesRef} className="relative border-t border-white/10 bg-black/40">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24">
          <h2 className="reveal text-3xl md:text-4xl font-bold mb-10 flex items-center gap-3">
            <img src="/stage_icons/7.png" className="w-10 h-10" />
            プレイモード
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <div className="text-lg font-semibold mb-2">音ゲーモード</div>
              <p className="text-gray-300 text-sm">名演ソロを再現プレイ。タイミングとピッチを正確に。</p>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <div className="text-lg font-semibold mb-2">ファンタジーモード</div>
              <p className="text-gray-300 text-sm">RPG風の進行で理論と耳を鍛える。</p>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <div className="text-lg font-semibold mb-2">レッスンモード</div>
              <p className="text-gray-300 text-sm">動画×実演で着実にスキルアップ。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" ref={pricingRef} className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24">
          <h2 className="reveal text-3xl md:text-4xl font-bold mb-10 flex items-center gap-3">
            <img src="/stage_icons/8.png" className="w-10 h-10" />
            プラン
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6 flex flex-col">
              <h3 className="text-xl font-semibold">フリー</h3>
              <div className="text-3xl font-bold mt-2">¥0</div>
              <ul className="mt-4 text-sm text-gray-300 space-y-2">
                <li>基本機能</li>
                <li>音ゲー体験版</li>
                <li>コミュニティ閲覧</li>
              </ul>
              <Link to="/login" className="btn btn-outline mt-6">はじめる</Link>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6 flex flex-col">
              <h3 className="text-xl font-semibold">スタンダード</h3>
              <div className="text-3xl font-bold mt-2">¥1,980<span className="text-sm font-normal text-gray-300">/月</span></div>
              <ul className="mt-4 text-sm text-gray-300 space-y-2">
                <li>音ゲーモード</li>
                <li>レッスン一部</li>
                <li>コミュニティ参加</li>
              </ul>
              <Link to="/login" className="btn btn-primary mt-6">購入へ</Link>
            </div>
            <div className="reveal relative bg-slate-900/60 border border-primary-500 rounded-2xl p-6 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full">おすすめ</span>
              </div>
              <h3 className="text-xl font-semibold">プレミアム</h3>
              <div className="text-3xl font-bold mt-2">¥8,980<span className="text-sm font-normal text-gray-300">/月</span></div>
              <ul className="mt-4 text-sm text-gray-300 space-y-2">
                <li>全モード</li>
                <li>動画レッスン</li>
                <li>優先サポート</li>
              </ul>
              <Link to="/login" className="btn btn-primary mt-6">購入へ</Link>
            </div>
            <div className="reveal bg-slate-900/60 border border-white/10 rounded-2xl p-6 flex flex-col">
              <h3 className="text-xl font-semibold">プラチナ</h3>
              <div className="text-3xl font-bold mt-2">¥14,800<span className="text-sm font-normal text-gray-300">/月</span></div>
              <ul className="mt-4 text-sm text-gray-300 space-y-2">
                <li>プレミアム全て</li>
                <li>個別コーチング</li>
                <li>限定コンテンツ</li>
              </ul>
              <Link to="/login" className="btn btn-primary mt-6">購入へ</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/10 bg-black/40">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 text-center">
          <h2 className="reveal text-3xl md:text-4xl font-bold">さあ、音で冒険をはじめよう</h2>
          <p className="reveal text-gray-300 mt-3 mb-8">ログイン/会員登録ですぐにプレイ。データはクラウドに保存されます。</p>
          <div className="reveal inline-flex gap-3">
            <Link to="/login" className="btn btn-primary btn-lg">ログイン / 会員登録</Link>
            <Link to="/main#dashboard" onClick={() => useAuthStore.getState().enterGuestMode()} className="btn btn-secondary btn-lg">おためしプレイ</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/60">
        <div className="max-w-7xl mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-gray-400">© {new Date().getFullYear()} Jazzify</div>
          <nav className="flex items-center gap-4">
            <Link to="/legal/tokushoho" className="text-gray-300 hover:text-white">特商法表記</Link>
            <Link to="/legal/privacy" className="text-gray-300 hover:text-white">プライバシーポリシー</Link>
            <Link to="/legal/terms" className="text-gray-300 hover:text-white">利用規約</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
