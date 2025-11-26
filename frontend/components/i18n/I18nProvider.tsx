'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { initI18n } from '@/lib/i18n'

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    initI18n()
  }, [])

  return <I18nextProvider i18n={initI18n()}>{children}</I18nextProvider>
}

