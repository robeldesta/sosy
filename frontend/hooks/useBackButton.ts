'use client'

import { useEffect } from 'react'
import { useTelegramWebApp } from './useTelegramWebApp'
import { useRouter } from 'next/navigation'

export function useBackButton(onBack?: () => void) {
  const { webApp } = useTelegramWebApp()
  const router = useRouter()

  useEffect(() => {
    if (!webApp?.BackButton) return

    const backButton = webApp.BackButton
    const handleBack = () => {
      if (onBack) {
        onBack()
      } else {
        router.back()
      }
    }

    backButton.onClick(handleBack)
    backButton.show()

    return () => {
      backButton.offClick(handleBack)
      backButton.hide()
    }
  }, [webApp, router, onBack])
}

