import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteFooter from '@/components/common/SiteFooter';
import { getContactPageCopy } from '@/components/contact/contactContent';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import PublicPageHelmet from '@/components/seo/PublicPageHelmet';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { normalizeContactInput, validateContactInput } from '@/utils/contactSubmission';

type SubmitStatus = 'idle' | 'sending' | 'success' | 'error';

const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const copy = getContactPageCopy(isEnglishCopy ? 'en' : 'ja');
  const locale = isEnglishCopy ? 'en' : 'ja';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [botField, setBotField] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = normalizeContactInput({
      name,
      email,
      message,
      botField,
      source: 'web',
      locale,
    });

    if (input.botField.length > 0) {
      setStatus('success');
      setFeedbackMessage(copy.successMessage);
      return;
    }

    const validation = validateContactInput(input);
    if (!validation.ok) {
      setStatus('error');
      setFeedbackMessage(copy.validationMessage);
      return;
    }

    setStatus('sending');
    setFeedbackMessage('');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const { data: { session } } = await getSupabaseClient().auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    try {
      const response = await fetch('/.netlify/functions/submitContact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          message: input.message,
          botField: input.botField,
          source: input.source,
          locale: input.locale,
        }),
      });

      if (!response.ok) {
        setStatus('error');
        setFeedbackMessage(copy.errorMessage);
        return;
      }

      setStatus('success');
      setFeedbackMessage(copy.successMessage);
      setMessage('');
    } catch {
      setStatus('error');
      setFeedbackMessage(copy.errorMessage);
    }
  }, [botField, copy, email, locale, message, name]);

  const isSending = status === 'sending';

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PublicPageHelmet
        title={copy.helmetTitle}
        description={copy.seoDescription}
        htmlLang={isEnglishCopy ? 'en' : 'ja'}
      />
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm border border-white/10"
            aria-label={copy.backButtonAria}
          >
            {copy.backButtonLabel}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-6">{copy.pageTitle}</h1>
          <p className="text-gray-300 mb-6">{copy.intro}</p>
          <form
            name="contact"
            onSubmit={handleSubmit}
            className="space-y-4 max-w-xl"
          >
            <p className="hidden">
              <label>
                {copy.honeypotLabel}
                <input
                  name="bot-field"
                  value={botField}
                  onChange={event => setBotField(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </p>
            <div>
              <label htmlFor="name" className="block text-sm mb-1">{copy.nameLabel}</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={event => setName(event.target.value)}
                disabled={isSending}
                className="w-full px-3 py-2 rounded bg-slate-800 border border-white/10"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm mb-1">{copy.emailLabel}</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={isSending}
                className="w-full px-3 py-2 rounded bg-slate-800 border border-white/10"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm mb-1">{copy.messageLabel}</label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                value={message}
                onChange={event => setMessage(event.target.value)}
                disabled={isSending}
                className="w-full px-3 py-2 rounded bg-slate-800 border border-white/10"
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2 rounded bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? copy.sendingLabel : copy.submitLabel}
            </button>
            {feedbackMessage && (
              <p
                aria-live="polite"
                className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}
              >
                {feedbackMessage}
              </p>
            )}
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ContactPage;
