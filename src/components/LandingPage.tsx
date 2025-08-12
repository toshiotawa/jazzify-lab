import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { 
  Music, 
  Gamepad2, 
  Swords, 
  GraduationCap, 
  Users, 
  Zap, 
  KeyboardMusic, 
  Mic, 
  Star,
  Check,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const { user, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // スクロール位置を監視
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ランディングページ用のbodyクラスを追加
  useEffect(() => {
    // ランディングページではスクロールを有効化
    document.body.classList.add('landing-page');
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // デバッグ情報をログ出力
    console.log('Landing page mounted - Enabling scroll');
    console.log('Body overflow:', window.getComputedStyle(document.body).overflow);
    console.log('HTML overflow:', window.getComputedStyle(document.documentElement).overflow);
    console.log('Body height:', window.getComputedStyle(document.body).height);
    console.log('Document height:', document.documentElement.scrollHeight);
    
    return () => {
      document.body.classList.remove('landing-page');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // 認証状態を監視
  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate('/main#dashboard', { replace: true });
    }
  }, [user, isGuest, loading, navigate]);

  // スムーズスクロール
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
    }
  };

  // セクションのアニメーション設定
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-black to-slate-900 text-white" style={{ overflow: 'visible' }}>
      <Helmet>
        <title>Jazzify - ジャズ練習をRPGの冒険に</title>
        <meta name="description" content="MIDIキーボードとマイク入力対応。音ゲー×RPG×動画レッスンでジャズを楽しく上達。" />
      </Helmet>

      {/* ナビゲーションバー */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-purple-400" />
              <span className="text-xl font-bold">Jazzify</span>
            </div>

            {/* デスクトップメニュー */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="hover:text-purple-400 transition-colors">
                特長
              </button>
              <button onClick={() => scrollToSection('modes')} className="hover:text-purple-400 transition-colors">
                モード
              </button>
              <button onClick={() => scrollToSection('community')} className="hover:text-purple-400 transition-colors">
                コミュニティ
              </button>
              <Link to="/login" className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-full transition-colors">
                始める
              </Link>
            </div>

            {/* モバイルメニューボタン */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <motion.div 
            className="md:hidden bg-black/95 backdrop-blur-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-4 py-6 space-y-4">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left hover:text-purple-400">
                特長
              </button>
              <button onClick={() => scrollToSection('modes')} className="block w-full text-left hover:text-purple-400">
                モード
              </button>
              <button onClick={() => scrollToSection('community')} className="block w-full text-left hover:text-purple-400">
                コミュニティ
              </button>
              <Link to="/login" className="block bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-full text-center">
                始める
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ヒーローセクション */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 背景のグラデーション効果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        
        <div className="container mx-auto px-4 pt-20">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* メインキャラクターアバター */}
            <motion.div 
              className="mb-8 flex justify-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <img 
                  src="/default_avater/default-avater.png" 
                  alt="Jazzify Hero Character"
                  className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-purple-400 shadow-2xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-3">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              練習を冒険に変える
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
              ジャズをRPGのように楽しく学ぶ。MIDIキーボードとマイク入力対応で、
              あなたの演奏がゲームの世界と連動します。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                to="/login" 
                className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                今すぐ始める
              </Link>
              <Link 
                to="/main#dashboard" 
                onClick={() => useAuthStore.getState().enterGuestMode()}
                className="border-2 border-purple-400 hover:bg-purple-400/20 px-8 py-4 rounded-full text-lg font-semibold transition-all"
              >
                おためしプレイ
              </Link>
            </div>

            {/* 特長プレビュー */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <KeyboardMusic className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm">MIDI対応</p>
              </motion.div>
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <Mic className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm">マイク入力</p>
              </motion.div>
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <Gamepad2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm">ゲーム感覚</p>
              </motion.div>
            </div>
          </motion.div>

          {/* スクロールインジケーター */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="h-8 w-8 text-gray-400" />
          </motion.div>
        </div>
      </section>

      {/* 特長セクション */}
      <section id="features" className="py-20 bg-black/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Jazzifyの特長
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              {...fadeInUp}
              className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 rounded-xl p-8 border border-purple-500/20"
            >
              <Zap className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-4">リアルタイム反応</h3>
              <p className="text-gray-300">
                MIDIキーボードやマイクからの入力を瞬時に認識。
                演奏がそのままゲームに反映されます。
              </p>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 rounded-xl p-8 border border-blue-500/20"
            >
              <Star className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-4">経験値システム</h3>
              <p className="text-gray-300">
                練習すればするほどレベルアップ。
                RPGのように成長を実感できます。
              </p>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-900/20 to-green-900/10 rounded-xl p-8 border border-green-500/20"
            >
              <Users className="h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-4">コミュニティ連携</h3>
              <p className="text-gray-300">
                仲間と一緒に上達。ランキングや交流で
                モチベーションを維持します。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* モードセクション */}
      <section id="modes" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              3つの冒険モード
            </h2>
          </motion.div>

          {/* 音ゲーモード */}
          <motion.div {...fadeInUp} className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <img 
                    src="/stage_icons/1.png" 
                    alt="音ゲーモード"
                    className="w-16 h-16 mr-4"
                  />
                  <h3 className="text-2xl font-bold">音ゲーモード</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  ジャズの巨匠たちの名演をゲーム感覚でマスター。
                  譜面が流れてくるタイミングに合わせて演奏し、
                  スコアを競います。
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>ビバップからモダンジャズまで幅広い楽曲</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>難易度調整可能</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>リアルタイムスコアリング</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 rounded-xl p-8 border border-purple-500/20">
                <img 
                  src="/stage_icons/2.png" 
                  alt="音ゲーモードプレビュー"
                  className="w-full h-64 object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* ファンタジーモード */}
          <motion.div {...fadeInUp} className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-blue-900/20 to-blue-900/10 rounded-xl p-8 border border-blue-500/20">
                <img 
                  src="/stage_icons/4.png" 
                  alt="ファンタジーモードプレビュー"
                  className="w-full h-64 object-contain"
                />
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center mb-4">
                  <img 
                    src="/stage_icons/3.png" 
                    alt="ファンタジーモード"
                    className="w-16 h-16 mr-4"
                  />
                  <h3 className="text-2xl font-bold">ファンタジーモード</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  コード進行を冒険のクエストとして攻略。
                  RPGの世界観でジャズ理論を楽しく学べます。
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>ストーリー形式で進行</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>ディグリーやテンションを実践的に習得</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>キャラクター成長システム</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* レッスンモード */}
          <motion.div {...fadeInUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <img 
                    src="/stage_icons/5.png" 
                    alt="レッスンモード"
                    className="w-16 h-16 mr-4"
                  />
                  <h3 className="text-2xl font-bold">レッスンモード</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  プロ講師による動画レッスンと実践課題。
                  基礎から応用まで体系的に学習できます。
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>段階的なカリキュラム</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>実践的な課題で定着</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span>進捗管理システム</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-900/20 to-green-900/10 rounded-xl p-8 border border-green-500/20">
                <img 
                  src="/stage_icons/6.png" 
                  alt="レッスンモードプレビュー"
                  className="w-full h-64 object-contain"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* コミュニティセクション */}
      <section id="community" className="py-20 bg-black/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <img 
                src="/stage_icons/7.png" 
                alt="コミュニティ"
                className="w-20 h-20"
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              仲間と共に成長する
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Jazzifyのコミュニティで、同じ目標を持つ仲間と切磋琢磨。
              あなたの成長を共有し、お互いに刺激し合いましょう。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div 
              {...fadeInUp}
              className="bg-gradient-to-br from-purple-900/20 to-purple-900/10 rounded-xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center mb-4">
                <img 
                  src="/stage_icons/8.png" 
                  alt="ランキング"
                  className="w-12 h-12 mr-3"
                />
                <h3 className="text-xl font-bold">ランキングシステム</h3>
              </div>
              <p className="text-gray-300">
                週間・月間ランキングで実力を競い合い、
                上位入賞者には特別な称号が付与されます。
              </p>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 rounded-xl p-6 border border-blue-500/20"
            >
              <div className="flex items-center mb-4">
                <img 
                  src="/stage_icons/9.png" 
                  alt="練習日記"
                  className="w-12 h-12 mr-3"
                />
                <h3 className="text-xl font-bold">練習日記</h3>
              </div>
              <p className="text-gray-300">
                日々の練習を記録し、仲間と共有。
                いいねやコメントで励まし合えます。
              </p>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-900/20 to-green-900/10 rounded-xl p-6 border border-green-500/20"
            >
              <div className="flex items-center mb-4">
                <img 
                  src="/stage_icons/10.png" 
                  alt="イベント"
                  className="w-12 h-12 mr-3"
                />
                <h3 className="text-xl font-bold">定期イベント</h3>
              </div>
              <p className="text-gray-300">
                月替わりのチャレンジイベントや
                オンラインセッションを開催。
              </p>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-yellow-900/20 to-yellow-900/10 rounded-xl p-6 border border-yellow-500/20"
            >
              <div className="flex items-center mb-4">
                <Users className="h-12 w-12 text-yellow-400 mr-3" />
                <h3 className="text-xl font-bold">メンター制度</h3>
              </div>
              <p className="text-gray-300">
                上級者が初心者をサポート。
                質問や相談ができる環境を提供。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              今すぐJazzifyで冒険を始めよう
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              無料でお試しいただけます。
              あなたのジャズ演奏スキルを次のレベルへ。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                無料で登録
              </Link>
              <Link 
                to="/login" 
                className="bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 px-8 py-4 rounded-full text-lg font-semibold transition-all"
              >
                ログイン
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-black py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Music className="h-6 w-6 text-purple-400" />
                <span className="text-lg font-bold">Jazzify</span>
              </div>
              <p className="text-gray-400 text-sm">
                ジャズ練習をRPGの冒険に変える、
                新しい学習プラットフォーム。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">プロダクト</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">特長</button></li>
                <li><button onClick={() => scrollToSection('modes')} className="hover:text-white">モード</button></li>
                <li><button onClick={() => scrollToSection('community')} className="hover:text-white">コミュニティ</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-white">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">法的情報</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">利用規約</a></li>
                <li><a href="#" className="hover:text-white">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-white">特定商取引法</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Jazzify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
