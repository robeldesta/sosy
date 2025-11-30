'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { BackButton } from '@/components/telegram/BackButton'
import { staffApi, StaffInsight } from '@/lib/api/staff'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { usePermissions } from '@/hooks/usePermissions'
import { SkeletonCard } from '@/components/telegram/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'

export default function StaffInsightsPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const { isOwner } = usePermissions()
  const [insights, setInsights] = useState<StaffInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')

  useBackButton()

  useEffect(() => {
    if (isOwner) {
      loadInsights()
    }
  }, [isOwner, period])

  const loadInsights = async () => {
    setError(null)
    setLoading(true)
    try {
      const now = new Date()
      let startDate: Date
      
      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === 'week') {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
      } else {
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
      }

      const data = await staffApi.getInsights(
        startDate.toISOString(),
        now.toISOString()
      )
      setInsights(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('staff.insightsError'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] flex items-center justify-center px-[20px]">
        <div className="text-center">
          <div className="text-[#707579] text-[15px]" suppressHydrationWarning>
            {t('staff.insightsOwnerOnly')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('staff.insights')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]" suppressHydrationWarning>
                {user.first_name}
              </div>
            )}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-[8px] px-[14px] pb-[8px]">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 px-[12px] py-[6px] rounded-full text-[14px] font-medium transition-colors ${
                period === p
                  ? 'bg-[#3390ec] text-white'
                  : 'bg-[#f0f0f0] dark:bg-[#2a2a2a] text-[#707579]'
              }`}
              suppressHydrationWarning
            >
              {t(`staff.period.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        {error ? (
          <ErrorState message={error} onRetry={loadInsights} />
        ) : loading ? (
          <div className="space-y-[8px]">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-[40px]">
            <div className="text-[#707579] text-[15px]" suppressHydrationWarning>
              {t('staff.noInsights')}
            </div>
          </div>
        ) : (
          insights.map((insight) => (
            <TelegramCard key={insight.user_id}>
              <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                {insight.user_name} ({t(`staff.roles.${insight.role}`)})
              </div>
              <div className="space-y-[8px]">
                <div className="flex justify-between items-center">
                  <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                    {t('staff.totalSales')}
                  </div>
                  <div className="text-[15px] font-medium" suppressHydrationWarning>
                    {formatCurrency(insight.total_sales)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                    {t('staff.invoices')}
                  </div>
                  <div className="text-[15px] font-medium" suppressHydrationWarning>
                    {insight.invoice_count}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                    {t('staff.avgInvoice')}
                  </div>
                  <div className="text-[15px] font-medium" suppressHydrationWarning>
                    {formatCurrency(insight.avg_invoice)}
                  </div>
                </div>
                {insight.cancelled_invoices > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="text-[14px] text-[#ff3b30]" suppressHydrationWarning>
                      {t('staff.cancelled')}
                    </div>
                    <div className="text-[15px] font-medium text-[#ff3b30]" suppressHydrationWarning>
                      {insight.cancelled_invoices}
                    </div>
                  </div>
                )}
              </div>
            </TelegramCard>
          ))
        )}
      </div>
    </div>
  )
}

