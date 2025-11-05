import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface PrivacySection {
  title: string;
  description: React.ReactNode;
}

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const lastUpdated = isEnglishCopy ? 'November 4, 2025' : '2025年11月4日';
  const backButtonLabel = isEnglishCopy ? '← Back' : '← 戻る';
  const backButtonAria = isEnglishCopy ? 'Go back to the previous page' : '前のページに戻る';
  const pageTitle = isEnglishCopy ? 'Privacy Policy' : 'プライバシーポリシー';
  const lastUpdatedLabel = isEnglishCopy ? 'Last updated:' : '最終更新日:';
  const companyFooter = isEnglishCopy ? 'KindWords LLC' : '合同会社KindWords';
  const dataProtectionOfficer = isEnglishCopy ? 'Data Protection Officer: Toshio Nagayoshi' : '個人情報保護責任者: 永吉俊雄';
  const privacySections: PrivacySection[] = isEnglishCopy
    ? [
        {
          title: '1. Company Information',
          description: (
            <div className="space-y-1">
              <p>Entity: KindWords LLC</p>
              <p>Address: 1-11-6 Minami-Tokiwadai, Itabashi-ku, Tokyo 174-0072, Japan (Lehua Minami-Tokiwadai 101)</p>
              <p>Representative: Toshio Nagayoshi</p>
              <p>
                Contact: <a href="mailto:toshiotawa@me.com" className="underline text-blue-300">toshiotawa@me.com</a> (email inquiries only)
              </p>
            </div>
          ),
        },
        {
          title: '2. Information We Collect and How',
          description: (
            <div className="space-y-2">
              <p>We collect only the information necessary to operate and improve the Service:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nickname, email address, country of residence, and other details entered during registration</li>
                <li>Payment-related information provided to us by payment processors such as Stripe (card numbers are never stored by us)</li>
                <li>Usage data such as play logs, learning progress, access timestamps, device information, and IP addresses</li>
                <li>Information voluntarily submitted through contact forms or email</li>
              </ul>
            </div>
          ),
        },
        {
          title: '3. Purpose of Use',
          description: (
            <div className="space-y-2">
              <p>Collected information is used for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Providing, operating, and authenticating access to the Service</li>
                <li>Processing payments, confirming billing status, and handling subscription management</li>
                <li>Improving features, developing new functions, enhancing security, and offering customer support</li>
                <li>Preventing fraud, responding to violations of the Terms, and delivering important notices to users</li>
                <li>Analyzing usage trends and creating anonymized statistics</li>
              </ul>
            </div>
          ),
        },
        {
          title: '4. Third-Party Sharing and Delegation',
          description: (
            <div className="space-y-2">
              <p>We do not share personal information with third parties without consent, except where required by law. The following cases are not considered third-party sharing:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Entrusting services such as payment processing, email delivery, or hosting to partners (e.g., Stripe, Supabase, Netlify) under contracts that ensure proper safeguards</li>
                <li>Disclosing statistical information that cannot identify individuals</li>
              </ul>
            </div>
          ),
        },
        {
          title: '5. Security Measures',
          description: (
            <div className="space-y-2">
              <p>We implement technical and organizational measures to protect personal data:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Technical controls such as access management, authentication, and encryption</li>
                <li>Operational controls including log monitoring, role-based access, and multi-factor authentication</li>
                <li>Appropriate supervision and training of employees and contractors</li>
              </ul>
            </div>
          ),
        },
        {
          title: '6. Use of Cookies',
          description: (
            <div className="space-y-2">
              <p>We use cookies and similar technologies to enhance convenience, analyze usage, and improve the Service. You can disable cookies in your browser settings, but some features may not function properly.</p>
            </div>
          ),
        },
        {
          title: '7. Requests to Access, Correct, or Delete',
          description: (
            <div className="space-y-2">
              <p>You may request access, correction, addition, deletion, suspension of use, or suspension of third-party sharing of your personal information. Contact us using the details below, and we will respond in accordance with applicable laws after verifying your identity.</p>
            </div>
          ),
        },
        {
          title: '8. Use by Minors',
          description: (
            <p>Minors must obtain consent from a guardian before using the Service. If we determine that proper consent has not been obtained, we may restrict usage or delete the account.</p>
          ),
        },
        {
          title: '9. Policy Updates',
          description: (
            <div className="space-y-2">
              <p>We may update this Privacy Policy as needed. Important changes will be announced within the Service and, when appropriate, via email. Continued use after changes constitutes acceptance of the updated policy.</p>
            </div>
          ),
        },
        {
          title: '10. Contact',
          description: (
            <div className="space-y-2">
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <p>
                KindWords LLC Privacy Office:{' '}
                <a href="mailto:toshiotawa@me.com" className="underline text-blue-300">toshiotawa@me.com</a>
              </p>
            </div>
          ),
        },
      ]
    : [
        {
          title: '1. 事業者情報',
          description: (
            <div className="space-y-1">
              <p>事業者名: 合同会社KindWords</p>
              <p>所在地: 〒174-0072 東京都板橋区南常盤台1-11-6 レフア南常盤台101</p>
              <p>代表者: 永吉俊雄</p>
              <p>
                お問い合わせ: <a href="mailto:toshiotawa@me.com" className="underline text-blue-300">toshiotawa@me.com</a>（ご連絡はメールにて承ります）
              </p>
            </div>
          ),
        },
        {
          title: '2. 取得する情報と方法',
          description: (
            <div className="space-y-2">
              <p>当社は、以下の方法で必要な範囲の情報を取得します。</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>会員登録フォームに利用者が入力するニックネーム、メールアドレス、居住国などの情報</li>
                <li>決済手続に伴いStripe等の決済事業者が当社に提供する決済関連情報（トークン化された決済ID等。クレジットカード番号を当社が保有することはありません）</li>
                <li>サービス利用状況、演奏ログ、学習進捗、アクセス日時、端末情報、IPアドレスなどの利用履歴</li>
                <li>お問い合わせフォーム、メール等で利用者が任意に提供する情報</li>
              </ul>
            </div>
          ),
        },
        {
          title: '3. 個人情報の利用目的',
          description: (
            <div className="space-y-2">
              <p>当社は取得した情報を以下の目的で利用します。</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>本サービスの提供、運営、本人確認、アカウント管理のため</li>
                <li>課金、請求、支払状況の確認、利用料金の決済処理のため</li>
                <li>サービス改善、新機能開発、セキュリティ強化、利用者サポートのため</li>
                <li>不正利用の防止、規約違反行為への対応、利用者への重要なお知らせの送付のため</li>
                <li>利用状況の分析、統計データの作成（個人を特定できない形式に限る）のため</li>
              </ul>
            </div>
          ),
        },
        {
          title: '4. 第三者提供および委託',
          description: (
            <div className="space-y-2">
              <p>当社は、法令に基づく場合を除き、あらかじめ利用者の同意を得ることなく個人情報を第三者へ提供しません。ただし、以下の場合は第三者提供に該当しません。</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>決済処理、メール配信、データホスティング等を外部事業者に委託する場合（Stripe, Supabase, Netlify 等）。委託先との間では適切な契約を締結し、情報を安全に取り扱います。</li>
                <li>統計情報など個人を特定できない形で開示・提供する場合</li>
              </ul>
            </div>
          ),
        },
        {
          title: '5. 安全管理措置',
          description: (
            <div className="space-y-2">
              <p>当社は、個人情報の漏洩、滅失または毀損を防止するため、以下の安全管理措置を講じます。</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>アクセス制御、認証、暗号化等の技術的安全管理措置</li>
                <li>ログ監視、権限管理、多要素認証などの運用管理</li>
                <li>従業員・委託先に対する適切な監督および教育</li>
              </ul>
            </div>
          ),
        },
        {
          title: '6. クッキー等の利用',
          description: (
            <div className="space-y-2">
              <p>当社は、利用者の利便性向上、利用状況の把握、サービス改善のため、クッキー（Cookie）や類似の技術を利用します。ブラウザの設定によりクッキーを拒否することが可能ですが、サービスの一部がご利用いただけなくなる場合があります。</p>
            </div>
          ),
        },
        {
          title: '7. 個人情報の開示・訂正・利用停止等',
          description: (
            <div className="space-y-2">
              <p>利用者は、当社に対し、ご自身の個人情報の開示、訂正、追加、削除、利用停止、第三者提供の停止を求めることができます。ご希望の場合は、下記お問い合わせ窓口までご連絡ください。本人確認のうえ、法令に基づき適切に対応いたします。</p>
            </div>
          ),
        },
        {
          title: '8. 未成年者の利用について',
          description: (
            <p>未成年の方が本サービスを利用する場合は、必ず保護者の同意を得てください。当社は、保護者の同意が得られていないと判断した場合、利用の制限またはアカウントの削除を行うことがあります。</p>
          ),
        },
        {
          title: '9. ポリシーの改定',
          description: (
            <div className="space-y-2">
              <p>当社は、必要に応じて本プライバシーポリシーを改定することがあります。重要な変更がある場合は、本サービス上で周知し、場合によってはメール等で通知します。改定後に利用者が本サービスを利用した場合、改定後のポリシーに同意したものとみなします。</p>
            </div>
          ),
        },
        {
          title: '10. お問い合わせ窓口',
          description: (
            <div className="space-y-2">
              <p>プライバシーポリシーに関するお問い合わせは、下記までお願いいたします。</p>
              <p>
                合同会社KindWords プライバシー窓口（メール）:
                {' '}
                <a href="mailto:toshiotawa@me.com" className="underline text-blue-300">toshiotawa@me.com</a>
              </p>
            </div>
          ),
        },
      ];

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm border border-white/10"
            aria-label={backButtonAria}
          >
            {backButtonLabel}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-12 space-y-10">
          <header>
            <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
            <p className="text-sm text-gray-400">{lastUpdatedLabel} {lastUpdated}</p>
          </header>

          <div className="space-y-8">
            {privacySections.map(section => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                <div className="text-gray-300 leading-relaxed space-y-2">{section.description}</div>
              </section>
            ))}
          </div>

          <footer className="border-t border-white/10 pt-6 text-sm text-gray-400">
            <p>{companyFooter}</p>
            <p>{dataProtectionOfficer}</p>
          </footer>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default PrivacyPage;