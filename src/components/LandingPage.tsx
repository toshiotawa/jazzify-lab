import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { gsap } from 'gsap';

const LandingPage: React.FC = () => {
  const { user, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // 認証済み/ゲストはメインへ
  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate('/main#dashboard', { replace: true });
    }
  }, [user, isGuest, loading, navigate]);

  // GSAP 簡易アニメーション（初回ロード時のフェードイン/スライド）
  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.lp-fade',
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.lp-stagger .lp-card',
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power2.out', delay: 0.15 }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const handleGuest = () => {
    useAuthStore.getState().enterGuestMode();
    // Main への遷移は AuthGate 側でハンドルされる
  };

  return (
    <div ref={rootRef} className="h-screen w-full overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <Helmet>
        <title>Jazzify - ジャズをゲームで学ぶ</title>
        <meta name="description" content="MIDIキーボードやマイクのピッチ認識に対応。音ゲー/ファンタジー/RPG/レッスン/コミュニティを備えた新感覚ジャズ学習プラットフォーム。" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-black/30 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/default_avater/default-avater.png" alt="主人公" className="w-8 h-8 rounded-full ring-2 ring-primary-600" />
            <span className="font-bold tracking-wide">Jazzify</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/login" className="btn btn-secondary">ログイン / 会員登録</Link>
            <button onClick={handleGuest} className="btn btn-primary">おためしプレイ</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-fade">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src="/stage_icons/7.png" alt="icon" className="w-10 h-10" />
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">ゲームで学ぶ、<br className="hidden md:block" />あなたのジャズ</h1>
            </div>
            <p className="text-white/80 max-w-prose">
              MIDIキーボードやマイクのピッチ認識にも対応。<br className="hidden md:block" />
              楽しみながらジャズのソロ、コード、理論を体得しよう。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="btn btn-primary">今すぐ始める</Link>
              <button onClick={handleGuest} className="btn btn-secondary">おためしプレイ</button>
            </div>
            <div className="text-xs text-white/60">メールなしですぐ体験可能</div>
          </div>
          <div>
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden ring-1 ring-white/10 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-white/70">First View Image Placeholder</span>
              {/* 画像差し替え予定 */}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-stagger border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-6">
          <article className="lp-card bg-white/5 rounded-xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-3 mb-3">
              <img src="/stage_icons/1.png" alt="icon" className="w-8 h-8" />
              <h3 className="text-xl font-bold">MIDIキーボード・マイク入力に対応</h3>
            </div>
            <p className="text-white/80">演奏した音程をリアルタイムに認識。スコアに合わせて正確さを可視化します。</p>
          </article>

          <article className="lp-card bg-white/5 rounded-xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-3 mb-3">
              <img src="/stage_icons/2.png" alt="icon" className="w-8 h-8" />
              <h3 className="text-xl font-bold">音ゲーモード</h3>
            </div>
            <p className="text-white/80">ジャズの巨匠のソロをプレイできるリズムゲーム。(GIF後で用意)</p>
          </article>

          <article className="lp-card bg-white/5 rounded-xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-3 mb-3">
              <img src="/stage_icons/3.png" alt="icon" className="w-8 h-8" />
              <h3 className="text-xl font-bold">ファンタジーモード</h3>
            </div>
            <p className="text-white/80">RPG風にコード進行を攻略。ダンジョンを進めて理論を身につけよう。(GIF後で用意)</p>
          </article>

          <article className="lp-card bg-white/5 rounded-xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-3 mb-3">
              <img src="/stage_icons/4.png" alt="icon" className="w-8 h-8" />
              <h3 className="text-xl font-bold">レッスンモード</h3>
            </div>
            <p className="text-white/80">動画付きのレッスンとステージ制カリキュラムで、着実に実力アップ。</p>
          </article>

          <article className="md:col-span-2 lp-card bg-white/5 rounded-xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-3 mb-3">
              <img src="/stage_icons/5.png" alt="icon" className="w-8 h-8" />
              <h3 className="text-xl font-bold">コミュニティ</h3>
            </div>
            <p className="text-white/80">経験値によるレベルランキング、練習日記、コメント機能で仲間が見つかる。(画像後で用意)</p>
          </article>
        </div>
      </section>

      {/* RPG風の見出し（PRG風）*/}
      <section className="lp-fade border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center gap-3 mb-6">
            <img src="/stage_icons/9.png" alt="icon" className="w-8 h-8" />
            <h2 className="text-2xl font-extrabold tracking-wide">冒険の準備はいいか？</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-5 ring-1 ring-white/10">
              <div className="text-sm text-white/70 mb-1">STEP 1</div>
              <div className="font-bold mb-2">クラスを選ぶ</div>
              <div className="text-white/70 text-sm">ピアノ/ギター/ボーカルから選択</div>
            </div>
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-5 ring-1 ring-white/10">
              <div className="text-sm text-white/70 mb-1">STEP 2</div>
              <div className="font-bold mb-2">クエストに挑む</div>
              <div className="text-white/70 text-sm">音ゲー/ファンタジー/レッスンで実力アップ</div>
            </div>
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-5 ring-1 ring-white/10">
              <div className="text-sm text-white/70 mb-1">STEP 3</div>
              <div className="font-bold mb-2">レア報酬を手に入れる</div>
              <div className="text-white/70 text-sm">称号/レベル/ランキングで成長を実感</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="lp-fade border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-6">
            <img src="/stage_icons/8.png" alt="icon" className="w-8 h-8" />
            <h2 className="text-2xl font-extrabold">プラン</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-6 ring-1 ring-white/10 flex flex-col">
              <div className="font-bold mb-2">フリー</div>
              <div className="text-3xl font-extrabold mb-4">¥0</div>
              <ul className="text-sm text-white/80 space-y-2 mb-6">
                <li>おためしプレイ</li>
                <li>一部レッスン</li>
              </ul>
              <button onClick={handleGuest} className="btn btn-secondary mt-auto">体験する</button>
            </div>
            <div className="bg-white/5 rounded-xl p-6 ring-1 ring-primary-500 flex flex-col">
              <div className="font-bold mb-2">スタンダード</div>
              <div className="text-3xl font-extrabold mb-4">¥980</div>
              <ul className="text-sm text-white/80 space-y-2 mb-6">
                <li>音ゲーモード</li>
                <li>基本レッスン</li>
              </ul>
              <Link to="/signup" className="btn btn-primary mt-auto">はじめる</Link>
            </div>
            <div className="bg-white/5 rounded-xl p-6 ring-1 ring-white/10 flex flex-col">
              <div className="font-bold mb-2">プレミアム</div>
              <div className="text-3xl font-extrabold mb-4">¥1,980</div>
              <ul className="text-sm text-white/80 space-y-2 mb-6">
                <li>発展レッスン</li>
                <li>コミュニティ機能</li>
              </ul>
              <Link to="/signup" className="btn btn-primary mt-auto">はじめる</Link>
            </div>
            <div className="bg-white/5 rounded-xl p-6 ring-1 ring-white/10 flex flex-col">
              <div className="font-bold mb-2">プラチナ</div>
              <div className="text-3xl font-extrabold mb-4">お問い合わせ</div>
              <ul className="text-sm text-white/80 space-y-2 mb-6">
                <li>コーチング/法人</li>
                <li>優先サポート</li>
              </ul>
              <Link to="/signup" className="btn btn-primary mt-auto">相談する</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/stage_icons/6.png" alt="icon" className="w-8 h-8" />
            <div className="text-white/70 text-sm">© {new Date().getFullYear()} Jazzify</div>
          </div>
          <nav className="flex gap-6 text-sm text-white/80">
            <Link to="/legal/tokushoho" className="hover:text-white">特商法表記</Link>
            <Link to="/legal/privacy" className="hover:text-white">プライバシーポリシー</Link>
            <Link to="/legal/terms" className="hover:text-white">利用規約</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
