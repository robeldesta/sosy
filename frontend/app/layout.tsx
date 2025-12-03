'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { TelegramProvider } from '@/components/telegram/TelegramProvider'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import { Toast } from '@/components/ui/Toast'
import { AuthInitializer } from '@/components/auth/AuthInitializer'
import { OfflineIndicator } from '@/components/telegram/OfflineIndicator'
import { SubscriptionWall } from '@/components/subscription/SubscriptionWall'
import { SyncIndicator } from '@/components/sync/SyncIndicator'
import { SyncInitializer } from '@/components/sync/SyncInitializer'
import { WebSocketInitializer } from '@/components/sync/WebSocketInitializer'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TelegramProvider>
          <I18nProvider>
            <AuthInitializer />
            <OfflineIndicator />
            <SyncInitializer />
            <WebSocketInitializer />
            <SyncIndicator />
            <SubscriptionWall>{children}</SubscriptionWall>
            <Toast />
          </I18nProvider>
        </TelegramProvider>
      </body>
    </html>
  )
}
