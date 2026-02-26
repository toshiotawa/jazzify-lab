import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FAQItem } from '@/data/landingPageData';

interface Props {
  faqData: FAQItem[];
  sectionId?: string;
  title: string;
}

export const FAQSection: React.FC<Props> = ({ faqData, sectionId = 'faq', title }) => {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id={sectionId} className="py-20" data-animate="slide-left text-up">
      <div className="container mx-auto px-6">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4"
          data-animate="from-behind heading-underline"
        >
          <img src="/stage_icons/1.png" alt={title} className="w-16 h-16" loading="lazy" />
          {title}
        </h2>

        <div className="max-w-4xl mx-auto space-y-6" data-animate="alt-cards text-up">
          {faqData.map((item) => (
            <div key={item.id} className="faq-item rounded-xl p-6">
              <button
                className="w-full flex items-center justify-between cursor-pointer text-left"
                onClick={() => toggle(item.id)}
                aria-expanded={openId === item.id}
                aria-controls={`faq-content-${sectionId}-${item.id}`}
              >
                <h3 className="text-lg font-bold text-white pr-4">{item.question}</h3>
                <i
                  className={`fas ${openId === item.id ? 'fa-chevron-up' : 'fa-chevron-down'} text-purple-400 flex-shrink-0`}
                  aria-hidden="true"
                ></i>
              </button>
              <div
                id={`faq-content-${sectionId}-${item.id}`}
                className={`mt-4 text-gray-400 ${openId === item.id ? '' : 'hidden'}`}
              >
                <span>{item.answer}</span>
                {item.link && (
                  <>
                    {' '}
                    <a
                      href={item.link.href}
                      target={item.link.external ? '_blank' : undefined}
                      rel={item.link.external ? 'noopener noreferrer' : undefined}
                      className="underline text-blue-300"
                    >
                      {item.link.text}
                    </a>
                  </>
                )}
                {item.extraLinks?.map((link, i) => (
                  <React.Fragment key={i}>
                    {i === 0 ? ' ' : ' / '}
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-300"
                      >
                        {link.text}
                      </a>
                    ) : (
                      <Link to={link.href} className="underline text-blue-300">
                        {link.text}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
