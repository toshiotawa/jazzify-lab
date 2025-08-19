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
						<h3 className="text-xl font-semibold">ストリークボーナス（チャレンジ）</h3>
						<p className="text-sm text-gray-300">対象: チャレンジギルドのメンバーのみ。各メンバーの当月の連続達成状況に応じてボーナスが発生し、ギルド全体のボーナスに合算されます。</p>
						<p className="text-sm text-gray-300">ストリークレベル: 5日連続達成ごとに1レベルアップ（Lv.0開始）。最大Lv.6（30日）まで。</p>
						<p className="text-sm text-gray-300">各レベルのボーナス: Lv.1:+5% / Lv.2:+10% / Lv.3:+15% / Lv.4:+20% / Lv.5:+25% / Lv.6:+30%（1人あたり上限+30%）。</p>
						<p className="text-sm text-gray-300">達成条件: その日の獲得XPが1以上でその日を「達成」とカウント（UTC日付基準）。</p>
						<p className="text-sm text-gray-300">失敗時のペナルティ: 連続の途中で1日でも未達成があると、その時点でストリークは途切れ、レベル0から再開します。月初にも当月分として自動リセットされ、前月分の連続は持ち越されません。</p>
						<p className="text-sm text-gray-300">ギルドへの反映: ギルドボーナスには全メンバーのストリークボーナスが合算されます（例: 5人がそれぞれ+30%なら合計+150%）。</p>
					</section>

					<section className="space-y-2">
						<h3 className="text-xl font-semibold">クエストについて</h3>
						<p className="text-sm text-gray-300">チャレンジギルドは毎月1,000,000XPを獲得しないと解散します。</p>
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