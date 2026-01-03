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
      className="flex items-center justify-center h-9 w-9 rounded-full font-semibold text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      title={t('language.change')}
    >
      {language === 'bn' ? 'EN' : 'BN'}
    </button>
  );
};

export default LanguageSwitcher;
