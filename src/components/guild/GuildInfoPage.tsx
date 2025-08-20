import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';

const GuildInfoPage: React.FC = () => {
        const [open, setOpen] = useState(window.location.hash === '#guilds-info');

        useEffect(() => {
                const handler = () => setOpen(window.location.hash === '#guilds-info');
                window.addEventListener('hashchange', handler);
                return () => window.removeEventListener('hashchange', handler);
        }, []);

        if (!open) return null;

        return (
                <div className="w-full h-full flex flex-col bg-gradient-game text-white">
                        <GameHeader />
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <div className="max-w-3xl mx-auto space-y-6">
                                        <h2 className="text-2xl font-bold">ギルド詳細</h2>

                                        <section className="space-y-2">
                                                <h3 className="text-xl font-semibold">ギルドタイプについて</h3>
                                                <p className="text-sm text-gray-300">カジュアルギルドは気軽に参加でき、チャレンジギルドは月末までに指定XP達成が必要です。</p>
                                        </section>

                                        <section className="space-y-2">
                                                <h3 className="text-xl font-semibold">ボーナスについて</h3>
                                                <p className="text-sm text-gray-300">レベルボーナス: ギルドレベル1ごとに+0.1%のXPボーナスが付与されます。</p>
                                                <p className="text-sm text-gray-300">メンバーボーナス: 当月XPを1以上獲得したメンバー1人につき+10%(最大+50%)。</p>
                                                <p className="text-sm text-gray-300">ストリークボーナス: チャレンジギルドのみ、連続達成日数に応じた追加ボーナスが加算されます。</p>
                                        </section>

                                        <section className="space-y-2">
                                                <h3 className="text-xl font-semibold">ストリークシステム（チャレンジギルドのみ）</h3>
                                                <div className="space-y-3 bg-slate-800 rounded-lg p-4">
                                                        <div>
                                                                <h4 className="font-medium text-lg mb-1">ストリークレベル</h4>
                                                                <p className="text-sm text-gray-300">5日連続達成ごとに1レベル上昇。1レベルごとに5％のボーナスが追加されます（最大レベル6）。</p>
                                                        </div>
                                                        <div>
                                                                <h4 className="font-medium text-lg mb-1">ストリーク条件</h4>
                                                                <p className="text-sm text-gray-300">その日に1以上のXPを獲得することでストリークが継続されます。</p>
                                                        </div>
                                                        <div>
                                                                <h4 className="font-medium text-lg mb-1">ストリーク失敗</h4>
                                                                <p className="text-sm text-gray-300">条件未達成の場合、ストリークレベルが1下がります。</p>
                                                        </div>
                                                        <div>
                                                                <h4 className="font-medium text-lg mb-1">メンバー独立性</h4>
                                                                <p className="text-sm text-gray-300">各メンバーのストリークは独立して管理されます。メンバー5人全員がレベル6の場合、合計で150％のストリークボーナスを獲得できます。</p>
                                                        </div>
                                                        <div>
                                                                <h4 className="font-medium text-lg mb-1">月跨ぎ対応</h4>
                                                                <p className="text-sm text-gray-300">ストリークは月をまたいでもリセットされません。継続的な努力が報われます。</p>
                                                        </div>
                                                </div>
                                        </section>

                                        <section className="space-y-2">
                                                <h3 className="text-xl font-semibold">クエストについて</h3>
                                                <p className="text-sm text-gray-300">チャレンジギルドは直前の1時間で1,000XP未満の場合、解散します（検証用の一時設定）。</p>
                                        </section>

                                        <section className="space-y-2">
                                                <h3 className="text-xl font-semibold">ランキングについて</h3>
                                                <p className="text-sm text-gray-300">ギルドの月間XPに基づいてランキングが決まり、上位を目指して競い合います。</p>
                                        </section>

                                        <section className="space-y-2">
                                                <h3 className="text-xl font-semibold">MVPについて</h3>
                                                <p className="text-sm text-gray-300">月間で最もXPを獲得したメンバーがMVPとして表彰されます。</p>
                                        </section>
                                </div>
                        </div>
                </div>
        );
};

export default GuildInfoPage;

