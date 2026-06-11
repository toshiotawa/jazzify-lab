import React from 'react';
import { Link } from 'react-router-dom';
import { LpAppStoreButton } from '@/components/landing/LpAppStoreButton';
import { getLandingCopy } from '@/components/landing/landingCopy';
import {
  HELP_IOS_MIDI_PATH,
  HELP_MIDI_KEYBOARD_CHOICE_PATH,
} from '@/components/landing/landingLinks';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string): void => {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LpFooter: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <footer
      className="lp-dark py-14"
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
              <span className="font-bold" style={{ color: 'var(--lp-ink)' }}>
                Jazzify
              </span>
            </div>

            <p className="text-sm mt-4" style={{ color: 'var(--lp-ink-muted)' }}>
              {copy.footer.blurb}
            </p>

            <LpAppStoreButton
              label="App Store"
              ariaLabel={copy.footer.appStoreAria}
              className="mt-4"
            />
          </div>

          <div>
            <h3 className="lp-subtitle mb-4">{copy.footer.serviceHeading}</h3>
            <nav className="space-y-2 text-sm text-[var(--lp-ink-muted)]">
              {copy.header.nav.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="block transition-colors hover:text-[var(--lp-gold-deep)]"
                  onClick={(event) => scrollToSection(event, link.id)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/signup"
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
              >
                {copy.footer.signupLink}
              </Link>
              <Link
                to="/login"
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
              >
                {copy.footer.loginLink}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="lp-subtitle mb-4">{copy.footer.supportHeading}</h3>
            <nav className="space-y-2 text-sm text-[var(--lp-ink-muted)]">
              <a
                href="#faq"
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
                onClick={(event) => scrollToSection(event, 'faq')}
              >
                {copy.footer.faqLink}
              </a>
              <Link
                to={HELP_IOS_MIDI_PATH}
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
              >
                {copy.footer.iosMidiLink}
              </Link>
              <Link
                to={HELP_MIDI_KEYBOARD_CHOICE_PATH}
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
              >
                {copy.footer.midiChoiceLink}
              </Link>
              <Link
                to="/contact"
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
              >
                {copy.footer.contactLink}
              </Link>
              <Link
                to="/terms"
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
              >
                {copy.footer.termsLink}
              </Link>
              <Link
                to="/privacy"
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
              >
                {copy.footer.privacyLink}
              </Link>
              <Link
                to="/legal/tokushoho"
                className="block transition-colors hover:text-[var(--lp-gold-deep)]"
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
