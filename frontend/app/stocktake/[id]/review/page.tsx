'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useMainButton } from '@/hooks/useMainButton'
import { stockTakeApi, StockTakeSession, StockTakeLine, StockTakeSummary } from '@/lib/api/stockTake'
import { showToast } from '@/lib/utils/toast'

type Tab = 'all' | 'losses' | 'overs' | 'matches' | 'uncounted'

export default function StockTakeReviewPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = parseInt(params.id as string)
  const { t } = useTranslation()
  const { webApp } = useTelegramWebApp()
  const [session, setSession] = useState<StockTakeSession | null>(null)
  const [summary, setSummary] = useState<StockTakeSummary | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    loadData()
  }, [sessionId])

  const handleApprove = async () => {
    if (!confirm(t('stockTake.confirmApprove', 'Approve stock adjustments?'))) {
      return
    }

    setApproving(true)
    try {
      await stockTakeApi.approve(sessionId)
      webApp?.HapticFeedback?.notificationOccurred('success')
      showToast(t('stockTake.approved', 'Stock adjustments approved'), 'success')
      router.push(`/stocktake/${sessionId}/report`)
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to approve', 'error')
    } finally {
      setApproving(false)
    }
  }

  useMainButton({
    text: session?.status === 'review' ? t('stockTake.approve', 'Approve Adjustments') : '',
    onClick: handleApprove,
    isActive: session?.status === 'review' && !approving,
    isVisible: session?.status === 'review',
  })

  const loadData = async () => {
    try {
      const [sessionData, summaryData] = await Promise.all([
        stockTakeApi.getSession(sessionId),
        stockTakeApi.getSummary(sessionId),
      ])
      setSession(sessionData)
      setSummary(summaryData)
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkForReview = async () => {
    try {
      await stockTakeApi.markForReview(sessionId)
      showToast(t('stockTake.markedForReview', 'Marked for review'), 'success')
      loadData()
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to mark for review', 'error')
    }
  }

  if (loading || !session || !summary) {
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

  const lines = session.lines || []
  
  // Filter lines by tab
  const filteredLines = (() => {
    switch (activeTab) {
      case 'losses':
        return lines.filter(l => l.difference_type === 'loss')
      case 'overs':
        return lines.filter(l => l.difference_type === 'over')
      case 'matches':
        return lines.filter(l => l.difference_type === 'match')
      case 'uncounted':
        return lines.filter(l => l.counted_qty === null)
      default:
        return lines
    }
  })()

  // Get uncounted products (products without lines)
  const uncountedProducts = activeTab === 'uncounted' ? [] : [] // Would need to fetch all products

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e5e5] p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-[#000000]">
            {t('stockTake.review', 'Review')} #{sessionId}
          </h1>
          <button
            onClick={() => router.push(`/stocktake/${sessionId}`)}
            className="text-[#3390ec] text-sm font-medium"
          >
            {t('common.back', 'Back')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#f7f7f7] rounded-xl p-3">
            <p className="text-xs text-[#707579] mb-1">{t('stockTake.itemsCounted', 'Counted')}</p>
            <p className="text-lg font-semibold text-[#000000]">{summary.items_counted}</p>
          </div>
          <div className="bg-[#f7f7f7] rounded-xl p-3">
            <p className="text-xs text-[#707579] mb-1">{t('stockTake.differences', 'Differences')}</p>
            <p className="text-lg font-semibold text-[#000000]">{summary.losses_count + summary.overs_count}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f7f7f7] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-[#3390ec] shadow-sm'
                : 'text-[#707579]'
            }`}
          >
            {t('common.all', 'All')}
          </button>
          <button
            onClick={() => setActiveTab('losses')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'losses'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-[#707579]'
            }`}
          >
            {t('stockTake.losses', 'Losses')} ({summary.losses_count})
          </button>
          <button
            onClick={() => setActiveTab('overs')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overs'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-[#707579]'
            }`}
          >
            {t('stockTake.overs', 'Overs')} ({summary.overs_count})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'matches'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-[#707579]'
            }`}
          >
            {t('stockTake.matches', 'Matches')} ({summary.matches_count})
          </button>
        </div>
      </div>

      {/* Lines List */}
      <div className="p-4">
        {filteredLines.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-[#707579]">
              {t('stockTake.noItems', 'No items in this category')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLines.map(line => (
              <div
                key={line.id}
                className="bg-white rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-[#000000]">{line.product_name}</p>
                    <div className="flex gap-4 mt-1 text-xs text-[#707579]">
                      <span>
                        {t('stockTake.expected', 'Expected')}: {line.expected_qty}
                      </span>
                      <span>
                        {t('stockTake.counted', 'Counted')}: {line.counted_qty ?? '-'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    {line.difference !== 0 && (
                      <p
                        className={`font-semibold ${
                          line.difference < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {line.difference > 0 ? '+' : ''}
                        {line.difference}
                      </p>
                    )}
                    {line.difference_value > 0 && (
                      <p className="text-xs text-[#707579] mt-1">
                        {line.difference_value.toFixed(2)} ETB
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {session.status === 'open' && (
        <div className="p-4 bg-white border-t border-[#e5e5e5] sticky bottom-0">
          <button
            onClick={handleMarkForReview}
            className="w-full bg-[#3390ec] text-white rounded-xl py-3 font-medium active:opacity-80"
          >
            {t('stockTake.markForReview', 'Mark for Review')}
          </button>
        </div>
      )}
    </div>
  )
}

