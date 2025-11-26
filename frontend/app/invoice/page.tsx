'use client'

import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import Link from 'next/link'

export default function InvoicePage() {
  const { t } = useTranslation()
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t('invoice.title')}</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {t('invoice.create')}
            </button>
            <Link
              href="/"
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t('common.back')}
            </Link>
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h2 className="text-2xl font-semibold mb-4">{t('invoice.createNew')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('invoice.createPlaceholder')}</p>
          </div>
        )}

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">{t('invoice.list')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('invoice.listPlaceholder')}</p>
        </div>
      </div>
    </main>
  )
}

