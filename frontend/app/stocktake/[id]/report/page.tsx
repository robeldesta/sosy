'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { stockTakeApi, ShrinkageReport } from '@/lib/api/stockTake'
import { showToast } from '@/lib/utils/toast'

export default function StockTakeReportPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = parseInt(params.id as string)
  const { t } = useTranslation()
  const [report, setReport] = useState<ShrinkageReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [sessionId])

  const loadReport = async () => {
    try {
      const data = await stockTakeApi.getReport(sessionId)
      setReport(data)
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to load report', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !report) {
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
            {t('stockTake.shrinkageReport', 'Shrinkage Report')}
          </h1>
          <p className="text-sm text-[#707579]">
            {new Date(report.session_date).toLocaleDateString()}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4">
            <p className="text-xs text-[#707579] mb-1">{t('stockTake.totalLoss', 'Total Loss')}</p>
            <p className="text-xl font-semibold text-red-600">
              {report.total_loss_value.toFixed(2)} ETB
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-xs text-[#707579] mb-1">{t('stockTake.totalGain', 'Total Gain')}</p>
            <p className="text-xl font-semibold text-green-600">
              {report.total_gain_value.toFixed(2)} ETB
            </p>
          </div>
        </div>

        {/* Net Difference */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <p className="text-sm text-[#707579] mb-1">{t('stockTake.netDifference', 'Net Difference')}</p>
          <p
            className={`text-2xl font-semibold ${
              report.net_difference < 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {report.net_difference > 0 ? '+' : ''}
            {report.net_difference.toFixed(2)} ETB
          </p>
        </div>

        {/* Top Losses */}
        {report.top_losses.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-[#000000] mb-3">
              {t('stockTake.topLosses', 'Top 10 Losses')}
            </h2>
            <div className="space-y-2">
              {report.top_losses.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start pb-2 border-b border-[#e5e5e5] last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-[#000000]">{item.product_name}</p>
                    <p className="text-xs text-[#707579] mt-1">
                      {item.expected_qty} → {item.counted_qty} ({item.difference})
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-600 ml-4">
                    {item.difference_value.toFixed(2)} ETB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Overs */}
        {report.top_overs.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-[#000000] mb-3">
              {t('stockTake.topOvers', 'Top 10 Overs')}
            </h2>
            <div className="space-y-2">
              {report.top_overs.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start pb-2 border-b border-[#e5e5e5] last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-[#000000]">{item.product_name}</p>
                    <p className="text-xs text-[#707579] mt-1">
                      {item.expected_qty} → {item.counted_qty} (+{item.difference})
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-green-600 ml-4">
                    {item.difference_value.toFixed(2)} ETB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highest Variance */}
        {report.highest_variance.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-[#000000] mb-3">
              {t('stockTake.highestVariance', 'Highest Variance')}
            </h2>
            <div className="space-y-2">
              {report.highest_variance.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start pb-2 border-b border-[#e5e5e5] last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-[#000000]">{item.product_name}</p>
                    <p className="text-xs text-[#707579] mt-1">
                      {item.expected_qty} → {item.counted_qty} ({item.difference > 0 ? '+' : ''}{item.difference})
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#000000] ml-4">
                    {Math.abs(item.difference)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {report.notes && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-[#000000] mb-2">
              {t('common.notes', 'Notes')}
            </h2>
            <p className="text-sm text-[#707579]">{report.notes}</p>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => router.push('/stocktake')}
          className="w-full bg-[#3390ec] text-white rounded-xl py-3 font-medium active:opacity-80"
        >
          {t('common.back', 'Back to Sessions')}
        </button>
      </div>
    </div>
  )
}

