'use client'

import { useEffect, useState } from 'react'

export interface TelegramThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

export function useTelegramWebApp() {
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({})
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp
      webApp.ready()
      webApp.expand()
      
      setThemeParams(webApp.themeParams || {})
      setUser(webApp.initDataUnsafe?.user)
      setIsReady(true)

      // Listen for theme changes
      webApp.onEvent('themeChanged', () => {
        setThemeParams(webApp.themeParams || {})
      })
    } else {
      // Not in Telegram - set ready anyway for development
      setIsReady(true)
    }
  }, [])

  return {
    webApp: typeof window !== 'undefined' ? window.Telegram?.WebApp : null,
    themeParams,
    user,
    isReady,
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        themeParams: TelegramThemeParams
        initDataUnsafe?: {
          user?: any
        }
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText: (text: string) => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          showProgress: (leaveActive?: boolean) => void
          hideProgress: () => void
          setParams: (params: {
            text?: string
            color?: string
            text_color?: string
            is_active?: boolean
            is_visible?: boolean
          }) => void
        }
        BackButton: {
          isVisible: boolean
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        onEvent: (event: string, callback: () => void) => void
        offEvent: (event: string, callback: () => void) => void
      }
    }
  }
}

