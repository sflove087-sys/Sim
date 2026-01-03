import { useLanguage } from '../context/LanguageContext';

export const useTranslation = () => {
  const { language, translations } = useLanguage();

  const t = (key: string, params?: { [key: string]: string | number }): string => {
    const langTranslations = translations[language] || translations['bn'];
    
    const keys = key.split('.');
    let result: any = langTranslations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in current language
        const fallbackTranslations = translations['en'];
        let fallbackText: any = fallbackTranslations;
        for (const fk of keys) {
            fallbackText = fallbackText?.[fk];
            if (fallbackText === undefined) return key;
        }
        result = fallbackText || key;
        break;
      }
    }
    
    let text = String(result);
    if (params) {
        Object.keys(params).forEach(pKey => {
            const regex = new RegExp(`{${pKey}}`, 'g');
            text = text.replace(regex, String(params[pKey]));
        });
    }

    return text;
  };

  return { t, language };
};
