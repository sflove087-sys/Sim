import { useLanguage } from '../context/LanguageContext';

export const useTranslation = () => {
  const { language, translations } = useLanguage();

  const t = (key: string, params?: { [key: string]: string | number }): string => {
    const langTranslations = translations[language] || translations['bn'];
    if (!langTranslations) {
        return key;
    }
    
    const keys = key.split('.');
    let result: any = langTranslations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in current language
        const fallbackTranslations = translations['en'];
        if (!fallbackTranslations) return key;

        let fallbackText: any = fallbackTranslations;
        for (const fk of keys) {
            fallbackText = fallbackText?.[fk];
            if (fallbackText === undefined) return key;
        }
        result = fallbackText || key;
        break;
      }
    }
    
    let text = result as string;
    if (params) {
        Object.keys(params).forEach(pKey => {
            text = text.replace(`{${pKey}}`, String(params[pKey]));
        });
    }

    return text;
  };

  return { t, language };
};
