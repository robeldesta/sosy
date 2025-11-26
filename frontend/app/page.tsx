'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'

export default function Home() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          {t('dashboard.title')}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Link
            href="/stock"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">{t('dashboard.stock')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('dashboard.stockDesc')}</p>
          </Link>
          <Link
            href="/invoice"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">{t('dashboard.invoice')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('dashboard.invoiceDesc')}</p>
          </Link>
          <Link
            href="/settings"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">{t('dashboard.settings')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('dashboard.settingsDesc')}</p>
          </Link>
        </div>
      </div>
    </main>
  )
}

