import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TelegramProvider } from '@/components/telegram/TelegramProvider'
import { I18nProvider } from '@/components/i18n/I18nProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SOSY - Stock Management',
  description: 'Stock management and invoicing for Ethiopian micro retail businesses',
}

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
            {children}
          </I18nProvider>
        </TelegramProvider>
      </body>
    </html>
  )
}

