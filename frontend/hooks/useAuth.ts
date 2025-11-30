'use client'

import { useEffect, useState } from 'react'
import { useTelegramWebApp } from './useTelegramWebApp'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { webApp, user, isReady } = useTelegramWebApp()
  const { setUser, setToken } = useAuthStore()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    if (!isReady || !webApp) return

    const authenticate = async () => {
      // Check if already authenticated
      const existingToken = localStorage.getItem('auth_token')
      if (existingToken) {
        return // Already authenticated
      }

      // Get Telegram initData
      const initData = webApp.initDataUnsafe
      if (!initData) {
        console.warn('No Telegram initData available')
        return
      }

      setIsAuthenticating(true)
      try {
        // Parse initData to get auth data
        const params = new URLSearchParams(initData)
        const authData: Record<string, string> = {}
        
        params.forEach((value, key) => {
          authData[key] = value
        })

        // Call Telegram login endpoint
        const response = await authApi.telegramLogin(authData as any)
        
        // Store token
        localStorage.setItem('auth_token', response.access_token)
        setToken(response.access_token)
        // Map backend user to frontend User interface
        setUser({
          id: response.user.id,
          telegramId: response.user.telegram_id,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          username: response.user.username,
          photoUrl: response.user.photo_url,
        })
      } catch (error: any) {
        console.error('Authentication failed:', error)
        // In development, try to create a mock token or bypass auth
        if (process.env.NODE_ENV === 'development') {
          console.warn('Development mode: Auth failed, but continuing...')
        }
      } finally {
        setIsAuthenticating(false)
      }
    }

    authenticate()
  }, [isReady, webApp, setUser, setToken])

  return { isAuthenticating }
}

