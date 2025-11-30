'use client'

import { useEffect } from 'react'
import { useTelegramWebApp } from './useTelegramWebApp'

interface UseMainButtonOptions {
  text: string
  onClick?: () => void
  isActive?: boolean
  isVisible?: boolean
}

export function useMainButton({
  text,
  onClick,
  isActive = true,
  isVisible = true,
}: UseMainButtonOptions) {
  const { webApp } = useTelegramWebApp()

  useEffect(() => {
    if (!webApp?.MainButton) return

    const mainButton = webApp.MainButton

    mainButton.setText(text)
    mainButton.setParams({
      is_active: isActive,
      is_visible: isVisible,
    })

    if (isVisible) {
      mainButton.show()
    } else {
      mainButton.hide()
    }

    if (onClick) {
      mainButton.onClick(onClick)
    }

    return () => {
      if (onClick) {
        mainButton.offClick(onClick)
      }
      mainButton.hide()
    }
  }, [webApp, text, onClick, isActive, isVisible])
}

