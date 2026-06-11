import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string): void => {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const AppleLogoIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="w-4 h-4"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

export const LpFooter: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <footer
      className="py-14"
      style={{
        background: 'var(--lp-surface)',
        borderTop: '1px solid var(--lp-line)',
      }}
    >
      <div className="lp-container">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/default_avater/default-avater.webp"
                alt={copy.header.logoAlt}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-bold" style={{ color: 'var(--lp-blue-dark)' }}>
                Jazzify
              </span>
            </div>

            <p className="text-sm mt-4" style={{ color: 'var(--lp-ink-muted)' }}>
              {copy.footer.blurb}
            </p>

            <a
              href="https://apps.apple.com/us/app/jazzify/id6761457001"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.footer.appStoreAria}
              className="lp-btn-outline px-5 py-2.5 text-sm mt-4 gap-2"
            >
              <AppleLogoIcon />
              <span>App Store</span>
            </a>
          </div>

          <div>
            <h3 className="font-bold mb-4">{copy.footer.serviceHeading}</h3>
            <nav className="space-y-2 text-sm text-[var(--lp-ink-muted)]">
              {copy.header.nav.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="block transition-colors hover:text-[var(--lp-blue)]"
                  onClick={(event) => scrollToSection(event, link.id)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/signup"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.signupLink}
              </Link>
              <Link
                to="/login"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.loginLink}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-bold mb-4">{copy.footer.supportHeading}</h3>
            <nav className="space-y-2 text-sm text-[var(--lp-ink-muted)]">
              <a
                href="#faq"
                className="block transition-colors hover:text-[var(--lp-blue)]"
                onClick={(event) => scrollToSection(event, 'faq')}
              >
                {copy.footer.faqLink}
              </a>
              <Link
                to="/help/ios-midi"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.iosMidiLink}
              </Link>
              <Link
                to="/help/midi-keyboard-choice"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.midiChoiceLink}
              </Link>
              <Link
                to="/contact"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.contactLink}
              </Link>
              <Link
                to="/terms"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.termsLink}
              </Link>
              <Link
                to="/privacy"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.privacyLink}
              </Link>
              <Link
                to="/legal/tokushoho"
                className="block transition-colors hover:text-[var(--lp-blue)]"
              >
                {copy.footer.tokushohoLink}
              </Link>
            </nav>
          </div>
        </div>

        <p
          className="mt-12 pt-6 text-center text-xs"
          style={{
            color: 'var(--lp-ink-muted)',
            borderTop: '1px solid var(--lp-line)',
          }}
        >
          © {new Date().getFullYear()} Jazzify. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
