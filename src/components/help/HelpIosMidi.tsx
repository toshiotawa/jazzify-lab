import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import SiteFooter from '@/components/common/SiteFooter';
import { getHelpIosMidiCopy } from '@/components/help/helpContent';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const diagramBoxClass =
  'font-mono text-sm bg-slate-800/80 p-3 rounded border border-white/10 whitespace-pre-wrap my-3';

const connectionImgClass =
  'w-full bg-slate-900/80 object-contain max-h-64 rounded-lg border border-white/10 my-4';

const CONNECTION_IMAGE_FILES = [
  'iPhone_Lightning_adapter.webp',
  'iPad_Lightning_adapter.webp',
  'iPhone_TypeC_Direct.webp',
  'iPhone_TypeC_hub.webp',
  'iPad_TypeC_Direct.webp',
  'iPad_TypeC_hub.webp',
] as const;

const connectionImgSrc = (file: string): string =>
  encodeURI(`/midi-connection-patterns/${file}`);

interface ConnectionExampleProps {
  heading: string;
  imageFile: string;
  imageAlt: string;
  diagram: string;
  priority?: boolean;
}

const ConnectionExample: React.FC<ConnectionExampleProps> = ({
  heading,
  imageFile,
  imageAlt,
  diagram,
  priority = false,
}) => (
  <div className="mt-6">
    <h3 className="text-lg font-medium text-white/90 mb-2">{heading}</h3>
    <img
      src={connectionImgSrc(imageFile)}
      alt={imageAlt}
      className={connectionImgClass}
      width={1448}
      height={1086}
      loading="eager"
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
    <p className={diagramBoxClass}>{diagram}</p>
  </div>
);

const LIGHTNING_IMAGE_FILES = [
  'iPhone_Lightning_adapter.webp',
  'iPad_Lightning_adapter.webp',
] as const;

const USBC_IMAGE_FILES = [
  'iPhone_TypeC_Direct.webp',
  'iPhone_TypeC_hub.webp',
  'iPad_TypeC_Direct.webp',
  'iPad_TypeC_hub.webp',
] as const;

const HelpIosMidi: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const copy = getHelpIosMidiCopy(isEnglishCopy ? 'en' : 'ja');

  useEffect(() => {
    CONNECTION_IMAGE_FILES.forEach((file) => {
      const img = new Image();
      img.src = connectionImgSrc(file);
    });
  }, []);

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Helmet>
        <title>{copy.helmetTitle}</title>
      </Helmet>
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
        <div className="container mx-auto px-6 py-12 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">{copy.pageTitle}</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <p>{copy.intro}</p>

            <section aria-labelledby="midi-lightning-heading">
              <h2 id="midi-lightning-heading" className="text-xl font-semibold text-white mb-3">
                {copy.lightningHeading}
              </h2>
              <p>{copy.lightningBody}</p>

              {copy.lightningExamples.map((example, index) => (
                <ConnectionExample
                  key={LIGHTNING_IMAGE_FILES[index]}
                  heading={example.heading}
                  imageFile={LIGHTNING_IMAGE_FILES[index]}
                  imageAlt={example.imageAlt}
                  diagram={example.diagram}
                  priority={index === 0}
                />
              ))}
            </section>

            <section aria-labelledby="midi-usbc-heading">
              <h2 id="midi-usbc-heading" className="text-xl font-semibold text-white mb-3">
                {copy.usbcHeading}
              </h2>
              <p>{copy.usbcBody}</p>

              {copy.usbcExamples.map((example, index) => (
                <ConnectionExample
                  key={USBC_IMAGE_FILES[index]}
                  heading={example.heading}
                  imageFile={USBC_IMAGE_FILES[index]}
                  imageAlt={example.imageAlt}
                  diagram={example.diagram}
                />
              ))}

              <p className="mt-3">{copy.usbcClosing}</p>
            </section>

            <section aria-labelledby="midi-tips-heading">
              <h2 id="midi-tips-heading" className="text-xl font-semibold text-white mb-3">
                {copy.tipsHeading}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                {copy.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>

            <div className="pt-4">
              <Link to="/contact" className="text-blue-300 underline">
                {copy.contactLinkLabel}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HelpIosMidi;
