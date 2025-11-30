import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enTranslations from '@/locales/en.json'
import amTranslations from '@/locales/am.json'
import omTranslations from '@/locales/om.json'
import tiTranslations from '@/locales/ti.json'

const resources = {
  en: {
    translation: enTranslations,
  },
  am: {
    translation: amTranslations,
  },
  om: {
    translation: omTranslations,
  },
  ti: {
    translation: tiTranslations,
  },
}

let i18nInstance: typeof i18n | null = null

export function initI18n() {
  if (i18nInstance) {
    return i18nInstance
  }

  // Always start with English to prevent hydration mismatch
  // Language will be changed on client-side after hydration
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en', // Always start with English
      fallbackLng: 'en',
      supportedLngs: ['en', 'am', 'om', 'ti'],
      detection: {
        // Only detect language on client side, not during SSR
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
        // Don't auto-detect browser language during initialization to prevent hydration mismatch
        order: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false, // Disable suspense to prevent hydration issues
      },
    })

  i18nInstance = i18n
  return i18n
}

export default i18n

