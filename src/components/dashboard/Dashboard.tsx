import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMissionStore } from '@/stores/missionStore';
import { useUserStatsStore } from '@/stores/userStatsStore';
import { Announcement, fetchActiveAnnouncements } from '@/platform/supabaseAnnouncements';
import { useToast } from '@/stores/toastStore';
import { mdToHtml } from '@/utils/markdown';
import { 
  FaBell, 
  FaExternalLinkAlt, 
  FaTrophy, 
  FaCalendarAlt,
  FaMusic,
  FaArrowLeft,
  FaBullseye,
  FaUser,
  FaCrown,
  FaGraduationCap,
  FaGem,
  FaStar,
  FaMedal,
  FaMagic,
  FaHatWizard
} from 'react-icons/fa';
import { Mission } from '@/platform/supabaseMissions';
import GameHeader from '@/components/ui/GameHeader';
import { xpToNextLevel, currentLevelXP } from '@/utils/xpCalculator';
import { calcLevel } from '@/platform/supabaseXp';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES } from '@/utils/titleConstants';
import OpenBetaPlanChange from '@/components/subscription/OpenBetaPlanChange';

/**
 * ダッシュボード画面
 * Hash: #dashboard で表示
 */
const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { profile, isGuest } = useAuthStore();
  const isStandardGlobal = profile?.rank === 'standard_global';

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      setOpen(hash === '#dashboard');
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleClose = () => {
    window.location.hash = '';
  };

  // 称号の種類を判定する関数
  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
    // レベル称号の判定
    if (TITLES.includes(title as any)) {
      return 'level';
    }
    // ミッション称号の判定
    if (MISSION_TITLES.some(mt => mt.name === title)) {
      return 'mission';
    }
    // レッスン称号の判定
    if (LESSON_TITLES.some(lt => lt.name === title)) {
      return 'lesson';
    }
    // 魔法使い称号の判定
    if (WIZARD_TITLES.includes(title as any)) {
      return 'wizard';
    }
    // デフォルトはレベル称号
    return 'level';
  };

  // 称号タイプに応じたアイコンを取得する関数
  const getTitleIcon = (title: string) => {
    const titleType = getTitleType(title);
    switch (titleType) {
      case 'level':
        return <FaCrown className="text-yellow-400 text-sm" />;
      case 'mission':
        return <FaTrophy className="text-purple-400 text-sm" />;
      case 'lesson':
        return <FaGraduationCap className="text-blue-400 text-sm" />;
      case 'wizard':
        return <FaHatWizard className="text-green-400 text-sm" />;
      default:
        return <FaCrown className="text-yellow-400 text-sm" />;
    }
  };

  // ランクに応じたアイコンを取得する関数
  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'platinum':
        return <FaCrown className="text-purple-400 text-lg" />;
      case 'premium':
        return <FaGem className="text-yellow-400 text-lg" />;
      case 'standard':
      case 'standard_global':
        return <FaStar className="text-blue-400 text-sm" />;
      case 'free':
      default:
        return <FaMedal className="text-gray-400 text-sm" />;
    }
  };

  if (!open) return null;

  return (
    <div 
      className="w-full h-full flex flex-col bg-gradient-game text-white"
    >
      <GameHeader />
      {/* ダッシュボードコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* オープンベータ: プラン変更 UI のみ表示 */}
          <OpenBetaPlanChange />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 