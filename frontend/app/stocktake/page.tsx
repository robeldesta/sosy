'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { stockTakeApi, StockTakeSession } from '@/lib/api/stockTake'
import { showToast } from '@/lib/utils/toast'
import Link from 'next/link'

export default function StockTakeListPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { webApp } = useTelegramWebApp()
  const [sessions, setSessions] = useState<StockTakeSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await stockTakeApi.listSessions()
      setSessions(data)
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to load sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNew = async () => {
    try {
      const session = await stockTakeApi.start()
      router.push(`/stocktake/${session.id}`)
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to start session', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-[#000000] mb-2">
            {t('stockTake.title', 'Stock Taking')}
          </h1>
          <p className="text-sm text-[#707579]">
            {t('stockTake.subtitle', 'Count and verify inventory')}
          </p>
        </div>

        {/* Start New Button */}
        <button
          onClick={handleStartNew}
          className="w-full bg-[#3390ec] text-white rounded-xl py-4 px-4 mb-4 font-medium active:opacity-80 transition-opacity"
        >
          {t('stockTake.startNew', 'Start New Count')}
        </button>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-[#707579]">{t('stockTake.noSessions', 'No stock take sessions yet')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => (
              <Link
                key={session.id}
                href={`/stocktake/${session.id}`}
                className="block bg-white rounded-xl p-4 active:opacity-80 transition-opacity"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-[#000000]">
                      {t('stockTake.session', 'Session')} #{session.id}
                    </p>
                    <p className="text-xs text-[#707579] mt-1">
                      {new Date(session.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      session.status === 'open'
                        ? 'bg-blue-100 text-blue-700'
                        : session.status === 'review'
                        ? 'bg-yellow-100 text-yellow-700'
                        : session.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-[#707579]">
                  <span>{session.total_items_counted} {t('stockTake.items', 'items')}</span>
                  {session.total_differences > 0 && (
                    <span className="text-red-600">
                      {session.total_differences} {t('stockTake.differences', 'differences')}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

