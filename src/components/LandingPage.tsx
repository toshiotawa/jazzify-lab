import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
const LPFantasyDemo = React.lazy(() => import('./fantasy/LPFantasyDemo'));

const TypewriterText: React.FC<{
  text: string;
  className?: string;
  speedMsPerChar?: number;
  delayMs?: number;
  dataAnimate?: string;
}> = ({ text, className = '', speedMsPerChar = 80, delayMs = 0, dataAnimate }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;
    const start = () => {
      let index = 0;
      intervalId = window.setInterval(() => {
        if (cancelled) return;
        index += 1;
        setDisplayedText(text.slice(0, index));
        if (index >= text.length) {
          if (intervalId) window.clearInterval(intervalId);
        }
      }, speedMsPerChar);
    };
    const startTimer = window.setTimeout(start, delayMs);
    return () => {
      cancelled = true;
      if (startTimer) window.clearTimeout(startTimer);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [text, speedMsPerChar, delayMs]);
  return (
    <p className={className} data-animate={dataAnimate} aria-label={text}>
      <span>{displayedText}</span>
      <span className="type-caret" aria-hidden="true">|</span>
    </p>
  );
};

const LandingPage: React.FC = () => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isEnglishLanding = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observed = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('is-inview');
          observer.unobserve(entry.target);
          observed.delete(entry.target);
        }
      });
    }, { root, threshold: 0.2, rootMargin: '0px 0px -80px 0px' });

    const watch = () => {
      root.querySelectorAll('[data-animate]')
        .forEach((el) => { if (!observed.has(el)) { observer.observe(el); observed.add(el); } });
    };

    watch();
    const mo = new MutationObserver(watch);
    mo.observe(root, { childList: true, subtree: true });

    return () => { observer.disconnect(); mo.disconnect(); };
  }, []);

  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const navLinks = useMemo(
    () => (
      isEnglishLanding
        ? []
        : [
            { id: 'modes', label: '学習モード' },
            { id: 'pricing', label: '料金プラン' },
            { id: 'faq', label: 'FAQ' },
          ]
    ),
    [isEnglishLanding]
  );

  const heroTitleText = isEnglishLanding ? 'Turn practice into an adventure.' : '練習を冒険に。';
  const heroSubtitleText = isEnglishLanding ? 'Transform your playing with an RPG-inspired jazz journey.' : 'ゲーム感覚で、ジャズが弾けるようになる。';
  const primaryCtaLabel = isEnglishLanding ? 'Start Free Trial' : '無料トライアルを始める';
  const heroCtaAria = isEnglishLanding ? 'Start your free trial' : '無料トライアルを始める';
  const helmetDescription = isEnglishLanding
    ? 'Start your jazz adventure in a fantasy realm. Practice with real-time feedback, unlock quests, and battle through Fantasy Mode.'
    : 'ゲーム感覚でジャズが弾けるようになる学習プラットフォーム。コード進行の暗記、名演ソロの再現、動画レッスンまで。';
  const finalHeadingText = isEnglishLanding ? 'Start your free trial now' : '今すぐ無料トライアルを始める';
  const finalDescriptionText = isEnglishLanding
    ? 'Registration takes just a few minutes. You can also try the demo first.'
    : '登録は数分で完了。おためしプレイも可能です。';

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="lp-root text-white flex h-screen flex-col overflow-hidden" style={{ fontFamily: '"Kaisei Opti", serif' }}>
        <Helmet>
          <title>Jazzify</title>
          <meta name="description" content={helmetDescription} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kaisei+Opti:wght@400;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef}>
        {/* Header */}
        <nav className="fixed top-0 left-0 right-0 w-full bg-slate-900 bg-opacity-90 backdrop-blur-md z-50 border-b border-purple-500 border-opacity-30">
          <div className="container mx-auto px-6 py-2 md:py-4">
            <div className="flex items-center justify-between">
              <h1 className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                <img src="/default_avater/default-avater.png" alt="Jazzify ロゴ" className="w-8 h-8 rounded-full" />
                Jazzify
              </h1>

              {navLinks.length > 0 && (
                <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
                  {navLinks.map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      className="hover:text-purple-400 transition"
                      onClick={(e) => handleAnchorClick(e, link.id)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/signup" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition text-xs sm:text-sm font-bold whitespace-nowrap">
                  {isEnglishLanding ? 'Sign In / Sign Up' : 'ログイン/無料トライアル'}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero-bg min-h-screen pt-16 sm:pt-20 flex items-center overflow-x-hidden">
          <div className="container mx-auto px-6">
            <div className="firstview-layout items-center">
              <div className="w-full md:w-1/2">
                <img src="/first-view.png" alt="ジャズの冒険イメージ" className="w-full h-auto rounded-2xl shadow-2xl border border-white/10" />
              </div>
              <div className="w-full md:w-1/2">
                <div className="text-center md:text-left">
                    <TypewriterText
                      text={heroTitleText}
                    className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 section-title"
                    dataAnimate="from-behind heading-underline"
                    speedMsPerChar={110}
                    delayMs={100}
                  />
                    <TypewriterText
                      text={heroSubtitleText}
                    className="text-lg sm:text-xl md:text-2xl text-purple-200 mb-8"
                    dataAnimate="from-behind"
                    speedMsPerChar={120}
                    delayMs={1000}
                  />
                </div>
                <div className="text-center md:text-left">
                  <Link
                      to="/signup"
                      aria-label={heroCtaAria}
                    className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold shadow-lg text-base sm:text-lg"
                  >
                      {primaryCtaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fantasy Demo */}
        <React.Suspense fallback={<div className="py-12 text-center text-gray-400">{isEnglishLanding ? 'Loading demo...' : 'デモを読み込み中...'}</div>}>
          <LPFantasyDemo />
        </React.Suspense>

        {/* ===== English sections ===== */}
        {isEnglishLanding && (
          <>
            <section id="pricing" className="py-20 story-gradient" data-animate="slide-right text-up">
              <div className="container mx-auto px-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4" data-animate="from-behind heading-underline">
                  <img src="/stage_icons/10.png" alt="Pricing" className="w-16 h-16" />
                  Pricing
                </h2>
                <div className="max-w-md mx-auto" data-animate="alt-cards text-up">
                  <div className="pricing-card premium rounded-2xl p-8 text-center">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-black text-xs px-3 py-1 rounded-full inline-block mb-4">Standard</div>
                    <h3 className="text-2xl font-bold text-purple-300 mb-4">Monthly Plan</h3>
                    <div className="text-4xl font-bold text-white mb-6">$19<span className="text-sm text-gray-400">/month</span></div>
                    <ul className="space-y-3 text-sm text-gray-400 mb-6">
                      <li><i className="fas fa-check text-green-400 mr-2"></i>1 week free trial</li>
                      <li><i className="fas fa-check text-green-400 mr-2"></i>Fantasy Mode (unlimited)</li>
                      <li><i className="fas fa-check text-green-400 mr-2"></i>MIDI keyboard support</li>
                      <li><i className="fas fa-check text-green-400 mr-2"></i>Cancel anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section id="faq" className="py-20" data-animate="slide-left text-up">
              <div className="container mx-auto px-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4" data-animate="from-behind heading-underline">
                  <img src="/stage_icons/1.png" alt="FAQ" className="w-16 h-16" />
                  FAQ
                </h2>
                <div className="max-w-4xl mx-auto space-y-6" data-animate="alt-cards text-up">
                  {(Array.from([1, 2, 3]) as number[]).map((id) => (
                    <div key={id} className="faq-item rounded-xl p-6">
                      <button
                        className="w-full flex items-center justify-between cursor-pointer"
                        onClick={() => toggleFAQ(id)}
                        aria-expanded={openFaqId === id}
                        aria-controls={`faq-content-en-${id}`}
                      >
                        <h3 className="text-lg font-bold text-white">
                          {id === 1 && 'What devices can I use?'}
                          {id === 2 && 'How do I use MIDI devices on iOS (iPhone/iPad)?'}
                          {id === 3 && 'Can I cancel anytime?'}
                        </h3>
                        <i className={`fas ${openFaqId === id ? 'fa-chevron-up' : 'fa-chevron-down'} text-purple-400`}></i>
                      </button>
                      <div
                        id={`faq-content-en-${id}`}
                        className={`mt-4 text-gray-400 ${openFaqId === id ? '' : 'hidden'}`}
                      >
                        {id === 1 && 'You can use MIDI keyboards with our application. Connect your MIDI device and start practicing!'}
                        {id === 2 && (
                          <span>
                            iOS (Safari, etc.) does not support Web MIDI API. Please use{' '}
                            <a
                              href="https://apps.apple.com/us/app/web-midi-browser/id953846217?l"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-300"
                            >
                              Web MIDI Browser
                            </a>
                            {' '}from the App Store.
                          </span>
                        )}
                        {id === 3 && '1 week free trial is included. You can cancel your subscription at any time.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ===== Japanese sections ===== */}
        {!isEnglishLanding && (
          <>
        {/* 成果セクション */}
        <section className="py-16 sm:py-20" data-animate="slide-left text-up">
          <div className="container mx-auto px-6">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 section-title"
              data-animate="from-behind heading-underline"
            >
              Jazzifyで身につくこと
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" data-animate="alt-cards text-up">
              <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/monster_icons/monster_35.png" alt="コード進行" className="w-14 h-14 object-contain" loading="lazy" />
                </div>
                <h3 className="text-xl font-bold text-purple-300 mb-2">ジャズの響きを手に覚えこませる</h3>
                <p className="text-gray-400">ゲーム感覚で、ジャズの定番コードが指に馴染む</p>
              </div>
              <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/monster_icons/monster_61.png" alt="名演再現" className="w-14 h-14 object-contain" loading="lazy" />
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-2">名演ソロを耳コピ＆再現</h3>
                <p className="text-gray-400">巨匠たちの伝説的なソロを、自分の手でなぞって体得する</p>
              </div>
              <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img src="/stage_icons/3.png" alt="体系的レッスン" className="w-14 h-14 object-contain" loading="lazy" />
                </div>
                <h3 className="text-xl font-bold text-blue-300 mb-2">基礎から体系的にレッスン</h3>
                <p className="text-gray-400">動画付きカリキュラムで、何から始めればいいか迷わない</p>
              </div>
            </div>
          </div>
        </section>

        {/* 学習モード */}
        <section id="modes" className="py-16 sm:py-20 story-gradient" data-animate="slide-right text-up">
          <div className="container mx-auto px-6">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 section-title flex items-center justify-center gap-4"
              data-animate="from-behind heading-underline"
            >
              <img src="/stage_icons/1.png" alt="学習モード" className="w-16 h-16" loading="lazy" />
              学習モード
            </h2>

            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto" data-animate="alt-cards text-up">
              <div className="feature-card rounded-2xl overflow-hidden text-center">
                <div className="w-full aspect-video bg-slate-800/60 border-b border-slate-700 flex items-center justify-center overflow-hidden">
                  <img src="/regend_demo.png" alt="レジェンドモード：楽譜とピアノロールで名演ソロを再現" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/monster_icons/monster_61.png" alt="レジェンドモード" className="w-12 h-12 object-contain" loading="lazy" />
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-300 mb-3">レジェンドモード</h3>
                  <p className="text-gray-300">巨匠の名演ソロを再現しながら、フレーズを体で覚える</p>
                </div>
              </div>

              <div className="feature-card rounded-2xl overflow-hidden text-center">
                <div className="w-full aspect-video bg-slate-800/60 border-b border-slate-700 flex items-center justify-center overflow-hidden">
                  <img src="/fantasy_demo.png" alt="ファンタジーモード：RPG風バトルでコード進行をマスター" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/monster_icons/monster_35.png" alt="ファンタジーモード" className="w-12 h-12 object-contain" loading="lazy" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-300 mb-3">ファンタジーモード</h3>
                  <p className="text-gray-300">RPG風バトルで、コード進行をゲーム感覚でマスター</p>
                </div>
              </div>

              <div className="feature-card rounded-2xl overflow-hidden text-center">
                <div className="w-full aspect-video bg-slate-800/60 border-b border-slate-700 flex items-center justify-center overflow-hidden">
                  <img src="/lessons_demo.png" alt="レッスンモード：コースとレッスンで体系的に学習" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src="/stage_icons/3.png" alt="レッスンモード" className="w-12 h-12 object-contain" loading="lazy" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-300 mb-3">レッスンモード</h3>
                  <p className="text-gray-300">動画付きカリキュラムで、基礎から応用まで体系的に学習</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 料金プラン */}
        <section id="pricing" className="py-16 sm:py-20" data-animate="slide-right text-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 section-title flex items-center justify-center gap-4" data-animate="from-behind heading-underline">
              <img src="/stage_icons/10.png" alt="料金プラン" className="w-16 h-16" loading="lazy" />
              料金プラン
            </h2>
            <p className="text-center text-sm text-green-400 mb-10">すべての有料プランに7日間（1週間）無料トライアル</p>

            <div className="overflow-x-auto" data-animate="alt-cards text-up">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left bg-slate-900/80 border border-slate-700 min-w-[140px]">
                      <span className="text-gray-400 text-sm">機能</span>
                    </th>
                    <th className="p-4 text-center border border-slate-700 min-w-[120px] bg-slate-800/80">
                      <div className="text-lg font-semibold text-white">フリー</div>
                      <div className="text-2xl font-bold text-white mt-1">¥0</div>
                    </th>
                    <th className="p-4 text-center border border-slate-700 min-w-[120px] bg-slate-800/80">
                      <div className="text-lg font-semibold text-white">スタンダード</div>
                      <div className="text-2xl font-bold text-white mt-1">¥2,980<span className="text-xs text-gray-400 font-normal">/月</span></div>
                      <div className="text-xs text-green-400 mt-1">7日間無料トライアル</div>
                    </th>
                    <th className="p-4 text-center border border-slate-700 border-t-2 border-t-purple-500 min-w-[120px] bg-slate-800/80">
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black">おすすめ</span>
                      <div className="text-lg font-semibold text-white">プレミアム</div>
                      <div className="text-2xl font-bold text-white mt-1">¥8,980<span className="text-xs text-gray-400 font-normal">/月</span></div>
                      <div className="text-xs text-green-400 mt-1">7日間無料トライアル</div>
                    </th>
                    <th className="p-4 text-center border border-slate-700 min-w-[120px] bg-slate-800/80">
                      <div className="text-lg font-semibold text-white">プラチナ</div>
                      <div className="text-2xl font-bold text-white mt-1">¥14,800<span className="text-xs text-gray-400 font-normal">/月</span></div>
                      <div className="text-xs text-green-400 mt-1">7日間無料トライアル</div>
                    </th>
                    <th className="p-4 text-center border border-slate-700 min-w-[120px] bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-black/80">
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium mb-2 bg-slate-200 text-black">最上位</span>
                      <div className="text-lg font-semibold text-white">ブラック</div>
                      <div className="text-2xl font-bold text-white mt-1">¥19,800<span className="text-xs text-gray-400 font-normal">/月</span></div>
                      <div className="text-xs text-green-400 mt-1">7日間無料トライアル</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { label: 'コミュニティ機能\n(日記・ランキング)', values: ['×', '○', '○', '○', '○'] },
                    { label: 'ミッション', values: ['×', '○', '○', '○', '○'] },
                    { label: 'ファンタジー', values: ['×', '○', '○', '○', '○'] },
                    { label: 'レジェンド', values: ['×', '5曲', '無制限', '無制限', '無制限'] },
                    { label: 'サバイバル', values: ['×', '1キャラ', '無制限', '無制限', '無制限'] },
                    { label: 'レッスン', values: ['×', '1コースのみ', '無制限', '無制限', '無制限'] },
                    { label: 'レッスンブロックの\n手動解放', values: ['×', '×', '×', '月10ブロック', '月10ブロック'] },
                    { label: 'LINEでの課題添削', values: ['×', '×', '×', '×', '○'] },
                  ] as { label: string; values: string[] }[]).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/20'}>
                      <td className="p-3 border border-slate-700 text-sm text-gray-300 font-medium whitespace-pre-line">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-3 border border-slate-700 text-center">
                          {v === '○' ? <span className="text-green-400 text-lg font-bold">○</span>
                            : v === '×' ? <span className="text-red-400 text-lg font-bold">×</span>
                            : <span className="text-white text-sm font-medium">{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 sm:py-20 story-gradient" data-animate="slide-left text-up">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4" data-animate="from-behind heading-underline">
              <img src="/stage_icons/1.png" alt="よくある質問" className="w-16 h-16" loading="lazy" />
              よくある質問
            </h2>

            <div className="max-w-4xl mx-auto space-y-6" data-animate="alt-cards text-up">
              {(Array.from([1, 2, 3, 4, 5, 6]) as number[]).map((id) => (
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
                      {id === 6 && 'iPhone、iPadでMIDI機器が使用できません。'}
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
                    {id === 6 && (
                      <span>
                        iOS（Safari等）では Web MIDI API が利用できません。App Store の{' '}
                        <a
                          href="https://apps.apple.com/us/app/web-midi-browser/id953846217?l"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-300"
                        >
                          Web MIDI Browser
                        </a>
                        {' '}のご利用をご検討ください。{' '}
                        <Link to="/help/ios-midi" className="underline text-blue-300">詳しくはこちら</Link>
                        {' ／ '}
                        <Link to="/contact" className="underline text-blue-300">お問い合わせフォーム</Link>
                        へどうぞ。
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
          </>
        )}

        {/* Final CTA */}
        <section className="py-20" data-animate="slide-right text-up">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6" data-animate="from-behind heading-underline">
              {finalHeadingText}
            </h2>
            <p className="text-gray-300 mb-8">{finalDescriptionText}</p>
            <div className="flex items-center justify-center">
              <Link
                to="/signup"
                aria-label={heroCtaAria}
                className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition font-bold text-sm sm:text-base"
              >
                {primaryCtaLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* English Footer */}
        {isEnglishLanding && (
          <footer className="py-16 bg-slate-900 border-t border-purple-500 border-opacity-30">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="col-span-1">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                    <i className="fas fa-music mr-2"></i>Jazzify
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Embark on a jazz adventure in a fantasy realm. A learning platform for all jazz enthusiasts, from beginners to advanced players.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Support</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link to="/contact" className="hover:text-purple-400 transition">Contact</Link></li>
                    <li><Link to="/terms" className="hover:text-purple-400 transition">Terms of Service</Link></li>
                    <li><Link to="/privacy" className="hover:text-purple-400 transition">Privacy Policy</Link></li>
                    <li><Link to="/legal/tokushoho" className="hover:text-purple-400 transition">Legal Notice</Link></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} Jazzify. All rights reserved.</p>
              </div>
            </div>
          </footer>
        )}

        {/* Japanese Footer */}
        {!isEnglishLanding && (
          <footer className="py-16 bg-slate-900 border-t border-purple-500 border-opacity-30">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="col-span-1">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                    <i className="fas fa-music mr-2"></i>Jazzify
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    ゲーム感覚でジャズが弾けるようになる。初心者から上級者まで、すべてのジャズ愛好家のための学習プラットフォームです。
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-4">サービス</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    {navLinks.map(l => (
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
                    <li><Link to="/help/ios-midi" className="hover:text-purple-400 transition">iPhone/iPadでMIDIを使う</Link></li>
                    <li><Link to="/contact" className="hover:text-purple-400 transition">お問い合わせ</Link></li>
                    <li><Link to="/terms" className="hover:text-purple-400 transition">利用規約</Link></li>
                    <li><Link to="/privacy" className="hover:text-purple-400 transition">プライバシーポリシー</Link></li>
                    <li><Link to="/legal/tokushoho" className="hover:text-purple-400 transition">特定商取引法に基づく表記</Link></li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} Jazzify. All rights reserved.</p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
