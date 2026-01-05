import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center h-9 w-9 rounded-full font-semibold text-sm bg-white/20 text-white hover:bg-white/30 transition-colors"
      title={t('language.change')}
    >
      {language === 'bn' ? 'EN' : 'BN'}
    </button>
  );
};

export default LanguageSwitcher;