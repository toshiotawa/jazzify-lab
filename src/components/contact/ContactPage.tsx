import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';

const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm border border-white/10"
            aria-label="前のページに戻る"
          >
            ← 戻る
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-6">お問い合わせ</h1>
          <p className="text-gray-300 mb-6">ご質問・ご要望などありましたら、以下のフォームからお送りください。（プレースホルダー）</p>
          <form name="contact" method="POST" data-netlify="true" className="space-y-4 max-w-xl" netlify-honeypot="bot-field">
            <input type="hidden" name="form-name" value="contact" />
            <p className="hidden">
              <label>Don’t fill this out if you're human: <input name="bot-field" /></label>
            </p>
            <div>
              <label htmlFor="name" className="block text-sm mb-1">お名前</label>
              <input id="name" name="name" type="text" required className="w-full px-3 py-2 rounded bg-slate-800 border border-white/10" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm mb-1">メールアドレス</label>
              <input id="email" name="email" type="email" required className="w-full px-3 py-2 rounded bg-slate-800 border border-white/10" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm mb-1">お問い合わせ内容</label>
              <textarea id="message" name="message" rows={6} required className="w-full px-3 py-2 rounded bg-slate-800 border border-white/10"></textarea>
            </div>
            <button type="submit" className="px-6 py-2 rounded bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold">送信</button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ContactPage;