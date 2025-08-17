import React from 'react';
import { Link } from 'react-router-dom';

const SiteFooter: React.FC = () => {
  return (
    <footer className="py-16 bg-slate-900 border-t border-purple-500 border-opacity-30 mt-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
              <i className="fas fa-music mr-2"></i>Jazzify
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              ジャズ異世界で始まる音楽冒険。初心者から上級者まで、すべてのジャズ愛好家のための学習プラットフォームです。
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">サポート</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/help/ios-midi" className="hover:text-purple-400 transition">iPhone/iPadでMIDIを使う</Link></li>
              <li><Link to="/contact" className="hover:text-purple-400 transition">お問い合わせ</Link></li>
              <li><Link to="/terms" className="hover:text-purple-400 transition">利用規約</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-400 transition">プライバシーポリシー</Link></li>
              <li><Link to="/legal/tokushoho" className="hover:text-purple-400 transition">特定商取引法に基づく表記</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">フォローする</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="Twitter">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="Facebook">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="YouTube">
                <i className="fab fa-youtube text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition" aria-label="Instagram">
                <i className="fab fa-instagram text-xl"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Jazzify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;