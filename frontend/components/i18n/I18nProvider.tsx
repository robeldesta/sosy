'use client'

import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { initI18n } from '@/lib/i18n'

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false)
  const i18nInstance = initI18n()

  useEffect(() => {
    // Mark as mounted after hydration
    setMounted(true)
    
    // After hydration, check if language needs to be updated
    const savedLang = localStorage.getItem('i18nextLng')
    if (savedLang && ['en', 'am', 'om'].includes(savedLang) && i18nInstance.language !== savedLang) {
      i18nInstance.changeLanguage(savedLang)
    }
  }, [i18nInstance])

  // During SSR and initial render, always use English to prevent hydration mismatch
  if (!mounted && i18nInstance.language !== 'en') {
    i18nInstance.changeLanguage('en')
  }

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
}

