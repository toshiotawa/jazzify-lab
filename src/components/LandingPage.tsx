import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Music,
  Gamepad2,
  Swords,
  GraduationCap,
  Users,
  Zap,
  Mic,
  Star,
  Keyboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// ---- 小さなUI部品 ----
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium shadow-sm">
      <Star className="h-3 w-3" aria-hidden /> {children}
    </span>
  );
}

function FeatureRow({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 rounded-lg border border-white/10 bg-white/5 p-2 shadow-sm">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <h4 className="font-semibold leading-none">{title}</h4>
        <p className="mt-1 text-sm text-gray-300">{desc}</p>
      </div>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-md">
      {children}
    </div>
  );
}

export default function LandingPage() {
  // 認証状態とナビゲーション用のフックを取得
  const { user, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();

  const [yearly, setYearly] = useState(true);
  const priceOf = (m: number) => (yearly ? Math.round(m * 12 * 0.8) : m); // 年間20%OFF

  const plans = useMemo(
    () => [
      {
        name: 'フリー',
        priceMonthly: 0,
        highlight: false,
        features: [
          'MIDI/マイク入力の体験版',
          '音ゲーモードの一部楽曲',
          'ファンタジーモード 入門クエスト',
          'レッスン：ブルース入門の一部',
          'コミュニティ閲覧',
        ],
        cta: '無料で始める',
      },
      {
        name: 'スタンダード',
        priceMonthly: 980,
        highlight: true,
        features: [
          'MIDI/マイク 常時接続',
          '音ゲーモード 全入門曲',
          'ファンタジーモード 初級〜中級',
          'レッスン：基礎カリキュラム',
          'コミュニティ投稿・コメント',
        ],
        cta: 'クエスト開始',
      },
      {
        name: 'プレミアム',
        priceMonthly: 1980,
        highlight: false,
        features: [
          '巨匠ソロライブラリ 追加',
          '練習履歴＆成長ログ',
          '譜面/PDFダウンロード',
          'モード切替の拡張',
          '限定イベント参加',
        ],
        cta: 'プレミアムで鍛える',
      },
      {
        name: 'プラチナ',
        priceMonthly: 4980,
        highlight: false,
        features: [
          '全コンテンツ無制限',
          '新機能 先行アクセス',
          '優先サポート',
          '限定ワークショップ',
          'ステータス称号 獲得',
        ],
        cta: '最強の修行へ',
      },
    ],
    [yearly]
  );

  // 認証状態を監視し、変化があれば実行
  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate('/main#dashboard', { replace: true });
    }
  }, [user, isGuest, loading, navigate]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white">
      <Helmet>
        <title>Jazzify</title>
        <meta name="description" content="Jazzify - Learn jazz through game-like quests" />
      </Helmet>

      {/* ナビ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 shadow-sm">
              <Music className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="font-bold">Jazzify</div>
              <div className="text-[10px] text-gray-400">Jazz × Practice RPG</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <button onClick={() => scrollToId('features')} className="hover:underline">特長</button>
            <button onClick={() => scrollToId('modes')} className="hover:underline">モード</button>
            <button onClick={() => scrollToId('pricing')} className="hover:underline">料金</button>
            <button onClick={() => scrollToId('faq')} className="hover:underline">FAQ</button>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm text-gray-300 hover:underline md:inline">ログイン</Link>
            <button onClick={() => scrollToId('cta')} className="btn btn-primary">無料で試す</button>
          </div>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Tag>RPG風レベルアップ</Tag>
              <Tag>音ゲーで巨匠ソロ</Tag>
              <Tag>MIDI/マイク対応</Tag>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              練習を冒険に。<br />
              ジャズをもっと“ゲーム的”に上達。
            </h1>
            <p className="mt-4 text-base text-gray-300 md:text-lg">
              Jazzifyは、MIDIキーボードやマイク入力に対応した“RPG風”練習アプリ。音ゲーモード、ファンタジーモード、動画付きレッスン、コミュニティまで、あなたの修行をクエスト化します。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button className="btn btn-primary btn-lg" onClick={() => scrollToId('cta')}>クエストを開始</button>
              <button className="btn btn-outline btn-lg" onClick={() => scrollToId('modes')}>デモを見る</button>
            </div>
            <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2">
              <li className="flex items-center gap-2"><Check className="h-4 w-4"/>MIDIキーボード接続</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4"/>マイク入力のピッチ認識</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4"/>音ゲーモードで巨匠ソロ</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4"/>RPG風のコード学習</li>
            </ul>
          </div>

          <div>
            {/* 主人公アイコンをヒーローに効果的に表示 */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
                <img
                  src="/default_avater/default-avater.png"
                  alt="主人公アイコン"
                  className="mx-auto aspect-square w-full max-w-xs rounded-2xl object-cover"
                />
                <div className="mt-4 grid grid-cols-6 gap-2 opacity-90">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <img key={n} src={`/stage_icons/${n}.png`} alt={`ステージ${n}`}
                         className="h-10 w-10 rounded-md border border-white/10 bg-black/30 object-cover" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特長 */}
      <section id="features" className="border-t border-white/10 bg-white/5">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-14 md:grid-cols-3">
          <FeatureRow icon={Keyboard} title="MIDIキーボード接続" desc="遅延の少ない演奏入力で、運指やタイミングを可視化。USB/MIDIに対応。" />
          <FeatureRow icon={Mic} title="マイクのピッチ認識" desc="歌や管楽器でもOK。音程トラッキングで耳と音感を鍛える。" />
          <FeatureRow icon={Zap} title="プレイ × 学習の融合" desc="音ゲー／RPG／動画レッスンを横断し、短時間でも“経験値”が貯まる設計。" />
        </div>
      </section>

      {/* モード紹介 */}
      <section id="modes">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center gap-3">
            <img src="/stage_icons/1.png" alt="stage" className="h-6 w-6 rounded" />
            <Gamepad2 className="h-5 w-5" />
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">3つの冒険モード</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SectionCard>
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <img src="/stage_icons/2.png" alt="音ゲー" className="h-6 w-6 rounded" />
                <Gamepad2 className="h-4 w-4"/>
                <span>音ゲーモード</span>
              </div>
              <div className="space-y-4">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                  <div className="grid h-full place-items-center text-xs text-gray-300">巨匠ソロをプレイするGIF（差し替え予定）</div>
                </div>
                <p className="text-sm text-gray-300">モダンからビバップまで、ジャズの巨匠のソロを“譜面×ゲームUI”で再現。正確さとスイング感でスコア化。</p>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <img src="/stage_icons/3.png" alt="ファンタジー" className="h-6 w-6 rounded" />
                <Swords className="h-4 w-4"/>
                <span>ファンタジーモード</span>
              </div>
              <div className="space-y-4">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                  <div className="grid h-full place-items-center text-xs text-gray-300">RPG風フィールドでコード学習GIF（差し替え予定）</div>
                </div>
                <p className="text-sm text-gray-300">コード進行が出現するフィールドを攻略。ディグリーやテンションを“クエスト”として覚える。</p>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <img src="/stage_icons/4.png" alt="レッスン" className="h-6 w-6 rounded" />
                <GraduationCap className="h-4 w-4"/>
                <span>レッスンモード</span>
              </div>
              <div className="space-y-4">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                  <div className="grid h-full place-items-center text-xs text-gray-300">動画付きレッスンのUI GIF（差し替え予定）</div>
                </div>
                <p className="text-sm text-gray-300">動画＋課題で段階的に上達。まずは「ブルース初級」から。ステージをクリアして次の章へ。</p>
              </div>
            </SectionCard>
          </div>

          {/* コミュニティ */}
          <div className="mt-12 grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <img src="/stage_icons/5.png" alt="コミュニティ" className="h-6 w-6 rounded" />
                <Users className="h-5 w-5" />
                <h3 className="text-xl font-semibold">コミュニティ & ランキング</h3>
              </div>
              <p className="text-gray-300">
                経験値システムでモチベーションを可視化。練習日記にいいね＆コメント、レベルランキングで仲間と切磋琢磨。
              </p>
            </div>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
              <div className="grid h-full place-items-center text-xs text-gray-300">コミュニティ画面のサンプル画像（差し替え予定）</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="border-y border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">さあ、練習を冒険にしよう</h3>
            <p className="mt-2 text-gray-300">先行登録して、ベータ配信や新機能の案内を受け取ろう。</p>
            <form
              className="mt-6 flex flex-col items-center gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                alert('仮：メールを送信しました！');
              }}
            >
              <input type="email" required placeholder="メールアドレス" className="h-11 w-full rounded-md border border-white/20 bg-black/30 px-3 text-white placeholder:text-gray-400 focus:border-blue-400 focus:outline-none sm:w-80" />
              <button type="submit" className="btn btn-primary h-11 w-full sm:w-auto">先行登録する</button>
            </form>
            <div className="mt-4 text-sm text-gray-400">
              すでにアカウントをお持ちですか？ <Link to="/login" className="underline">ログイン</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">料金プラン</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className={!yearly ? 'font-semibold' : 'text-gray-400'}>月額</span>
              <button
                onClick={() => setYearly((v) => !v)}
                aria-label="年額切替"
                className="inline-flex items-center rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs hover:bg-white/10"
              >
                トグル
              </button>
              <span className={yearly ? 'font-semibold' : 'text-gray-400'}>
                年額 <span className="rounded bg-yellow-100/20 px-1 py-0.5 text-[10px] text-yellow-200">-20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-xl border ${p.highlight ? 'border-blue-400/60' : 'border-white/10'} bg-white/5 p-5 shadow-md`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-lg font-semibold">{p.name}</div>
                  {p.highlight && (
                    <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-xs font-medium text-blue-300">おすすめ</span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="text-3xl font-extrabold">
                    {yearly ? (
                      <>
                        ¥{priceOf(p.priceMonthly).toLocaleString()}<span className="text-sm font-normal text-gray-300">/年</span>
                      </>
                    ) : (
                      <>
                        ¥{p.priceMonthly.toLocaleString()}<span className="text-sm font-normal text-gray-300">/月</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-[2px] h-4 w-4" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5">
                  <button className={`btn w-full ${p.highlight ? 'btn-primary' : 'btn-outline'}`}>{p.cta}</button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-400">表示価格は税込の想定価格です。実際の提供開始時に変更になる場合があります。</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">よくある質問</h2>

          {/* シンプルなdetailsでアコーディオン */}
          <div className="space-y-3">
            {[
              { q: '対応しているMIDIキーボードは？', a: '一般的なUSB-MIDIクラスコンプライアント機器を想定しています。Bluetooth-MIDIは今後の対応を検討中です。' },
              { q: 'マイク入力で遅延はありますか？', a: '端末やオーディオ設定に依存しますが、アプリ側で最適化を行い実用的なレイテンシを目指しています。' },
              { q: 'どんなジャンルに対応していますか？', a: 'ジャズを中心に、ブルース入門からモダンジャズまで段階的に学べます。今後の拡張でジャンルを追加予定です。' },
              { q: 'オフラインでも使えますか？', a: '一部機能はオフラインでも利用可能にする計画です。進捗同期やコミュニティ機能にはオンライン接続が必要です。' },
              { q: '商用リリースはいつですか？', a: '現在クローズドベータ準備中です。先行登録いただいた方から順次ご案内します。' },
              { q: '解約はいつでもできますか？', a: 'はい。サブスクリプションはいつでもキャンセル可能で、次回請求日以降の課金は発生しません。' },
            ].map((item) => (
              <details key={item.q} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <summary className="cursor-pointer select-none font-medium">
                  {item.q}
                </summary>
                <div className="pt-2 text-sm text-gray-300">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-sm text-gray-400">© {new Date().getFullYear()} Jazzify</div>
            <nav className="flex flex-wrap items-center gap-6 text-sm">
              <a href="#" className="hover:underline">特定商取引法に基づく表記</a>
              <a href="#" className="hover:underline">プライバシーポリシー</a>
              <a href="#" className="hover:underline">利用規約</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
