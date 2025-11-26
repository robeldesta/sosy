'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useBusinessStore } from '@/stores/businessStore'
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { business } = useBusinessStore()

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t('settings.title')}</h1>
          <Link
            href="/"
            className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {t('common.back')}
          </Link>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('settings.businessInfo')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.businessPlaceholder')}
            </p>
            {business && (
              <div className="mt-4">
                <p><strong>{t('settings.businessName')}:</strong> {business.name}</p>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('settings.language')}</h2>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </main>
  )
}

