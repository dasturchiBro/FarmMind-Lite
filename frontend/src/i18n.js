import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
    .use(resourcesToBackend((language, namespace) => import(`../locales/${language}.json`)))
    .use(initReactI18next)
    .init({
        lng: typeof window !== 'undefined' ? localStorage.getItem('language') || 'uz' : 'uz',
        fallbackLng: 'uz',
        interpolation: {
            escapeValue: false,
        },
        supportedLngs: ['en', 'uz'],
        react: {
            useSuspense: false,
        },
    });

export default i18n;
