import React from 'react';
import { Link } from 'react-router-dom';
import type { NavLink } from '@/data/landingPageData';

interface Props {
  isEnglish: boolean;
  navLinks: NavLink[];
  onAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const EnglishFooter: React.FC = () => (
  <footer className="py-16 bg-slate-900 border-t border-purple-500/30">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="col-span-1">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            <i className="fas fa-music mr-2" aria-hidden="true"></i>Jazzify
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Embark on a jazz adventure in a fantasy realm. A learning platform for all jazz
            enthusiasts, from beginners to advanced players.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/contact" className="hover:text-purple-400 transition">Contact</Link></li>
            <li><Link to="/terms" className="hover:text-purple-400 transition">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-purple-400 transition">Privacy Policy</Link></li>
            <li><Link to="/legal/tokushoho" className="hover:text-purple-400 transition">Legal Notice</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} Jazzify. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const JapaneseFooter: React.FC<{
  navLinks: NavLink[];
  onAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}> = ({ navLinks, onAnchorClick }) => (
  <footer className="py-16 bg-slate-900 border-t border-purple-500/30">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="col-span-1">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            <i className="fas fa-music mr-2" aria-hidden="true"></i>Jazzify
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            ジャズ異世界で始まる音楽冒険。初心者から上級者まで、すべてのジャズ愛好家のための学習プラットフォームです。
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">サービス</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {navLinks.slice(0, 4).map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className="hover:text-purple-400 transition"
                  onClick={(e) => onAnchorClick(e, l.id)}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/signup" className="hover:text-purple-400 transition">
                無料体験
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">サポート</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <a
                href="#faq"
                className="hover:text-purple-400 transition"
                onClick={(e) => onAnchorClick(e, 'faq')}
              >
                よくある質問
              </a>
            </li>
            <li><Link to="/help/ios-midi" className="hover:text-purple-400 transition">iPhone/iPadでMIDIを使う</Link></li>
            <li><Link to="/contact" className="hover:text-purple-400 transition">お問い合わせ</Link></li>
            <li><Link to="/terms" className="hover:text-purple-400 transition">利用規約</Link></li>
            <li><Link to="/privacy" className="hover:text-purple-400 transition">プライバシーポリシー</Link></li>
            <li><Link to="/legal/tokushoho" className="hover:text-purple-400 transition">特定商取引法に基づく表記</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} Jazzify. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export const LPFooter: React.FC<Props> = ({ isEnglish, navLinks, onAnchorClick }) => {
  if (isEnglish) return <EnglishFooter />;
  return <JapaneseFooter navLinks={navLinks} onAnchorClick={onAnchorClick} />;
};
