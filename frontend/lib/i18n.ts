import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enTranslations from '@/locales/en.json'
import amTranslations from '@/locales/am.json'
import omTranslations from '@/locales/om.json'

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
}

let i18nInstance: typeof i18n | null = null

export function initI18n() {
  if (i18nInstance) {
    return i18nInstance
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: ['en', 'am', 'om'],
      interpolation: {
        escapeValue: false,
      },
    })

  i18nInstance = i18n
  return i18n
}

export default i18n

