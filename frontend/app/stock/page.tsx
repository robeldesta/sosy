'use client'

import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import Link from 'next/link'

export default function StockPage() {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t('stock.title')}</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t('stock.add')}
            </button>
            <Link
              href="/"
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t('common.back')}
            </Link>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h2 className="text-2xl font-semibold mb-4">{t('stock.addNew')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('stock.addPlaceholder')}</p>
          </div>
        )}

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">{t('stock.list')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('stock.listPlaceholder')}</p>
        </div>
      </div>
    </main>
  )
}

