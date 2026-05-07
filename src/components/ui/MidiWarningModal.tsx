import React, { useCallback, useEffect, useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { detectMidiWarningTarget } from '@/utils/browserDetect';

const SESSION_KEY = 'midi_warning_dismissed';

const COPY = {
  ja: {
    title: 'ご注意',
    closeLabel: '閉じる',
    macSafari:
      'このブラウザはMIDIキーボードのサポート対象外です。Chrome、Firefoxなどのブラウザが対応しています。',
    iosBrowser: 'このブラウザはMIDIキーボードのサポート対象外です。アプリ版をご利用ください。',
    ok: 'OK',
  },
  en: {
    title: 'Notice',
    closeLabel: 'Close',
    macSafari:
      'This browser does not support USB MIDI keyboards. Please use Chrome, Firefox, or another supported desktop browser.',
    iosBrowser:
      'This browser does not support USB MIDI keyboards. Please use the Jazzify app for MIDI support.',
    ok: 'OK',
  },
} as const;

const MidiWarningModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const t = isEnglishCopy ? COPY.en : COPY.ja;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* private browsing */
    }

    const target = detectMidiWarningTarget();
    if (!target) return;

    const row = isEnglishCopy ? COPY.en : COPY.ja;
    setMessage(target === 'mac-safari' ? row.macSafari : row.iosBrowser);
    setVisible(true);
  }, [isEnglishCopy]);

  const handleClose = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* private browsing */
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-yellow-400 text-lg" />
            <h3 className="text-lg font-bold text-white">{t.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-gray-400 hover:text-white"
            aria-label={t.closeLabel}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-gray-200 text-sm leading-relaxed">{message}</p>
          <button
            onClick={handleClose}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold text-white transition-colors"
            type="button"
          >
            {t.ok}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MidiWarningModal;
