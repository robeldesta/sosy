'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

export function SubscriptionWall({ children }: { children: React.ReactNode }) {
  const { hasActiveSubscription, isLoading, isExpired } = useSubscription()
  const router = useRouter()
  const pathname = usePathname()
  const { webApp } = useTelegramWebApp()

  // Allow access to subscribe page and public routes
  const isPublicRoute = pathname === '/subscribe' || pathname === '/login' || pathname === '/'

  // Allow public routes
  if (isPublicRoute) {
    return <>{children}</>
  }

  // If still loading, show loading state but allow navigation
  if (isLoading) {
    return <>{children}</>
  }

  // Only block if subscription is explicitly expired
  // Allow access if subscription check fails (for development/testing)
  if (!hasActiveSubscription && isExpired) {
    return (
      <div className="min-h-screen bg-[var(--tg-theme-bg-color,#ffffff)] p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#3390ec] to-[#5d9cec] rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-[24px] font-bold text-[var(--tg-theme-text-color,#000000)]">
            Subscription Required
          </h1>

          {/* Message */}
          <p className="text-[17px] text-[var(--tg-theme-hint-color,#999999)] leading-relaxed">
            Your subscription has expired. Please upgrade to continue using all features.
          </p>

          {/* CTA Button */}
          <TelegramButton
            onClick={() => router.push('/subscribe')}
            fullWidth
            className="mt-8"
          >
            Upgrade Now
          </TelegramButton>
        </div>
      </div>
    )
  }

  // Allow access even without active subscription (for development/testing)
  // In production, you can uncomment the redirect below
  // if (!hasActiveSubscription) {
  //   router.push('/subscribe')
  //   return null
  // }

  return <>{children}</>
}

