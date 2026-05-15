import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getWindow } from '@/platform';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { CheckIcon } from '@/components/landing/LpPricingIcons';

import '@/landing.css';

const LPFantasyDemo = React.lazy(() => import('./fantasy/LPFantasyDemo'));
const LpEnglishPremiumPricing = React.lazy(() => import('@/components/landing/LpEnglishPremiumPricing'));

const HeroText: React.FC<{
  text: string;
  className?: string;
  dataAnimate?: string;
}> = ({ text, className = '', dataAnimate }) => (
  <p className={className} data-animate={dataAnimate}>
    {text}
  </p>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <span aria-hidden="true" className="shrink-0" style={{ color: 'var(--lp-gold-dim)' }}>
    {open ? '▴' : '▾'}
  </span>
);

const MusicNoteIcon: React.FC = () => (
  <span aria-hidden="true" className="mr-2">♪</span>
);

const APP_STORE_URL = 'https://apps.apple.com/us/app/jazzify/id6761457001';

const AppStoreBadge: React.FC<{ className?: string; english?: boolean }> = ({ className = '', english = false }) => (
  <a
    href={APP_STORE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full transition-opacity hover:opacity-80 ${className}`}
    style={{ background: 'var(--lp-cream)', color: '#000' }}
    aria-label={english ? 'Download Jazzify on the App Store' : 'App StoreでJazzifyをダウンロード'}
  >
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
    <span className="text-sm font-semibold">App Store</span>
  </a>
);

const LandingPage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const demoSentinelRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderFantasyDemo, setShouldRenderFantasyDemo] = useState(false);
  const isEnglishLanding = shouldUseEnglishCopy();

  useEffect(() => {
    const root = scrollRef.current;
    const target = demoSentinelRef.current;
    if (!root || !target || shouldRenderFantasyDemo) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldRenderFantasyDemo(true);
        observer.disconnect();
      }
    }, { root, threshold: 0, rootMargin: '300px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldRenderFantasyDemo]);

  // data-animate 要素に is-inview を付与（スクロール連動アニメーション）
  // LPFantasyDemo は lazy + Suspense のため、初回 effect 時点では DOM に無いことがある。
  // MutationObserver で後から挿入された [data-animate] も登録しないと opacity:0 のまま残る。
  useEffect(() => {
    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;

    const observed = new WeakSet<Element>();

    const animateObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview');
          }
        });
      },
      { root: scrollRoot, threshold: 0.05, rootMargin: '0px 0px -5% 0px' }
    );

    const scanAndObserve = () => {
      scrollRoot.querySelectorAll('[data-animate]').forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          animateObserver.observe(el);
        }
      });
    };

    scanAndObserve();

    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });
    mutationObserver.observe(scrollRoot, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      animateObserver.disconnect();
    };
  }, [shouldRenderFantasyDemo]);

  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const navLinks = useMemo(
    () => (
      isEnglishLanding
        ? [
            { id: 'modes', label: 'What you learn' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'faq', label: 'FAQ' },
          ]
        : [
            { id: 'modes', label: '身につくこと' },
            { id: 'pricing', label: '料金プラン' },
            { id: 'faq', label: 'FAQ' },
          ]
    ),
    [isEnglishLanding]
  );

  const siteOrigin = useMemo(() => {
    try {
      return getWindow().location.origin;
    } catch {
      return 'https://jazzify.jp';
    }
  }, []);

  const heroTitleText = isEnglishLanding ? 'Turn practice into an adventure.' : '練習を冒険に。';
  const heroSubtitleText = isEnglishLanding ? 'Transform your playing with an RPG-inspired jazz journey.' : 'ゲーム感覚で、ジャズが弾けるようになる。';
  const primaryCtaLabel = isEnglishLanding ? 'Start your free trial' : '無料トライアルを始める';
  const heroCtaAria = isEnglishLanding ? 'Start your 7-day free trial' : '1週間の無料トライアルを始める';
  const helmetTitle = isEnglishLanding
    ? 'Jazzify | Jazz Learning Game — Learn jazz piano online'
    : 'Jazzify | ジャズピアノ・コードをオンラインで — Jazz Learning Game';
  const helmetDescription = isEnglishLanding
    ? 'Jazz Learning Game — Learn jazz piano through interactive gameplay. Practice jazz piano, chords, and comping online with game-like drills, structured lessons, and MIDI feedback. New users receive a 7-day free trial.'
    : 'Jazz Learning Game（Jazzify）。ジャズピアノ・コード（和声・コード進行）をオンラインで。インタラクティブなゲーム形式で即興とコンピングを楽しく練習できます。初回は7日間の無料トライアル。';
  const helmetOgLocale = isEnglishLanding ? 'en_US' : 'ja_JP';
  const helmetOgLocaleAlternate = isEnglishLanding ? 'ja_JP' : 'en_US';
  const finalHeadingText = isEnglishLanding ? 'Start your free trial' : '今すぐ無料トライアルを始める';
  const finalDescriptionText = isEnglishLanding
    ? 'Registration takes just a few minutes. New users receive a 7-day free trial, then monthly billing applies.'
    : '登録は数分で完了。初回は7日間の無料トライアルのあと月額課金となります。';

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
          <title>{helmetTitle}</title>
          <meta name="description" content={helmetDescription} />
          <link rel="canonical" href={`${siteOrigin}/`} />
          <link rel="alternate" hrefLang="ja" href="https://jazzify.jp/" />
          <link rel="alternate" hrefLang="en" href="https://en.jazzify.jp/" />
          <link rel="alternate" hrefLang="x-default" href="https://jazzify.jp/" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Jazzify" />
          <meta property="og:title" content={helmetTitle} />
          <meta property="og:description" content={helmetDescription} />
          <meta property="og:url" content={`${siteOrigin}/`} />
          <meta property="og:locale" content={helmetOgLocale} />
          <meta property="og:locale:alternate" content={helmetOgLocaleAlternate} />
          <meta property="og:image" content={`${siteOrigin}/first-view-md.webp`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={helmetTitle} />
          <meta name="twitter:description" content={helmetDescription} />
          <meta name="twitter:image" content={`${siteOrigin}/first-view-md.webp`} />
      </Helmet>

      <div className="relative flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef} style={{ background: 'var(--lp-base)' }}>
        {/* Header */}
        <nav className="fixed top-0 left-0 right-0 w-full z-50" style={{ background: 'rgba(7,11,20,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(200,162,77,0.12)' }}>
          <div className="container mx-auto px-6 py-2 md:py-4">
            <div className="flex items-center justify-between">
              <h1 className="lp-display flex items-center gap-3 text-2xl font-bold" style={{ color: 'var(--lp-gold)' }}>
                <img src="/default_avater/default-avater.webp" alt="Jazzify ロゴ" className="w-8 h-8 rounded-full" width={32} height={32} />
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
                  {isEnglishLanding ? 'Sign In / Sign Up' : 'ログイン / 無料トライアル'}
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
                <picture>
                  <source srcSet="/first-view-sm.webp 616w, /first-view-md.webp 768w, /first-view.webp 1080w" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw" type="image/webp" />
                  <img src="/first-view.png" alt={isEnglishLanding ? 'Jazz learning adventure illustration' : 'ジャズの冒険イメージ'} className="w-full h-auto rounded-lg" width={1080} height={1080} fetchPriority="high" style={{ border: '1px solid rgba(200,162,77,0.08)' }} />
                </picture>
              </div>
              <div className="w-full md:w-1/2">
                <div className="text-center md:text-left">
                  <HeroText
                    text={heroTitleText}
                    className="lp-display-hero text-5xl sm:text-6xl md:text-8xl font-black mb-6 section-title"
                    dataAnimate="from-behind heading-underline"
                  />
                  <HeroText
                    text={heroSubtitleText}
                    className="text-lg sm:text-xl md:text-2xl mb-10"
                    dataAnimate="from-behind"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                  <Link
                      to="/signup"
                      aria-label={heroCtaAria}
                    className="lp-btn-gold inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg"
                  >
                      {primaryCtaLabel}
                  </Link>
                  <AppStoreBadge english={isEnglishLanding} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fantasy Demo */}
        <div ref={demoSentinelRef} />
        {shouldRenderFantasyDemo ? (
          <React.Suspense fallback={<div className="py-12 text-center" style={{ color: 'var(--lp-cream-muted)' }}>{isEnglishLanding ? 'Loading demo...' : 'デモを読み込み中...'}</div>}>
            <LPFantasyDemo />
          </React.Suspense>
        ) : (
          <section className="py-10">
            <div className="container mx-auto px-6">
              <div className="rounded-2xl border border-purple-500/20 bg-slate-900/40 p-6 text-center" style={{ color: 'var(--lp-cream-muted)' }}>
                {isEnglishLanding ? 'Demo will load when you scroll here.' : 'この位置までスクロールするとデモを読み込みます。'}
              </div>
            </div>
          </section>
        )}

        {/* ===== English sections ===== */}
        {isEnglishLanding && (
          <>
            <div className="lp-gold-rule my-8" />

            <section id="modes" className="py-24 sm:py-32" data-animate="slide-right text-up">
              <div className="container mx-auto px-6">
                <div className="text-center mb-6">
                  <span className="lp-section-label" data-animate="from-behind">001 — learn</span>
                </div>
                <h2
                  className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-20 section-title"
                  data-animate="from-behind heading-underline"
                >
                  What you&apos;ll learn with Jazzify
                </h2>

                <div className="grid lg:grid-cols-3 gap-10 max-w-5xl mx-auto" data-animate="alt-cards text-up">
                  <div className="feature-card rounded-lg overflow-hidden text-center">
                    <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                      <picture>
                        <source srcSet="/regend_demo.webp" type="image/webp" />
                        <img src="/regend_demo.png" alt="Legend Mode: sheet music and piano roll to recreate iconic solos" className="w-full h-full object-cover" loading="lazy" />
                      </picture>
                    </div>
                    <div className="p-8">
                      <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: '#e8c874' }}>Absorb the sound of jazz into your hands</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>
                        Learn legendary solo phrases by playing them with your whole body.
                      </p>
                    </div>
                  </div>

                  <div className="feature-card rounded-lg overflow-hidden text-center">
                    <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                      <picture>
                        <source srcSet="/fantasy_demo.webp" type="image/webp" />
                        <img src="/fantasy_demo.png" alt="Fantasy Mode: RPG-style battles to master chord progressions" className="w-full h-full object-cover" loading="lazy" />
                      </picture>
                    </div>
                    <div className="p-8">
                      <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: 'var(--lp-gold-light)' }}>Build chord fluency that holds up on the bandstand</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>
                        Master chord progressions through fast-paced, RPG-style battles.
                      </p>
                    </div>
                  </div>

                  <div className="feature-card rounded-lg overflow-hidden text-center">
                    <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                      <picture>
                        <source srcSet="/lessons_demo.webp" type="image/webp" />
                        <img src="/lessons_demo.png" alt="Lesson Mode: structured courses with video lessons" className="w-full h-full object-cover" loading="lazy" />
                      </picture>
                    </div>
                    <div className="p-8">
                      <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: '#7db4d8' }}>Build structured jazz piano knowledge from the ground up</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>
                        Video-backed courses take you from fundamentals to advanced ideas, step by step.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="lp-gold-rule my-8" />
            <section id="pricing" className="py-24 sm:py-32" data-animate="slide-right text-up">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-6">
                  <span className="lp-section-label" data-animate="from-behind">002 — pricing</span>
                </div>
                <h2 className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-16 section-title" data-animate="from-behind heading-underline">
                  Pricing
                </h2>
                <React.Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: 'var(--lp-cream-muted)' }}>Loading…</div>}>
                  <LpEnglishPremiumPricing />
                </React.Suspense>
              </div>
            </section>

            <div className="lp-gold-rule my-8" />
            <section id="faq" className="py-24 sm:py-32" data-animate="slide-left text-up">
              <div className="container mx-auto px-6">
                <div className="text-center mb-6">
                  <span className="lp-section-label" data-animate="from-behind">003 — faq</span>
                </div>
                <h2 className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-20 section-title" data-animate="from-behind heading-underline">
                  FAQ
                </h2>
                <div className="max-w-3xl mx-auto" data-animate="alt-cards text-up">
                  {(Array.from([1, 2, 3, 4, 5, 6]) as number[]).map((id) => (
                    <div key={id} className="faq-item py-6">
                      <button
                        className="w-full flex items-center justify-between cursor-pointer text-left gap-4"
                        onClick={() => toggleFAQ(id)}
                        aria-expanded={openFaqId === id}
                        aria-controls={`faq-content-en-${id}`}
                      >
                        <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--lp-cream)' }}>
                          {id === 1 && 'I have never played an instrument. Is that okay?'}
                          {id === 2 && 'Which instruments are supported?'}
                          {id === 3 && 'Can I use Jazzify offline?'}
                          {id === 4 && 'Tell me about the Premium plan'}
                          {id === 5 && 'Can I cancel or get a refund?'}
                          {id === 6 && 'Can I use a MIDI keyboard on iPhone or iPad?'}
                        </h3>
                        <ChevronIcon open={openFaqId === id} />
                      </button>
                      <div
                        id={`faq-content-en-${id}`}
                        className={`mt-4 ${openFaqId === id ? '' : 'hidden'}`}
                        style={{ color: 'var(--lp-cream-muted)' }}
                      >
                        {id === 1 && 'Yes. Jazzify is built with beginners in mind. Fantasy Mode helps you learn chords in a game-like way, even if you are new to the instrument.'}
                        {id === 2 && 'We support the main jazz instruments, including piano, bass, saxophone, and trumpet. You can practice with a MIDI keyboard or microphone input, depending on your setup.'}
                        {id === 3 && 'No. Jazzify requires an internet connection and is not available offline.'}
                        {id === 4 && 'Paid plans are Premium only. You can upgrade from the Free plan to Premium anytime from your account or checkout flow.'}
                        {id === 5 && 'New users receive a 7-day free trial. If you cancel during the trial, you will not be charged. After the trial, you can cancel before the next renewal as described in the Terms. You keep access for any period you have already paid for. Refunds follow the Terms and what is shown at checkout.'}
                        {id === 6 && (
                          <span>
                            In the Jazzify iOS app, you can connect a MIDI keyboard over USB. See{' '}
                            <Link to="/help/ios-midi" className="underline" style={{ color: '#7db4d8' }}>
                              Using MIDI on iPhone and iPad
                            </Link>
                            {' '}for cables and setup. For other questions, use the{' '}
                            <Link to="/contact" className="underline" style={{ color: '#7db4d8' }}>
                              contact form
                            </Link>
                            .
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

        {/* ===== Japanese sections ===== */}
        {!isEnglishLanding && (
          <>
        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* Jazzifyで身につくこと */}
        <section id="modes" className="py-24 sm:py-32" data-animate="slide-right text-up">
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

            <div className="grid lg:grid-cols-3 gap-10 max-w-5xl mx-auto" data-animate="alt-cards text-up">
              <div className="feature-card rounded-lg overflow-hidden text-center">
                <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                  <picture>
                    <source srcSet="/regend_demo.webp" type="image/webp" />
                    <img src="/regend_demo.png" alt="レジェンドモード：楽譜とピアノロールで名演ソロを再現" className="w-full h-full object-cover" loading="lazy" />
                  </picture>
                </div>
                <div className="p-8">
                  <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: '#e8c874' }}>ジャズの響きを手に覚えこませる</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>巨匠の名演ソロを再現しながら、フレーズを体で覚える</p>
                </div>
              </div>

              <div className="feature-card rounded-lg overflow-hidden text-center">
                <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                  <picture>
                    <source srcSet="/fantasy_demo.webp" type="image/webp" />
                    <img src="/fantasy_demo.png" alt="ファンタジーモード：RPG風バトルでコード進行をマスター" className="w-full h-full object-cover" loading="lazy" />
                  </picture>
                </div>
                <div className="p-8">
                  <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: 'var(--lp-gold-light)' }}>実戦で使えるコード力が身につく</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>RPG風バトルで、コード進行をゲーム感覚でマスター</p>
                </div>
              </div>

              <div className="feature-card rounded-lg overflow-hidden text-center">
                <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                  <picture>
                    <source srcSet="/lessons_demo.webp" type="image/webp" />
                    <img src="/lessons_demo.png" alt="レッスンモード：コースとレッスンで体系的に学習" className="w-full h-full object-cover" loading="lazy" />
                  </picture>
                </div>
                <div className="p-8">
                  <h3 className="lp-display text-2xl font-bold mb-3" style={{ color: '#7db4d8' }}>体系的にジャズピアノの知識が身につく</h3>
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
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">002 — pricing</span>
            </div>
            <h2 className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-16 section-title" data-animate="from-behind heading-underline">
              料金プラン
            </h2>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,19,33,0.6)', border: '1px solid rgba(200,162,77,0.15)' }} data-animate="alt-cards text-up">
              <div className="text-center px-8 pt-10 pb-6" style={{ borderBottom: '1px solid rgba(200,162,77,0.1)' }}>
                <span className="lp-btn-gold inline-block px-4 py-1 rounded-full text-xs font-medium mb-4">Premium</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="lp-display text-4xl sm:text-5xl font-bold" style={{ color: 'var(--lp-cream)' }}>¥4,980</span>
                  <span className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}>/月（税込）</span>
                </div>
                <p className="text-sm mt-3" style={{ color: 'var(--lp-gold)' }}>初回利用者には7日間の無料トライアルが付与されます</p>
              </div>

              <div className="px-8 py-8">
                <p className="text-xs font-medium mb-6 tracking-wider" style={{ color: 'var(--lp-gold-dim)' }}>プレミアムで開放される機能</p>
                <ul className="space-y-5">
                  {(['全レッスンにアクセス', '全サバイバルステージ'] as const).map((text) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
                        <CheckIcon />
                      </span>
                      <span className="text-sm sm:text-base" style={{ color: 'var(--lp-cream)' }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-8 pb-10 text-center">
                <Link
                  to="/signup"
                  className="lp-btn-gold inline-flex items-center justify-center w-full max-w-sm px-8 py-4 rounded-full text-base sm:text-lg"
                >
                  無料トライアルを始める
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* FAQ */}
        <section id="faq" className="py-24 sm:py-32" data-animate="slide-left text-up">
          <div className="container mx-auto px-6">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">003 — faq</span>
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
                      {id === 4 && 'プレミアムプランについて教えてください'}
                      {id === 5 && 'キャンセル・返金は可能ですか？'}
                      {id === 6 && 'iPhone／iPadでMIDIキーボードは使えますか？'}
                    </h3>
                    <ChevronIcon open={openFaqId === id} />
                  </button>
                  <div
                    id={`faq-content-${id}`}
                    className={`mt-4 ${openFaqId === id ? '' : 'hidden'}`}
                    style={{ color: 'var(--lp-cream-muted)' }}
                  >
                    {id === 1 && 'はい、全く問題ありません。Jazzifyは初心者の方を想定して作られており、楽器を触ったことがない方でも楽しく学習できる仕組みになっています。ファンタジーモードでは、ゲーム感覚でコードを覚えることができます。'}
                    {id === 2 && 'ピアノ、ベース、サックス、トランペットなど、主要なジャズ楽器に対応しています。MIDIキーボードやマイク入力にも対応しているため、お持ちの楽器で学習していただけます。'}
                    {id === 3 && 'いいえ、オフラインではご利用いただけません。インターネット接続が必要です。'}
                    {id === 4 && '有料プランはプレミアムプランのみです。フリープランからプレミアムへのアップグレードは、マイページ等の案内に従いいつでもお申し込みいただけます。'}
                    {id === 5 && '初回利用者には7日間の無料トライアルが付与されます。トライアル期間中に解約した場合は料金は発生しません。トライアル終了後は、月額プランは次回更新前までに所定の解約手続きを行うことでキャンセルできます。キャンセル後も、既に支払済みの期間の満了まではご利用いただけます。返金については利用規約および決済画面の表示に従います。'}
                    {id === 6 && (
                      <span>
                        Jazzify の iOS アプリでは、USB 経由で MIDI キーボードを接続してご利用いただけます。ケーブルや接続手順の詳細は{' '}
                        <Link to="/help/ios-midi" className="underline" style={{ color: '#7db4d8' }}>
                          iPhone/iPad での MIDI 機器利用について
                        </Link>
                        をご覧ください。ご不明点は{' '}
                        <Link to="/contact" className="underline" style={{ color: '#7db4d8' }}>
                          お問い合わせフォーム
                        </Link>
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

        {/* iOS App */}
        <section className="py-24 sm:py-32" data-animate="slide-right text-up">
          <div className="container mx-auto px-6">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">004 — app</span>
            </div>
            <h2
              className="lp-display text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-16 section-title"
              data-animate="from-behind heading-underline"
            >
              {isEnglishLanding ? 'Jazzify for iOS' : 'iOSアプリ版'}
            </h2>
            <div className="max-w-2xl mx-auto text-center" data-animate="alt-cards text-up">
              <div className="rounded-2xl p-8 sm:p-12" style={{ background: 'rgba(13,19,33,0.6)', border: '1px solid rgba(200,162,77,0.15)' }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(200,162,77,0.15)' }}>
                  <img src="/default_avater/default-avater.webp" alt={isEnglishLanding ? 'Jazzify app icon' : 'Jazzify アプリアイコン'} className="w-full h-full object-cover" width={80} height={80} loading="lazy" />
                </div>
                <h3 className="lp-display text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--lp-cream)' }}>Jazzify</h3>
                <p className="text-sm sm:text-base leading-relaxed mb-2" style={{ color: 'var(--lp-cream-muted)' }}>
                  {isEnglishLanding
                    ? 'On iPhone and iPad, connect a MIDI keyboard and learn jazz with the same experience as on the web.'
                    : 'iPhone・iPadでも、MIDIキーボードを接続してジャズを学べます。'}
                </p>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--lp-cream-muted)' }}>
                  {isEnglishLanding ? 'Download free from the App Store.' : 'App Store から無料でダウンロードできます。'}
                </p>
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-opacity hover:opacity-80"
                  style={{ background: 'var(--lp-cream)', color: '#000' }}
                  aria-label={isEnglishLanding ? 'Download Jazzify on the App Store' : 'App StoreでJazzifyをダウンロード'}
                >
                  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-none">Download on the</div>
                    <div className="text-lg font-semibold leading-tight">App Store</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section divider */}
        <div className="lp-gold-rule my-8" />

        {/* Developer's Voice */}
        <section className="py-28 sm:py-40 relative overflow-hidden" data-animate="slide-left text-up">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 60% at 25% 40%, rgba(59,107,156,0.06), transparent)' }} />
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-6">
              <span className="lp-section-label" data-animate="from-behind">005 — voice</span>
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
                  <picture>
                    <source srcSet="/profile.webp" type="image/webp" />
                    <img
                      src="/profile.jpg"
                      alt={isEnglishLanding ? 'Developer playing piano at a jazz club' : '開発者 ジャズクラブでの演奏風景'}
                      className="w-full h-full object-cover"
                      width={480} height={576}
                      loading="lazy"
                    />
                  </picture>
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
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                aria-label={heroCtaAria}
                className="lp-btn-gold px-8 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg"
              >
                {primaryCtaLabel}
              </Link>
              <AppStoreBadge english={isEnglishLanding} />
            </div>
          </div>
        </section>

        {/* English Footer */}
        {isEnglishLanding && (
          <footer className="py-16" style={{ background: 'var(--lp-base)', borderTop: '1px solid rgba(200,162,77,0.1)' }}>
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="col-span-1">
                  <h3 className="lp-display text-2xl font-bold mb-4" style={{ color: 'var(--lp-gold)' }}>
                    <MusicNoteIcon />Jazzify
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-cream-muted)' }}>
                    Learn jazz through game-like drills and structured lessons. From first notes to advanced playing, built for daily practice.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-4" style={{ color: 'var(--lp-cream)' }}>Service</h4>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
                    {navLinks.map(l => (
                      <li key={l.id}>
                        <a href={`#${l.id}`} className="transition-colors duration-200 hover:opacity-80" onClick={(e) => handleAnchorClick(e, l.id)}>
                          {l.label}
                        </a>
                      </li>
                    ))}
                    <li><Link to="/signup" className="transition-colors duration-200 hover:opacity-80">Sign up</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4" style={{ color: 'var(--lp-cream)' }}>Support</h4>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
                    <li><a href="#faq" className="transition-colors duration-200 hover:opacity-80" onClick={(e) => handleAnchorClick(e, 'faq')}>FAQ</a></li>
                    <li><Link to="/help/ios-midi" className="transition-colors duration-200 hover:opacity-80">MIDI on iPhone / iPad</Link></li>
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
                    <MusicNoteIcon />Jazzify
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
                    <li><Link to="/signup" className="transition-colors duration-200 hover:opacity-80">新規登録</Link></li>
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
