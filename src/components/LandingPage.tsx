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
    <div className="lp-root flex h-screen flex-col overflow-hidden" style={{ fontFamily: '"Kaisei Opti", serif', color: 'var(--lp-cream)' }}>
        <Helmet>
          <title>Jazzify</title>
          <meta name="description" content={helmetDescription} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,600&family=Kaisei+Opti:wght@400;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef} style={{ background: 'var(--lp-base)' }}>
        {/* Header */}
        <nav className="fixed top-0 left-0 right-0 w-full z-50" style={{ background: 'rgba(7,11,20,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(200,162,77,0.12)' }}>
          <div className="container mx-auto px-6 py-2 md:py-4">
            <div className="flex items-center justify-between">
              <h1 className="lp-display flex items-center gap-3 text-2xl font-bold" style={{ color: 'var(--lp-gold)' }}>
                <img src="/default_avater/default-avater.png" alt="Jazzify ロゴ" className="w-8 h-8 rounded-full" />
                Jazzify
              </h1>

              {navLinks.length > 0 && (
                <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
                  {navLinks.map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      className="transition-colors duration-200"
                      style={{ ['--tw-text-opacity' as string]: 1 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--lp-gold)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--lp-cream-muted)')}
                      onClick={(e) => handleAnchorClick(e, link.id)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/signup" className="lp-btn-gold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap">
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
                <img src="/first-view.png" alt="ジャズの冒険イメージ" className="w-full h-auto rounded-lg" style={{ border: '1px solid rgba(200,162,77,0.08)' }} />
              </div>
              <div className="w-full md:w-1/2">
                <div className="text-center md:text-left">
                    <TypewriterText
                      text={heroTitleText}
                    className="lp-display-hero text-5xl sm:text-6xl md:text-8xl font-black mb-6 section-title"
                    dataAnimate="from-behind heading-underline"
                    speedMsPerChar={110}
                    delayMs={100}
                  />
                    <TypewriterText
                      text={heroSubtitleText}
                    className="text-lg sm:text-xl md:text-2xl mb-10"
                    dataAnimate="from-behind"
                    speedMsPerChar={120}
                    delayMs={1000}
                  />
                </div>
                <div className="text-center md:text-left">
                  <Link
                      to="/signup"
                      aria-label={heroCtaAria}
                    className="lp-btn-gold inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg"
                  >
                      {primaryCtaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Beta Banner */}
        <section className="py-10 sm:py-14 text-center" style={{ background: 'linear-gradient(180deg, rgba(200,162,77,0.06) 0%, transparent 100%)' }}>
          <div className="container mx-auto px-6">
            <div className="inline-block mb-4 px-4 py-1 rounded-full text-xs font-bold lp-mono" style={{ background: 'rgba(200,162,77,0.12)', color: 'var(--lp-gold-light)', border: '1px solid rgba(200,162,77,0.2)' }}>
              {isEnglishLanding ? 'OPEN BETA' : 'オープンβテスト中'}
            </div>
            <p className="text-lg sm:text-xl mb-2" style={{ color: 'var(--lp-cream)' }}>
              {isEnglishLanding
                ? 'Open beta until March 15 — play all features for free.'
                : '3/15までオープンβテスト中。すべての機能を無料でプレイできます。'}
            </p>
            <p className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
              {isEnglishLanding
                ? 'Official launch scheduled for March 19.'
                : '3/19に正式リリース予定。'}
            </p>
          </div>
        </section>

        {/* Fantasy Demo */}
        <React.Suspense fallback={<div className="py-12 text-center" style={{ color: 'var(--lp-cream-muted)' }}>{isEnglishLanding ? 'Loading demo...' : 'デモを読み込み中...'}</div>}>
          <LPFantasyDemo />
        </React.Suspense>

        {/* ===== English sections ===== */}
        {isEnglishLanding && (
          <>
            <div className="lp-gold-rule my-8" />
            <section id="pricing" className="py-24 sm:py-32" data-animate="slide-right text-up">
              <div className="container mx-auto px-6">
                <div className="text-center mb-6">
                  <span className="lp-section-label" data-animate="from-behind">001 — pricing</span>
                </div>
                <h2 className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-16 section-title" data-animate="from-behind heading-underline">
                  Pricing
                </h2>
                <div className="max-w-md mx-auto" data-animate="alt-cards text-up">
                  <div className="pricing-card premium rounded-2xl p-8 text-center">
                    <div className="lp-btn-gold text-xs px-3 py-1 rounded-full inline-block mb-4">Standard</div>
                    <h3 className="text-2xl font-bold mb-4 lp-display" style={{ color: 'var(--lp-gold-light)' }}>Monthly Plan</h3>
                    <div className="text-4xl font-bold mb-6 lp-display" style={{ color: 'var(--lp-cream)' }}>$19<span className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}>/month</span></div>
                    <ul className="space-y-3 text-sm mb-6" style={{ color: 'var(--lp-cream-muted)' }}>
                      <li><i className="fas fa-check mr-2" style={{ color: 'var(--lp-gold)' }}></i>1 week free trial</li>
                      <li><i className="fas fa-check mr-2" style={{ color: 'var(--lp-gold)' }}></i>Fantasy Mode (unlimited)</li>
                      <li><i className="fas fa-check mr-2" style={{ color: 'var(--lp-gold)' }}></i>MIDI keyboard support</li>
                      <li><i className="fas fa-check mr-2" style={{ color: 'var(--lp-gold)' }}></i>Cancel anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <div className="lp-gold-rule my-8" />
            <section id="faq" className="py-24 sm:py-32" data-animate="slide-left text-up">
              <div className="container mx-auto px-6">
                <div className="text-center mb-6">
                  <span className="lp-section-label" data-animate="from-behind">002 — faq</span>
                </div>
                <h2 className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-20 section-title" data-animate="from-behind heading-underline">
                  FAQ
                </h2>
                <div className="max-w-3xl mx-auto" data-animate="alt-cards text-up">
                  {(Array.from([1, 2, 3]) as number[]).map((id) => (
                    <div key={id} className="faq-item py-6">
                      <button
                        className="w-full flex items-center justify-between cursor-pointer text-left gap-4"
                        onClick={() => toggleFAQ(id)}
                        aria-expanded={openFaqId === id}
                        aria-controls={`faq-content-en-${id}`}
                      >
                        <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--lp-cream)' }}>
                          {id === 1 && 'What devices can I use?'}
                          {id === 2 && 'How do I use MIDI devices on iOS (iPhone/iPad)?'}
                          {id === 3 && 'Can I cancel anytime?'}
                        </h3>
                        <i className={`fas ${openFaqId === id ? 'fa-chevron-up' : 'fa-chevron-down'} shrink-0`} style={{ color: 'var(--lp-gold-dim)' }}></i>
                      </button>
                      <div
                        id={`faq-content-en-${id}`}
                        className={`mt-4 ${openFaqId === id ? '' : 'hidden'}`}
                        style={{ color: 'var(--lp-cream-muted)' }}
                      >
                        {id === 1 && 'You can use MIDI keyboards with our application. Connect your MIDI device and start practicing!'}
                        {id === 2 && (
                          <span>
                            iOS (Safari, etc.) does not support Web MIDI API. Please use{' '}
                            <a
                              href="https://apps.apple.com/us/app/web-midi-browser/id953846217?l"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                              style={{ color: '#7db4d8' }}
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
        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* 成果セクション */}
        <section className="py-24 sm:py-32" data-animate="slide-left text-up">
          <div className="container mx-auto px-6">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">001 — learn</span>
            </div>
            <h2
              className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-20 section-title"
              data-animate="from-behind heading-underline"
            >
              Jazzifyで身につくこと
            </h2>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto" data-animate="alt-cards text-up">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center overflow-hidden" style={{ border: '1px solid rgba(200,162,77,0.1)' }}>
                  <img src="/monster_icons/monster_35.png" alt="コード進行" className="w-14 h-14 object-contain" loading="lazy" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--lp-gold-light)' }}>ジャズの響きを手に覚えこませる</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>ゲーム感覚で、ジャズの定番コードが指に馴染む</p>
              </div>
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center overflow-hidden" style={{ border: '1px solid rgba(200,162,77,0.1)' }}>
                  <img src="/monster_icons/monster_61.png" alt="名演再現" className="w-14 h-14 object-contain" loading="lazy" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#e8c874' }}>名演ソロを耳コピ＆再現</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>巨匠たちの伝説的なソロを、自分の手でなぞって体得する</p>
              </div>
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center overflow-hidden" style={{ border: '1px solid rgba(200,162,77,0.1)' }}>
                  <img src="/stage_icons/3.png" alt="体系的レッスン" className="w-14 h-14 object-contain" loading="lazy" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#7db4d8' }}>基礎から体系的にレッスン</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>動画付きカリキュラムで、何から始めればいいか迷わない</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* 学習モード */}
        <section id="modes" className="py-24 sm:py-32" data-animate="slide-right text-up">
          <div className="container mx-auto px-6">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">002 — modes</span>
            </div>
            <h2
              className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-20 section-title"
              data-animate="from-behind heading-underline"
            >
              学習モード
            </h2>

            <div className="grid lg:grid-cols-3 gap-10 max-w-5xl mx-auto" data-animate="alt-cards text-up">
              <div className="feature-card rounded-lg overflow-hidden text-center">
                <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                  <img src="/regend_demo.png" alt="レジェンドモード：楽譜とピアノロールで名演ソロを再現" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-8">
                  <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: '#e8c874' }}>レジェンドモード</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>巨匠の名演ソロを再現しながら、フレーズを体で覚える</p>
                </div>
              </div>

              <div className="feature-card rounded-lg overflow-hidden text-center">
                <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                  <img src="/fantasy_demo.png" alt="ファンタジーモード：RPG風バトルでコード進行をマスター" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-8">
                  <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: 'var(--lp-gold-light)' }}>ファンタジーモード</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>RPG風バトルで、コード進行をゲーム感覚でマスター</p>
                </div>
              </div>

              <div className="feature-card rounded-lg overflow-hidden text-center">
                <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                  <img src="/lessons_demo.png" alt="レッスンモード：コースとレッスンで体系的に学習" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-8">
                  <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: '#7db4d8' }}>レッスンモード</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>動画付きカリキュラムで、基礎から応用まで体系的に学習</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* 料金プラン */}
        <section id="pricing" className="py-24 sm:py-32" data-animate="slide-right text-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">003 — pricing</span>
            </div>
            <h2 className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-8 section-title" data-animate="from-behind heading-underline">
              料金プラン
            </h2>
            <p className="text-center text-sm mb-10" style={{ color: 'var(--lp-gold)' }}>すべての有料プランに7日間（1週間）無料トライアル</p>

            <div className="overflow-x-auto" data-animate="alt-cards text-up">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left min-w-[140px]" style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(200,162,77,0.08)' }}>
                      <span className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}>機能</span>
                    </th>
                    <th className="p-4 text-center min-w-[120px]" style={{ background: 'rgba(13,19,33,0.8)', border: '1px solid rgba(200,162,77,0.08)' }}>
                      <div className="text-lg font-semibold" style={{ color: 'var(--lp-cream)' }}>フリー</div>
                      <div className="text-2xl font-bold mt-1 lp-display" style={{ color: 'var(--lp-cream)' }}>¥0</div>
                    </th>
                    <th className="p-4 text-center min-w-[120px]" style={{ background: 'rgba(13,19,33,0.8)', border: '1px solid rgba(200,162,77,0.08)' }}>
                      <div className="text-lg font-semibold" style={{ color: 'var(--lp-cream)' }}>スタンダード</div>
                      <div className="text-2xl font-bold mt-1 lp-display" style={{ color: 'var(--lp-cream)' }}>¥2,980<span className="text-xs font-normal" style={{ color: 'var(--lp-cream-muted)' }}>/月</span></div>
                      <div className="text-xs mt-1" style={{ color: 'var(--lp-gold)' }}>7日間無料トライアル</div>
                    </th>
                    <th className="p-4 text-center min-w-[120px]" style={{ background: 'rgba(13,19,33,0.8)', border: '1px solid rgba(200,162,77,0.08)', borderTop: '2px solid var(--lp-gold)' }}>
                      <span className="lp-btn-gold inline-block px-3 py-0.5 rounded-full text-xs font-medium mb-2">おすすめ</span>
                      <div className="text-lg font-semibold" style={{ color: 'var(--lp-cream)' }}>プレミアム</div>
                      <div className="text-2xl font-bold mt-1 lp-display" style={{ color: 'var(--lp-cream)' }}>¥8,980<span className="text-xs font-normal" style={{ color: 'var(--lp-cream-muted)' }}>/月</span></div>
                      <div className="text-xs mt-1" style={{ color: 'var(--lp-gold)' }}>7日間無料トライアル</div>
                    </th>
                    <th className="p-4 text-center min-w-[120px]" style={{ background: 'rgba(13,19,33,0.8)', border: '1px solid rgba(200,162,77,0.08)' }}>
                      <div className="text-lg font-semibold" style={{ color: 'var(--lp-cream)' }}>プラチナ</div>
                      <div className="text-2xl font-bold mt-1 lp-display" style={{ color: 'var(--lp-cream)' }}>¥14,800<span className="text-xs font-normal" style={{ color: 'var(--lp-cream-muted)' }}>/月</span></div>
                      <div className="text-xs mt-1" style={{ color: 'var(--lp-gold)' }}>7日間無料トライアル</div>
                    </th>
                    <th className="p-4 text-center min-w-[120px]" style={{ background: 'linear-gradient(160deg, rgba(13,19,33,0.9), rgba(7,11,20,0.95))', border: '1px solid rgba(200,162,77,0.08)' }}>
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium mb-2" style={{ background: 'rgba(200,162,77,0.15)', color: 'var(--lp-gold-light)' }}>最上位</span>
                      <div className="text-lg font-semibold" style={{ color: 'var(--lp-cream)' }}>ブラック</div>
                      <div className="text-2xl font-bold mt-1 lp-display" style={{ color: 'var(--lp-cream)' }}>¥19,800<span className="text-xs font-normal" style={{ color: 'var(--lp-cream-muted)' }}>/月</span></div>
                      <div className="text-xs mt-1" style={{ color: 'var(--lp-gold)' }}>7日間無料トライアル</div>
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
                    { label: 'LINEでの上達サポート', values: ['×', '×', '×', '×', '○'] },
                  ] as { label: string; values: string[] }[]).map((row, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'rgba(7,11,20,0.4)' : 'rgba(13,19,33,0.3)' }}>
                      <td className="p-3 text-sm font-medium whitespace-pre-line" style={{ border: '1px solid rgba(200,162,77,0.06)', color: 'var(--lp-cream-muted)' }}>{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-3 text-center" style={{ border: '1px solid rgba(200,162,77,0.06)' }}>
                          {v === '○' ? <span className="text-lg font-bold" style={{ color: 'var(--lp-gold)' }}>○</span>
                            : v === '×' ? <span className="text-lg font-bold" style={{ color: '#6b5c5c' }}>×</span>
                            : <span className="text-sm font-medium" style={{ color: 'var(--lp-cream)' }}>{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* FAQ */}
        <section id="faq" className="py-24 sm:py-32" data-animate="slide-left text-up">
          <div className="container mx-auto px-6">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">004 — faq</span>
            </div>
            <h2 className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-20 section-title" data-animate="from-behind heading-underline">
              よくある質問
            </h2>

            <div className="max-w-3xl mx-auto" data-animate="alt-cards text-up">
              {(Array.from([1, 2, 3, 4, 5, 6]) as number[]).map((id) => (
                <div key={id} className="faq-item py-6">
                  <button
                    className="w-full flex items-center justify-between cursor-pointer text-left gap-4"
                    onClick={() => toggleFAQ(id)}
                    aria-expanded={openFaqId === id}
                    aria-controls={`faq-content-${id}`}
                  >
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--lp-cream)' }}>
                      {id === 1 && '楽器未経験者でも大丈夫ですか？'}
                      {id === 2 && 'どんな楽器に対応していますか？'}
                      {id === 3 && 'オフラインでも使用できますか？'}
                      {id === 4 && 'プラン変更はいつでもできますか？'}
                      {id === 5 && 'キャンセル・返金は可能ですか？'}
                      {id === 6 && 'iPhone、iPadでMIDI機器が使用できません。'}
                    </h3>
                    <i className={`fas ${openFaqId === id ? 'fa-chevron-up' : 'fa-chevron-down'} shrink-0`} style={{ color: 'var(--lp-gold-dim)' }}></i>
                  </button>
                  <div
                    id={`faq-content-${id}`}
                    className={`mt-4 ${openFaqId === id ? '' : 'hidden'}`}
                    style={{ color: 'var(--lp-cream-muted)' }}
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
                          className="underline"
                          style={{ color: '#7db4d8' }}
                        >
                          Web MIDI Browser
                        </a>
                        {' '}のご利用をご検討ください。{' '}
                        <Link to="/help/ios-midi" className="underline" style={{ color: '#7db4d8' }}>詳しくはこちら</Link>
                        {' ／ '}
                        <Link to="/contact" className="underline" style={{ color: '#7db4d8' }}>お問い合わせフォーム</Link>
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

        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* Developer's Voice */}
        <section className="py-28 sm:py-40 relative overflow-hidden" data-animate="slide-left text-up">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 60% at 25% 40%, rgba(59,107,156,0.06), transparent)' }} />
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">{isEnglishLanding ? '005 — voice' : '005 — voice'}</span>
            </div>
            <h2
              className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-20 section-title"
              data-animate="from-behind heading-underline"
            >
              {isEnglishLanding ? "Developer's Voice" : '開発者の声'}
            </h2>

            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start gap-12 md:gap-20" data-animate="alt-cards text-up">
              <div className="shrink-0 relative">
                <div className="w-52 h-64 sm:w-60 sm:h-72 rounded-lg overflow-hidden lp-developer-photo">
                  <img
                    src="/profile.jpg"
                    alt={isEnglishLanding ? 'Developer playing piano at a jazz club' : '開発者 ジャズクラブでの演奏風景'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="flex-1 md:pt-4">
                <div className="lp-quote-mark text-9xl leading-none mb-0 hidden md:block" style={{ marginBottom: '-2rem' }} aria-hidden="true">&ldquo;</div>
                <blockquote className="lp-display text-xl sm:text-2xl md:text-3xl leading-snug mb-8 font-light" style={{ color: 'var(--lp-cream)', fontStyle: 'italic', fontVariationSettings: "'opsz' 36, 'SOFT' 0, 'WONK' 1" }}>
                  {isEnglishLanding
                    ? 'When I started learning jazz on my own, I kept hitting walls — I didn\'t know how to practice. "If only something like this existed when I was a beginner" — that thought is what started Jazzify.'
                    : 'ジャズを独学で始めた時、練習方法がわからず何度も壁にぶつかりました。「私が初学者のころにこんなものがあれば、」——その思いが、Jazzifyの原点です。'}
                </blockquote>
                <div className="lp-divider mb-5" />
                <div>
                  <p className="lp-mono text-xs mb-1" style={{ color: 'var(--lp-gold)' }}>
                    {isEnglishLanding ? 'Toshio Nagayoshi' : '永吉 俊雄'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
                    {isEnglishLanding ? 'Jazzify Developer & Jazz Pianist' : 'Jazzify 開発者 / ジャズピアニスト'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* Final CTA */}
        <section className="py-28 sm:py-36 relative" data-animate="slide-right text-up">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(200,162,77,0.04), transparent)' }} />
          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="lp-display-hero text-4xl sm:text-5xl md:text-7xl font-extrabold mb-8 section-title" data-animate="from-behind heading-underline">
              {finalHeadingText}
            </h2>
            <p className="mb-12 text-lg" style={{ color: 'var(--lp-cream-muted)' }}>{finalDescriptionText}</p>
            <div className="flex items-center justify-center">
              <Link
                to="/signup"
                aria-label={heroCtaAria}
                className="lp-btn-gold px-8 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg"
              >
                {primaryCtaLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* English Footer */}
        {isEnglishLanding && (
          <footer className="py-16" style={{ background: 'var(--lp-base)', borderTop: '1px solid rgba(200,162,77,0.1)' }}>
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="col-span-1">
                  <h3 className="lp-display text-2xl font-bold mb-4" style={{ color: 'var(--lp-gold)' }}>
                    <i className="fas fa-music mr-2"></i>Jazzify
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>
                    Embark on a jazz adventure in a fantasy realm. A learning platform for all jazz enthusiasts, from beginners to advanced players.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-4" style={{ color: 'var(--lp-cream)' }}>Support</h4>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
                    <li><Link to="/contact" className="transition-colors duration-200 hover:opacity-80">Contact</Link></li>
                    <li><Link to="/terms" className="transition-colors duration-200 hover:opacity-80">Terms of Service</Link></li>
                    <li><Link to="/privacy" className="transition-colors duration-200 hover:opacity-80">Privacy Policy</Link></li>
                    <li><Link to="/legal/tokushoho" className="transition-colors duration-200 hover:opacity-80">Legal Notice</Link></li>
                  </ul>
                </div>
              </div>
              <div className="pt-8 text-center text-sm" style={{ borderTop: '1px solid rgba(200,162,77,0.08)', color: 'var(--lp-cream-muted)' }}>
                <p>&copy; {new Date().getFullYear()} Jazzify. All rights reserved.</p>
              </div>
            </div>
          </footer>
        )}

        {/* Japanese Footer */}
        {!isEnglishLanding && (
          <footer className="py-16" style={{ background: 'var(--lp-base)', borderTop: '1px solid rgba(200,162,77,0.1)' }}>
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="col-span-1">
                  <h3 className="lp-display text-2xl font-bold mb-4" style={{ color: 'var(--lp-gold)' }}>
                    <i className="fas fa-music mr-2"></i>Jazzify
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>
                    ゲーム感覚でジャズが弾けるようになる。初心者から上級者まで、すべてのジャズ愛好家のための学習プラットフォームです。
                  </p>
                </div>

                <div>
                  <h4 className="font-bold mb-4" style={{ color: 'var(--lp-cream)' }}>サービス</h4>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
                    {navLinks.map(l => (
                      <li key={l.id}>
                        <a href={`#${l.id}`} className="transition-colors duration-200 hover:opacity-80" onClick={(e) => handleAnchorClick(e, l.id)}>
                          {l.label}
                        </a>
                      </li>
                    ))}
                    <li><Link to="/signup" className="transition-colors duration-200 hover:opacity-80">無料体験</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-4" style={{ color: 'var(--lp-cream)' }}>サポート</h4>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
                    <li><a href="#faq" className="transition-colors duration-200 hover:opacity-80" onClick={(e) => handleAnchorClick(e, 'faq')}>よくある質問</a></li>
                    <li><Link to="/help/ios-midi" className="transition-colors duration-200 hover:opacity-80">iPhone/iPadでMIDIを使う</Link></li>
                    <li><Link to="/contact" className="transition-colors duration-200 hover:opacity-80">お問い合わせ</Link></li>
                    <li><Link to="/terms" className="transition-colors duration-200 hover:opacity-80">利用規約</Link></li>
                    <li><Link to="/privacy" className="transition-colors duration-200 hover:opacity-80">プライバシーポリシー</Link></li>
                    <li><Link to="/legal/tokushoho" className="transition-colors duration-200 hover:opacity-80">特定商取引法に基づく表記</Link></li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 text-center text-sm" style={{ borderTop: '1px solid rgba(200,162,77,0.08)', color: 'var(--lp-cream-muted)' }}>
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
