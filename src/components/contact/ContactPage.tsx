import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
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
    </div>
  );
};

export default ContactPage;