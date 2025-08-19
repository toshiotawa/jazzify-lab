import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
	getMyGuild,
        getGuildMembers,
        createGuild,
	fetchMyGuildRank,
	fetchGuildMemberMonthlyXp,
	fetchJoinRequestsForMyGuild,
	approveJoinRequest,
	rejectJoinRequest,
	Guild,
	GuildMember,
	GuildJoinRequest,
        fetchMyGuildContributionTotal,
        updateGuildDescription,
        disbandMyGuild,
        leaveMyGuild,
        kickMember,
        fetchGuildDailyStreaks,
        fetchPendingInvitationsForMe,
        acceptInvitation,
        rejectInvitation,
        GuildInvitation,
} from '@/platform/supabaseGuilds';
import GuildBoard from '@/components/guild/GuildBoard';
import GameHeader from '@/components/ui/GameHeader';
import { calcLevel } from '@/platform/supabaseXp';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { computeGuildBonus } from '@/utils/guildBonus';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaTrophy, FaGraduationCap, FaHatWizard, FaCheckCircle } from 'react-icons/fa';

const GuildIntro: React.FC = () => (
        <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <h3 className="font-semibold mb-2">ギルドシステム</h3>
                <p className="text-sm text-gray-300 mb-2">仲間と協力して経験値を稼ぎ、ボーナスやクエスト、ランキングで競い合える機能です。</p>
                <button
                        className="text-blue-400 underline text-sm"
                        onClick={() => { window.location.hash = '#guilds-info'; }}
                >
                        詳細はこちら
                </button>
        </div>
);

const GuildDashboard: React.FC = () => {
	const { user } = useAuthStore();
	const [loading, setLoading] = useState(true);
	const [myGuild, setMyGuild] = useState<Guild | null>(null);
	const [members, setMembers] = useState<GuildMember[]>([]);
        const [guildName, setGuildName] = useState('');
        const [busy, setBusy] = useState(false);
	const [myRank, setMyRank] = useState<number | null>(null);
	const [thisMonthXp, setThisMonthXp] = useState<number>(0);
	const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);
	const [joinRequests, setJoinRequests] = useState<GuildJoinRequest[]>([]);
	const [myTotalContribXp, setMyTotalContribXp] = useState<number>(0);
	const [descEdit, setDescEdit] = useState<string>('');
	const [editingDesc, setEditingDesc] = useState<boolean>(false);
	const [isLeader, setIsLeader] = useState<boolean>(false);
	const [streaks, setStreaks] = useState<Record<string, { daysCurrentStreak: number; tierPercent: number; tierMaxDays: number; display: string }>>({});
	const [newGuildType, setNewGuildType] = useState<'casual'|'challenge'>('casual');
	const [lastGuildInfo, setLastGuildInfo] = useState<{ id: string; name: string } | null>(null);
        const [lastGuildEvent, setLastGuildEvent] = useState<'left'|'kicked'|'disband'|null>(null);
        const [leaveReason, setLeaveReason] = useState<string>('');
        const [reasonSubmitting, setReasonSubmitting] = useState<boolean>(false);
        const [pendingInvitations, setPendingInvitations] = useState<GuildInvitation[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			if (!user) return;
			try {
				setLoading(true);
				// まず自分のギルド情報のみ取得
				const guild = await getMyGuild();
				setMyGuild(guild);
				// 現在所属のスナップショットを保存／未所属時は直前情報を復元
				try {
					if (guild) {
						localStorage.setItem('lastGuildCurrent', JSON.stringify({ id: guild.id, name: guild.name }));
						// 直前の表示はクリア
						setLastGuildInfo(null);
						setLastGuildEvent(null);
					} else {
						const raw = localStorage.getItem('lastGuildInfo') || localStorage.getItem('lastGuildCurrent');
						const evt = (localStorage.getItem('lastGuildEvent') as 'left'|'kicked'|'disband'|null) || null;
						if (raw) {
							const parsed = JSON.parse(raw) as { id: string; name: string };
							setLastGuildInfo(parsed);
							if (evt) {
								setLastGuildEvent(evt);
							} else {
								try {
									const { getGuildById } = await import('@/platform/supabaseGuilds');
									const g2 = await getGuildById(parsed.id);
									setLastGuildEvent(g2?.disbanded ? 'disband' : 'kicked');
								} catch {}
							}
						}
					}
				} catch {}
				// ランクと参加リクエストはユーザーコンテキストから
                                const [rank, joinReqs, invitations] = await Promise.all([
                                        fetchMyGuildRank(),
                                        fetchJoinRequestsForMyGuild(),
                                        fetchPendingInvitationsForMe(),
                                ]);
                                setMyRank(rank);
                                setJoinRequests(joinReqs);
                                setPendingInvitations(invitations);
				if (guild) {
					// ギルドIDに依存する取得
					const [m, perMember, totalContrib, st] = await Promise.all([
						getGuildMembers(guild.id),
						fetchGuildMemberMonthlyXp(guild.id),
						fetchMyGuildContributionTotal(guild.id),
						(guild.guild_type === 'challenge' ? fetchGuildDailyStreaks(guild.id) : Promise.resolve({} as Record<string, any>)).catch(()=>({} as Record<string, any>)),
					]);
					setMembers(m);
					setMemberMonthly(perMember);
					setMyTotalContribXp(totalContrib);
					setThisMonthXp(perMember.reduce((a, b) => a + Number(b.monthly_xp || 0), 0));
					setIsLeader(m.some(x => x.user_id === user.id && x.role === 'leader'));
					setStreaks(st);
				}
			} catch (e: any) {
				alert(e?.message || 'ギルド情報の取得に失敗しました');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [user]);

	// 月次クエストの強制（クライアント側フォールバック。1ヶ月1回のみ）
	useEffect(() => {
		(async () => {
			try {
				const monthKey = new Date().toISOString().slice(0,7);
				if (!localStorage.getItem(`quest_enforced_${monthKey}`)) {
					const { enforceMonthlyGuildQuest } = await import('@/platform/supabaseGuilds');
					await enforceMonthlyGuildQuest().catch(()=>{});
					localStorage.setItem(`quest_enforced_${monthKey}`, '1');
				}
			} catch {}
		})();
	}, []);

        const handleCreateGuild = async () => {
                if (!user || !guildName.trim()) return;
                try {
                        setBusy(true);
                        const gId = await createGuild(guildName.trim(), newGuildType);
                        if (gId) {
                                alert('ギルドが作成されました！');
                                // 再読み込み
                                window.location.hash = '#guild-dashboard';
                                window.location.reload();
                        }
                } catch (e: any) {
                        alert(e?.message || 'ギルド作成に失敗しました');
                } finally {
                        setBusy(false);
                }
        };

	const handleLeaveGuild = async () => {
		if (!myGuild || !user) return;
		try {
			setBusy(true);
			try {
				localStorage.setItem('lastGuildInfo', JSON.stringify({ id: myGuild.id, name: myGuild.name }));
				localStorage.setItem('lastGuildEvent', 'left');
			} catch {}
			await leaveMyGuild();
			alert('ギルドから退出しました。');
			window.location.reload();
		} catch (e: any) {
			alert(e?.message || 'ギルドから退出に失敗しました');
		} finally {
			setBusy(false);
		}
	};

	const handleDisbandGuild = async () => {
		if (!myGuild || !user) return;
		try {
			setBusy(true);
			try {
				localStorage.setItem('lastGuildInfo', JSON.stringify({ id: myGuild.id, name: myGuild.name }));
				localStorage.setItem('lastGuildEvent', 'disband');
			} catch {}
			await disbandMyGuild();
			alert('ギルドが解散されました。');
			window.location.reload();
		} catch (e: any) {
			alert(e?.message || 'ギルド解散に失敗しました');
		} finally {
			setBusy(false);
		}
	};

	const handleApproveJoinRequest = async (requestId: string) => {
		if (!myGuild) return;
		try {
			setBusy(true);
			await approveJoinRequest(requestId);
			alert('参加リクエストが承認されました。');
			window.location.reload();
		} catch (e: any) {
			alert(e?.message || '参加リクエスト承認に失敗しました');
		} finally {
			setBusy(false);
		}
	};

        const handleRejectJoinRequest = async (requestId: string) => {
                if (!myGuild) return;
                try {
                        setBusy(true);
                        await rejectJoinRequest(requestId);
                        alert('参加リクエストが拒否されました。');
                        window.location.reload();
                } catch (e: any) {
                        alert(e?.message || '参加リクエスト拒否に失敗しました');
                } finally {
                        setBusy(false);
                }
        };

        const handleKickMember = async (memberUserId: string) => {
                if (!myGuild || !isLeader) return;
                if (!confirm('このメンバーを除名しますか？')) return;
                try {
                        setBusy(true);
                        await kickMember(memberUserId);
                        setMembers(prev => prev.filter(m => m.user_id !== memberUserId));
                        alert('メンバーを除名しました。');
                } catch (e: unknown) {
                        const msg = (e as { message?: string })?.message || '除名に失敗しました';
                        alert(msg);
                } finally {
                        setBusy(false);
                }
        };

        const handleAcceptInvitation = async (invId: string) => {
                try {
                        setBusy(true);
                        await acceptInvitation(invId);
                        alert('ギルドに参加しました。');
                        window.location.reload();
                } catch (e: unknown) {
                        const msg = (e as { message?: string })?.message || '招待の承諾に失敗しました';
                        alert(msg);
                } finally {
                        setBusy(false);
                }
        };

        const handleRejectInvitation = async (invId: string) => {
                try {
                        setBusy(true);
                        await rejectInvitation(invId);
                        setPendingInvitations(prev => prev.filter(i => i.id !== invId));
                        alert('招待を辞退しました。');
                } catch (e: unknown) {
                        const msg = (e as { message?: string })?.message || '招待の辞退に失敗しました';
                        alert(msg);
                } finally {
                        setBusy(false);
                }
        };

	const handleUpdateDescription = async () => {
		if (!myGuild || !descEdit.trim()) return;
		try {
			setBusy(true);
			await updateGuildDescription(descEdit);
			setMyGuild(prev => prev ? { ...prev, description: descEdit } : null);
			setEditingDesc(false);
			alert('ギルド説明が更新されました。');
		} catch (e: any) {
			alert(e?.message || 'ギルド説明更新に失敗しました');
		} finally {
			setBusy(false);
		}
	};

	const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
		if (TITLES.includes(title as any)) return 'level';
		if (MISSION_TITLES.some(mt => mt.name === title)) return 'mission';
		if (LESSON_TITLES.some(lt => lt.name === title)) return 'lesson';
		if (WIZARD_TITLES.includes(title as any)) return 'wizard';
		return 'level';
	};
	const getTitleIcon = (title: string) => {
		const t = getTitleType(title);
		switch (t) {
			case 'level': return <FaCrown className="text-sm text-yellow-400"/>;
			case 'mission': return <FaTrophy className="text-sm text-purple-400"/>;
			case 'lesson': return <FaGraduationCap className="text-sm text-blue-400"/>;
			case 'wizard': return <FaHatWizard className="text-sm text-green-400"/>;
			default: return <FaCrown className="text-sm text-yellow-400"/>;
		}
	};

	if (loading) return (
		<div className="w-full h-full flex flex-col bg-gradient-game text-white">
					<GameHeader />
					<div className="flex-1 overflow-y-auto p-4 sm:p-6">
							<div className="max-w-4xl mx-auto">
									<p className="text-center py-8">Loading...</p>
							</div>
					</div>
		</div>
	);
	if (!user) return (
		<div className="w-full h-full flex flex-col bg-gradient-game text-white">
					<GameHeader />
					<div className="flex-1 overflow-y-auto p-4 sm:p-6">
							<div className="max-w-4xl mx-auto">
									<p className="text-center py-8">Please log in to view this page.</p>
							</div>
					</div>
		</div>
	);
        if (!myGuild) {
                return (
                        <div className="w-full h-full flex flex-col bg-gradient-game text-white">
                                <GameHeader />
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                        <div className="max-w-4xl mx-auto space-y-4 text-center">
                                                <GuildIntro />
                                                <h2 className="text-xl font-bold">ギルドを作成または参加</h2>
                                                <p className="text-gray-300">ギルドを作成して、仲間と一緒に冒険を楽しもう！</p>
                                                {/* 脱退理由記入は廃止 */}
                                                <div className="mt-4 max-w-xl mx-auto text-left bg-slate-800 border border-slate-700 rounded p-4">
                                                        <h3 className="font-semibold mb-2">勧誘リスト</h3>
                                                        {pendingInvitations.length === 0 ? (
                                                                <p className="text-gray-400 text-sm">勧誘はありません。</p>
                                                        ) : (
                                                                <ul className="space-y-2">
                                                                        {pendingInvitations.map(inv => (
                                                                                <li key={inv.id} className="flex items-center justify-between bg-slate-900 p-2 rounded">
                                                                                        <div>
                                                                                                <p className="text-sm">{inv.guild_name || 'ギルド'} からの招待</p>
                                                                                                {inv.inviter_nickname && (
                                                                                                        <p className="text-xs text-gray-400">招待者: {inv.inviter_nickname}</p>
                                                                                                )}
                                                                                        </div>
                                                                                        <div className="flex gap-2">
                                                                                                <button onClick={() => handleAcceptInvitation(inv.id)} className="btn btn-xs btn-success">参加</button>
                                                                                                <button onClick={() => handleRejectInvitation(inv.id)} className="btn btn-xs btn-error">拒否</button>
                                                                                        </div>
                                                                                </li>
                                                                        ))}
                                                                </ul>
                                                        )}
                                                </div>
                                                <div className="mt-4">
                                                        <input type="text" placeholder="ギルド名" value={guildName} onChange={(e)=>setGuildName(e.target.value)} className="input input-bordered w-full max-w-xs" />
                                                        <div className="mt-2 flex gap-2 justify-center items-center">
                                                                <label className="text-sm">タイプ:</label>
                                                                <select className="select select-bordered select-sm" value={newGuildType} onChange={e=>setNewGuildType(e.target.value as any)}>
                                                                        <option value="casual">ゆるギルド</option>
                                                                        <option value="challenge">チャレンジギルド</option>
                                                                </select>
                                                                <button onClick={handleCreateGuild} className="btn btn-primary" disabled={busy}>ギルドを作成</button>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                );
        }


	const contributors = memberMonthly.filter(x => Number(x.monthly_xp || 0) >= 1).length;
	const streakBonus = (myGuild.guild_type === 'challenge') ? Object.values(streaks).reduce((sum, s) => sum + (s.tierPercent || 0), 0) : 0;
	const bonus = computeGuildBonus(myGuild.level || 1, contributors, streakBonus);
	const levelInfo = calcLevel(myTotalContribXp);
	const levelProgress = (levelInfo.remainder / levelInfo.nextLevelXp) * 100;
	const mvpUserId = memberMonthly.sort((a,b)=>b.monthly_xp-a.monthly_xp)[0]?.user_id;
	const mvp = mvpUserId ? members.find(x => x.user_id === mvpUserId) : undefined;
	const mvpXp = memberMonthly.find(x => x.user_id === mvpUserId)?.monthly_xp || 0;

        return (
                        <div className="w-full h-full flex flex-col bg-gradient-game text-white">
                                        <GameHeader />
                                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                                        <div className="max-w-4xl mx-auto space-y-4">
                                                                        <GuildIntro />
                                                                        <div className="bg-slate-800 border border-slate-700 rounded p-4">
                                                                                        <h3 className="font-semibold mb-2">ギルド情報</h3>
											<div className="text-lg font-semibold flex items-center gap-2">
												<span>{myGuild.name}</span>
												<span className={`text-sm px-2 py-0.5 rounded-full ${myGuild.guild_type === 'challenge' ? 'bg-pink-500 text-white' : 'bg-slate-600 text-white'}`}>
													{myGuild.guild_type === 'challenge' ? 'チャレンジ' : 'カジュアル'}
												</span>
											</div>
											<p className="text-sm mb-2">{(myGuild.description && myGuild.description !== myGuild.id) ? myGuild.description : 'なし'}</p>
											<div className="text-sm text-gray-300">リーダー: {myGuild.leader_id === user?.id ? 'あなた' : members.find(m => m.user_id === myGuild.leader_id)?.nickname || '不明'}</div>
											<div className="text-sm text-green-400 mt-1">
												ギルドボーナス: +{((bonus.levelBonus + bonus.memberBonus + (myGuild.guild_type==='challenge'?bonus.streakBonus:0)) * 100).toFixed(1)}% <span className="text-xs text-gray-400 ml-1">（レベル +{(bonus.levelBonus*100).toFixed(1)}% / メンバー +{(bonus.memberBonus*100).toFixed(1)}%{myGuild.guild_type==='challenge' ? ` / ストリーク +${(bonus.streakBonus*100).toFixed(1)}%` : ''}）</span>
											</div>

											<div className="grid grid-cols-2 gap-3 mt-3 text-sm">
												<div className="bg-slate-900 rounded p-3 border border-slate-700">
													<div className="text-gray-400">今月XP</div>
													<div className="text-lg font-semibold">{thisMonthXp.toLocaleString()}</div>
												</div>
												<div className="bg-slate-900 rounded p-3 border border-slate-700">
													<div className="text-gray-400">今月の順位</div>
													<div className="text-lg font-semibold">{myRank ? `${myRank}位` : '-'}</div>
												</div>
												<div className="bg-slate-900 rounded p-3 border border-slate-700">
													<div className="text-gray-400">累計獲得XP</div>
													<div className="text-lg font-semibold">{myTotalContribXp.toLocaleString()}</div>
												</div>
												<div className="bg-slate-900 rounded p-3 border border-slate-700">
													<div className="text-gray-400">現在のレベル</div>
													<div className="text-lg font-semibold">Lv.{levelInfo.level}</div>
													<div className="h-1.5 bg-slate-700 rounded overflow-hidden mt-1">
														<div className="h-full bg-green-500" style={{ width: `${Math.min(100, levelProgress)}%` }} />
													</div>
													<div className="text-sm text-gray-400 mt-1">{levelInfo.remainder.toLocaleString()} / {levelInfo.nextLevelXp.toLocaleString()}</div>
												</div>
											</div>
											<div className="flex gap-2 mt-3">
												<button className="btn btn-sm btn-outline" onClick={() => { const p = new URLSearchParams(); p.set('id', myGuild.id); window.location.hash = `#guild-history?${p.toString()}`; }}>ギルドヒストリーを見る</button>
												{isLeader && (
													editingDesc ? (
														<div className="flex gap-2 flex-1">
															<textarea value={descEdit} onChange={(e)=>setDescEdit(e.target.value)} className="input input-bordered input-sm flex-1" />
															<button onClick={handleUpdateDescription} className="btn btn-primary btn-sm" disabled={busy}>更新</button>
															<button onClick={()=>{ setEditingDesc(false); setDescEdit(myGuild.description || ''); }} className="btn btn-sm btn-outline">キャンセル</button>
														</div>
													) : (
														<button onClick={()=>{ setDescEdit(myGuild.description || ''); setEditingDesc(true); }} className="btn btn-sm btn-outline">説明を編集</button>
													)
												)}
											</div>
								</div>

								{myGuild.guild_type === 'challenge' && (
									<div className="bg-slate-800 border border-slate-700 rounded p-4">
										<h3 className="font-semibold mb-2">ギルドクエスト</h3>
										<p className="text-gray-300 text-sm">今月の獲得経験値が1,000,000に達しないと、月末にギルドは解散となります（メンバーは0人になります）。</p>
										<div className="mt-2">
											<div className="text-sm font-medium text-gray-400">今月の進捗</div>
											<div className="h-1.5 bg-slate-700 rounded overflow-hidden">
												<div className="h-full bg-pink-500" style={{ width: `${Math.min(100, (thisMonthXp/1000000)*100)}%` }} />
											</div>
											<div className="text-sm text-gray-400 mt-1">{thisMonthXp.toLocaleString()} / 1,000,000</div>
										</div>
									</div>
								)}

								<div className="bg-slate-800 border border-slate-700 rounded p-4">
									<h3 className="font-semibold mb-3">MVP（今月）</h3>
									{!mvp ? (
										<p className="text-gray-400 text-sm">該当なし</p>
									) : (
										<div className="flex items-center gap-3">
											<img src={mvp.avatar_url || DEFAULT_AVATAR_URL} className="w-10 h-10 rounded-full" />
											<div className="flex-1">
												<div className="font-medium">{mvp.nickname}</div>
												<div className="text-xs text-gray-400">今月XP {Number(mvpXp || 0).toLocaleString()}</div>
											</div>
										</div>
									)}
								</div>

								<div className="bg-slate-800 border border-slate-700 rounded p-4">
									<h3 className="font-semibold mb-3">メンバーリスト ({members.length}/5)</h3>
									{members.length === 0 ? (
										<p className="text-gray-400 text-sm">メンバーはまだいません。</p>
									) : (
										<ul className="space-y-2 text-base">
											{members.map(m => (
												<li key={m.user_id} className="flex items-center gap-3">
													<button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} aria-label="ユーザーページへ">
														<img src={m.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
													</button>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} className="font-medium text-base truncate text-left hover:text-blue-400">{m.nickname}</button>
															{m.selected_title && (
																<div className="relative group">
																	<div className="flex items-center gap-1 text-yellow-400 cursor-help">
																		{getTitleIcon((m.selected_title as Title) || DEFAULT_TITLE)}
																		<span className="text-sm truncate max-w-[140px]">{(m.selected_title as Title) || DEFAULT_TITLE}</span>
																	</div>
																	<div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap" style={{ top: '100%', left: 0, marginTop: '4px' }}>
																		{getTitleRequirement((m.selected_title as Title) || DEFAULT_TITLE)}
																		<div className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" style={{ top: '-4px', left: '12px' }} />
																	</div>
																</div>
															)}
														</div>
														<div className="text-sm text-gray-400">Lv {m.level} / {m.rank}</div>
														{myGuild.guild_type === 'challenge' && streaks[m.user_id] && (
															<div className="mt-1">
																<div className="h-1.5 bg-slate-700 rounded overflow-hidden">
																	<div className="h-full bg-green-500" style={{ width: `${Math.min(100, (Math.min(streaks[m.user_id].daysCurrentStreak, streaks[m.user_id].tierMaxDays) / streaks[m.user_id].tierMaxDays) * 100)}%` }} />
																</div>
																<div className="text-sm text-gray-400 mt-1">{streaks[m.user_id].display}</div>
															</div>
														)}
													</div>
													{m.role === 'leader' && (
														<span className="text-sm px-2 py-0.5 rounded-full bg-yellow-500 text-black font-bold">Leader</span>
													)}
                                                                                                        {memberMonthly.some(x=>x.user_id===m.user_id && Number(x.monthly_xp||0)>=1) && (
                                                                                                                <FaCheckCircle className="text-green-400 text-sm" title="今月のギルド貢献にカウント済み" />
                                                                                                        )}
                                                                                                        {isLeader && m.user_id !== user?.id && m.role !== 'leader' && (
                                                                                                                <button onClick={() => handleKickMember(m.user_id)} className="btn btn-xs btn-error ml-2">追放</button>
                                                                                                        )}
                                                                                                </li>
                                                                                        ))}
                                                                                </ul>
                                                                        )}
                                                                </div>

								<div className="bg-slate-800 border border-slate-700 rounded p-4">
									<h3 className="font-semibold mb-3">参加リクエスト</h3>
									{joinRequests.length === 0 ? (
										<p className="text-gray-400 text-sm">参加リクエストはありません。</p>
									) : (
										<ul className="space-y-2">
											{joinRequests.map(req => (
												<li key={req.id} className="bg-slate-900 p-2 rounded-lg">
													<p>{req.requester_nickname || 'ユーザー'} からの参加リクエスト</p>
													<button onClick={() => handleApproveJoinRequest(req.id)} className="btn btn-xs btn-success mr-2">承認</button>
													<button onClick={() => handleRejectJoinRequest(req.id)} className="btn btn-xs btn-error">拒否</button>
												</li>
											))}
										</ul>
									)}
								</div>

								<div className="flex justify-end gap-2">
									<button onClick={handleLeaveGuild} className="btn btn-outline text-red-300 border-red-600">ギルドから退出</button>
									{isLeader && (
										<button onClick={handleDisbandGuild} className="btn btn-outline text-red-300 border-red-600">ギルドを解散</button>
									)}
								</div>

								<div className="bg-slate-800 border border-slate-700 rounded p-4">
									<GuildBoard guildId={myGuild.id} />
								</div>
						</div>
					</div>
			</div>
	);
};

export default GuildDashboard;
