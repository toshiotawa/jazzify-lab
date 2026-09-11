import React, { useCallback, useEffect, useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { SiDiscord } from 'react-icons/si';
import { useToast } from '@/stores/toastStore';
import {
  fetchMyDiscordMembership,
  startDiscordLink,
  type DiscordMembership,
} from '@/platform/supabaseDiscord';

interface DiscordCommunitySectionProps {
  isEnglishCopy: boolean;
  isPremiumMember: boolean;
  userId: string;
  accessToken: string | null | undefined;
}

function parseDiscordCallbackStatus(rawHash: string): 'joined' | 'error' | null {
  const hashBase = rawHash.split('?')[0];
  if (hashBase !== '#dashboard') {
    return null;
  }
  const queryIndex = rawHash.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }
  const params = new URLSearchParams(rawHash.slice(queryIndex + 1));
  const discord = params.get('discord');
  if (discord === 'joined' || discord === 'error') {
    return discord;
  }
  return null;
}

function clearDiscordCallbackQuery(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.history.replaceState(null, '', `${window.location.pathname}#dashboard`);
}

const DiscordCommunitySection: React.FC<DiscordCommunitySectionProps> = ({
  isEnglishCopy,
  isPremiumMember,
  userId,
  accessToken,
}) => {
  const toast = useToast();
  const [membership, setMembership] = useState<DiscordMembership | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [linking, setLinking] = useState(false);

  const title = isEnglishCopy ? 'Members-only Discord Server' : '有料会員専用Discordサーバー';
  const description = isEnglishCopy
    ? 'Connect with other Jazzify members, share practice logs, and join voice channels.'
    : '他の Jazzify 会員と交流したり、練習日記を共有したり、音声チャンネルに参加できます。';
  const joinLabel = isEnglishCopy ? 'Join Discord Server' : 'Discordサーバーに参加する';
  const openLabel = isEnglishCopy ? 'Open Discord' : 'Discordを開く';
  const note = isEnglishCopy
    ? 'If your membership expires, you will be removed from the server automatically.'
    : '有料会員でなくなると、自動的にサーバーから退出となります。';
  const loadingText = isEnglishCopy ? 'Loading Discord status...' : 'Discord 連携状態を確認中...';

  const reloadMembership = useCallback(async (): Promise<void> => {
    setLoadingMembership(true);
    try {
      const next = await fetchMyDiscordMembership(userId);
      setMembership(next);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(
        isEnglishCopy
          ? `Failed to load Discord status: ${message}`
          : `Discord 連携状態の取得に失敗しました: ${message}`,
        {
          title: isEnglishCopy ? 'Discord error' : 'Discord エラー',
          duration: 5000,
        },
      );
    } finally {
      setLoadingMembership(false);
    }
  }, [isEnglishCopy, toast, userId]);

  useEffect(() => {
    if (!isPremiumMember) {
      setMembership(null);
      setLoadingMembership(false);
      return;
    }
    void reloadMembership();
  }, [isPremiumMember, reloadMembership]);

  useEffect(() => {
    if (!isPremiumMember || typeof window === 'undefined') {
      return;
    }

    const handleHashChange = (): void => {
      const status = parseDiscordCallbackStatus(window.location.hash);
      if (!status) {
        return;
      }

      if (status === 'joined') {
        toast.success(
          isEnglishCopy
            ? 'You joined the Discord server.'
            : 'Discordサーバーに参加しました。',
          {
            title: isEnglishCopy ? 'Discord connected' : 'Discord 連携完了',
            duration: 5000,
          },
        );
      } else {
        toast.error(
          isEnglishCopy
            ? 'Could not connect to Discord. Please try again.'
            : 'Discord 連携に失敗しました。もう一度お試しください。',
          {
            title: isEnglishCopy ? 'Discord error' : 'Discord エラー',
            duration: 5000,
          },
        );
      }

      clearDiscordCallbackQuery();
      void reloadMembership();
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isEnglishCopy, isPremiumMember, reloadMembership, toast]);

  const handleJoin = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      toast.error(
        isEnglishCopy ? 'Please sign in again.' : '再度ログインしてください。',
        { duration: 4000 },
      );
      return;
    }

    setLinking(true);
    try {
      const authorizeUrl = await startDiscordLink(accessToken, isEnglishCopy ? 'en' : 'ja');
      window.location.href = authorizeUrl;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(
        isEnglishCopy
          ? `Failed to start Discord link: ${message}`
          : `Discord 連携の開始に失敗しました: ${message}`,
        {
          title: isEnglishCopy ? 'Discord error' : 'Discord エラー',
          duration: 5000,
        },
      );
      setLinking(false);
    }
  }, [accessToken, isEnglishCopy, toast]);

  if (!isPremiumMember) {
    return null;
  }

  const discordChannelUrl = membership
    ? `https://discord.com/channels/${membership.guild_id}`
    : null;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
        <SiDiscord className="w-5 h-5 text-indigo-400" aria-hidden="true" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-300">{description}</p>

        {loadingMembership ? (
          <p className="text-sm text-gray-400 animate-pulse">{loadingText}</p>
        ) : membership && discordChannelUrl ? (
          <div className="space-y-3">
            <a
              href={discordChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <FaExternalLinkAlt className="w-3 h-3" aria-hidden="true" />
              <span>{openLabel}</span>
            </a>
            <p className="text-xs text-gray-500">{note}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { void handleJoin(); }}
              disabled={linking}
              className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <SiDiscord className="w-4 h-4" aria-hidden="true" />
              <span>{linking ? (isEnglishCopy ? 'Redirecting...' : '移動中...') : joinLabel}</span>
            </button>
            <p className="text-xs text-gray-500">{note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordCommunitySection;
