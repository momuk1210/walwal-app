import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { TRANSLATIONS } from './translations';

const resources = {
  en: { translation: TRANSLATIONS.en },
  ko: { translation: TRANSLATIONS.ko },
  ja: { translation: TRANSLATIONS.ja },
  es: { translation: TRANSLATIONS.es }
};

// Auto-detect browser language or default to ko
const getBrowserLanguage = () => {
  if (typeof navigator === 'undefined') return 'ko';
  const lang = navigator.language || (navigator as any).userLanguage;
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('es')) return 'es';
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getBrowserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
