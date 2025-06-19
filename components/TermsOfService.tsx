
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  const { t } = useLanguage();

  const contactLine = t('terms_content_contact');
  const contactUrl = t('terms_contact_url'); // New key for the URL
  const placeholder = '{CONTACT_FORM_LINK}';
  const contactParts = contactLine.split(placeholder);

  return (
    <div className="p-[clamp(1rem,5vw,2.5rem)] bg-white rounded-lg my-8 mx-auto w-full max-w-2xl flex flex-col items-center">
      <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold mb-[clamp(1rem,4vw,1.5rem)] text-center text-slate-800">
        {t('terms_pageTitle')}
      </h1>
      <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-left w-full text-[clamp(0.875rem,2.5vw,1rem)] leading-relaxed">
        <p>{t('terms_content_intro')}</p>
        
        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section1_title')}</h2>
        <p>{t('terms_content_s1_p1')}</p>

        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section2_title')}</h2>
        <p>{t('terms_content_s2_p1')}</p>
        <p>{t('terms_content_s2_p2')}</p>
        
        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section3_title')}</h2>
        <p>{t('terms_content_s3_p1')}</p>
        <p>{t('terms_content_s3_p2')}</p>

        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section4_title')}</h2>
        <p>{t('terms_content_s4_p1')}</p>
        <p>{t('terms_content_s4_p2')}</p>

        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section5_title')}</h2>
        <p>{t('terms_content_s5_p1')}</p>

        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section6_title')}</h2>
        <p>{t('terms_content_s6_p1')}</p>

        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section7_title')}</h2>
        <p>{t('terms_content_s7_p1')}</p>

        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mt-6 mb-2 text-slate-800">{t('terms_section8_title')}</h2>
        <p>{t('terms_content_s8_p1')}</p>

        <p className="mt-6">
          {contactParts[0]}
          {contactParts.length > 1 && contactUrl && (
            <a 
              href={contactUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline"
            >
              {contactUrl} {/* Displaying the URL as the link text */}
            </a>
          )}
          {contactParts[1]}
        </p>
        <p>{t('terms_content_lastUpdated')}</p>
      </div>
      <button
        onClick={onBack}
        className="mt-[clamp(1.5rem,5vw,2.5rem)] px-[clamp(1.5rem,5vw,2.5rem)] py-[clamp(0.6rem,2.5vw,0.875rem)] bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out text-[clamp(0.875rem,2.5vw,1.125rem)]"
      >
        {t('terms_backButton')}
      </button>
    </div>
  );
};

export default TermsOfService;
