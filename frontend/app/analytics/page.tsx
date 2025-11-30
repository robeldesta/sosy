'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { analyticsApi, AnalyticsData } from '@/lib/api/analytics'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { BackButton } from '@/components/telegram/BackButton'
import { SkeletonCard } from '@/components/telegram/SkeletonLoader'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useBackButton()

  useEffect(() => {
    loadAnalytics()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadAnalytics()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAnalytics = async () => {
    try {
      const analyticsData = await analyticsApi.getAnalytics()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('analytics.title')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]" suppressHydrationWarning>
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : data ? (
          <>
            {/* Sales Cards */}
            <div className="grid grid-cols-2 gap-[8px]">
              <TelegramCard>
                <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                  {t('analytics.todaySales')}
                </div>
                <div className="text-[20px] font-bold text-[#34c759]" suppressHydrationWarning>
                  {formatCurrency(data.today_sales)}
                </div>
              </TelegramCard>
              <TelegramCard>
                <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                  {t('analytics.weekSales')}
                </div>
                <div className="text-[20px] font-bold text-[#3390ec]" suppressHydrationWarning>
                  {formatCurrency(data.week_sales)}
                </div>
              </TelegramCard>
            </div>

            <TelegramCard>
              <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                {t('analytics.monthSales')}
              </div>
              <div className="text-[24px] font-bold text-[#ff9500]" suppressHydrationWarning>
                {formatCurrency(data.month_sales)}
              </div>
            </TelegramCard>

            {/* Low Stock Warning */}
            {data.low_stock_count > 0 && (
              <TelegramCard>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[17px] font-medium mb-[4px]" suppressHydrationWarning>
                      {t('analytics.lowStock')}
                    </div>
                    <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                      {t('analytics.lowStockItems', { count: data.low_stock_count })}
                    </div>
                  </div>
                  <div className="text-[32px]">⚠️</div>
                </div>
              </TelegramCard>
            )}

            {/* Top Items */}
            {data.top_items.length > 0 && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('analytics.topItems')}
                </div>
                <div className="space-y-[8px]">
                  {data.top_items.map((item, index) => (
                    <div key={item.product_id} className="flex justify-between items-center">
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[14px] text-[#707579] w-[20px]" suppressHydrationWarning>
                          {index + 1}.
                        </span>
                        <span className="text-[15px] font-medium" suppressHydrationWarning>
                          {item.product_name}
                        </span>
                      </div>
                      <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                        {item.quantity_sold.toFixed(1)} {t('common.sold')}
                      </div>
                    </div>
                  ))}
                </div>
              </TelegramCard>
            )}
          </>
        ) : (
          <TelegramCard>
            <div className="text-center py-[40px]">
              <div className="text-[#707579] text-[15px]" suppressHydrationWarning>
                {t('analytics.noData')}
              </div>
            </div>
          </TelegramCard>
        )}
      </div>
    </div>
  )
}

