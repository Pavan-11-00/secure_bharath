import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import knTranslation from './locales/kn/translation.json';
import teTranslation from './locales/te/translation.json';
import bnTranslation from './locales/bn/translation.json';
import mrTranslation from './locales/mr/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            hi: { translation: hiTranslation },
            kn: { translation: knTranslation },
            te: { translation: teTranslation },
            bn: { translation: bnTranslation },
            mr: { translation: mrTranslation }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;

