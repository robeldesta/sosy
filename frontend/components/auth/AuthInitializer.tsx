'use client'

import { useEffect } from 'react'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/authStore'

export function AuthInitializer() {
  const { webApp, isReady } = useTelegramWebApp()
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    if (!isReady) return

    const authenticate = async () => {
      // Check if already authenticated
      const existingToken = localStorage.getItem('auth_token')
      if (existingToken) {
        return // Already authenticated
      }

      // If not in Telegram WebApp, use test user for development
      if (!webApp || !webApp.initDataUnsafe) {
        console.log('Running outside Telegram - using test user for development')
        
        // TODO: REMOVE THIS TEST USER BEFORE FINALIZING
        // Test user: Robel Desta (robeldesta89) - Telegram ID: 684087296
        try {
          const response = await authApi.devLogin({
            telegram_id: 684087296,
            first_name: 'Robel',
            last_name: 'Desta',
            username: 'robeldesta89',
          })
          
          // Store token
          localStorage.setItem('auth_token', response.access_token)
          setToken(response.access_token)
          setUser({
            id: response.user.id,
            telegramId: response.user.telegram_id,
            firstName: response.user.first_name,
            lastName: response.user.last_name,
            username: response.user.username,
            photoUrl: response.user.photo_url,
          })
        } catch (error: any) {
          console.error('Dev login failed:', error)
          // Continue without auth - backend will handle dev mode
        }
        return
      }

      // Get Telegram initData
      const initData = webApp.initDataUnsafe
      if (!initData) {
        return
      }

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
        // Backend will handle dev mode if no token
      }
    }

    authenticate()
  }, [isReady, webApp, setUser, setToken])

  return null
}
