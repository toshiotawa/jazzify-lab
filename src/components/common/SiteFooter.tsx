import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import {
  HELP_IOS_MIDI_PATH,
  HELP_MIDI_KEYBOARD_CHOICE_PATH,
  JAZZIFY_INSTAGRAM_URL,
  JAZZIFY_X_URL,
} from '@/components/landing/landingLinks';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const SiteFooter: React.FC = () => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const copy = getLandingCopy(isEnglishCopy).footer;

  return (
    <footer className="py-16 bg-slate-900 border-t border-purple-500 border-opacity-30 mt-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
              <i className="fas fa-music mr-2"></i>Jazzify
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {copy.blurb}
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{copy.supportHeading}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to={HELP_IOS_MIDI_PATH} className="hover:text-purple-400 transition">{copy.iosMidiLink}</Link></li>
              <li><Link to={HELP_MIDI_KEYBOARD_CHOICE_PATH} className="hover:text-purple-400 transition">{copy.midiChoiceLink}</Link></li>
              <li><Link to="/contact" className="hover:text-purple-400 transition">{copy.contactLink}</Link></li>
              <li><Link to="/terms" className="hover:text-purple-400 transition">{copy.termsLink}</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-400 transition">{copy.privacyLink}</Link></li>
              <li><Link to="/legal/tokushoho" className="hover:text-purple-400 transition">{copy.tokushohoLink}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{copy.followHeading}</h4>
            <div className="flex space-x-4">
              <a
                href={JAZZIFY_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition"
                aria-label={copy.xAria}
              >
                <i className="fab fa-x-twitter text-xl" aria-hidden="true" />
              </a>
              <a
                href={JAZZIFY_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition"
                aria-label={copy.instagramAria}
              >
                <i className="fab fa-instagram text-xl" aria-hidden="true" />
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
