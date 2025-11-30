'use client'

import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import Link from 'next/link'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { useDashboardStore } from '@/stores/dashboardStore'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const { data, loading, fetchDashboard } = useDashboardStore()

  useBackButton()

  useEffect(() => {
    fetchDashboard()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboard()
    }, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
              {t('dashboard.title')}
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
          <div className="flex justify-center items-center py-[40px]">
            <div className="text-[#707579] text-[15px]" suppressHydrationWarning>{t('common.loading')}</div>
          </div>
        ) : data && data.today_sales !== undefined ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-[8px]">
              <TelegramCard>
                <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                  {t('dashboard.todaySales')}
                </div>
                <div className="text-[20px] font-bold text-[#34c759]" suppressHydrationWarning>
                  {formatCurrency(data.today_sales)}
                </div>
              </TelegramCard>
              <TelegramCard>
                <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                  {t('dashboard.todayPurchases')}
                </div>
                <div className="text-[20px] font-bold text-[#ff9500]" suppressHydrationWarning>
                  {formatCurrency(data.today_purchases)}
                </div>
              </TelegramCard>
            </div>

            {/* POS Mode Button - Prominent */}
            <Link href="/pos">
              <TelegramCard className="bg-gradient-to-r from-[#3390ec] to-[#5d9cec]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[20px] font-bold text-white mb-1">
                      🏪 POS Mode
                    </div>
                    <div className="text-[15px] text-white/90">
                      Fast checkout for sales
                    </div>
                  </div>
                  <div className="text-4xl">→</div>
                </div>
              </TelegramCard>
            </Link>

            {/* Quick Actions */}
            <TelegramCard>
              <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                {t('dashboard.quickActions')}
              </div>
              <div className="grid grid-cols-2 gap-[8px]">
                <Link href="/sell/quick">
                  <TelegramButton variant="primary" fullWidth>
                    {t('dashboard.newSale')}
                  </TelegramButton>
                </Link>
                <Link href="/purchase/new">
                  <TelegramButton variant="secondary" fullWidth>
                    {t('dashboard.newPurchase')}
                  </TelegramButton>
                </Link>
                <Link href="/stock">
                  <TelegramButton variant="secondary" fullWidth>
                    {t('dashboard.stock')}
                  </TelegramButton>
                </Link>
                <Link href="/invoice">
                  <TelegramButton variant="secondary" fullWidth>
                    {t('dashboard.invoices')}
                  </TelegramButton>
                </Link>
              </div>
            </TelegramCard>

            {/* Top Products */}
            {data.top_products_7_days.length > 0 && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('dashboard.topProducts')}
                </div>
                <div className="space-y-[8px]">
                  {data.top_products_7_days.map((product, index) => (
                    <div key={product.product_id} className="flex justify-between items-center">
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[14px] text-[#707579] w-[20px]" suppressHydrationWarning>
                          {index + 1}.
                        </span>
                        <span className="text-[15px] font-medium" suppressHydrationWarning>
                          {product.product_name}
                        </span>
                      </div>
                      <div className="text-[14px] text-[#707579]" suppressHydrationWarning>
                        {product.quantity_sold.toFixed(1)} {t('common.sold')}
                      </div>
                    </div>
                  ))}
                </div>
              </TelegramCard>
            )}

            {/* Low Stock */}
            {data.low_stock.length > 0 && (
              <TelegramCard>
                <div className="flex justify-between items-center mb-[12px]">
                  <div className="text-[17px] font-medium" suppressHydrationWarning>
                    {t('dashboard.lowStock')}
                  </div>
                  <span className="text-[14px] text-[#ff3b30] font-medium" suppressHydrationWarning>
                    {data.low_stock.length}
                  </span>
                </div>
                <div className="space-y-[8px]">
                  {data.low_stock.slice(0, 5).map((item) => (
                    <Link key={item.product_id} href={`/stock?product=${item.product_id}`}>
                      <div className="flex justify-between items-center py-[4px]">
                        <div className="flex-1">
                          <div className="text-[15px] font-medium" suppressHydrationWarning>
                            {item.product_name}
                          </div>
                          <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                            {item.current_stock} {item.unit_of_measure} / {item.reorder_point} {item.unit_of_measure}
                          </div>
                        </div>
                        <span className="text-[#ff3b30] text-[14px]">⚠️</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </TelegramCard>
            )}

            {/* Recent Activity */}
            {data.recent_activity.length > 0 && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('dashboard.recentActivity')}
                </div>
                <div className="space-y-[8px]">
                  {data.recent_activity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="border-b border-[#e5e5e5] dark:border-[#3a3a3a] pb-[8px] last:border-0">
                      <div className="text-[14px]" suppressHydrationWarning>
                        {activity.description}
                      </div>
                      <div className="text-[12px] text-[#707579] mt-[2px]" suppressHydrationWarning>
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/activity" className="block mt-[8px]">
                  <TelegramButton variant="secondary" fullWidth>
                    {t('dashboard.viewAllActivity')}
                  </TelegramButton>
                </Link>
              </TelegramCard>
            )}
          </>
        ) : (
          <TelegramCard>
            <div className="text-center py-[40px]">
              <div className="text-[#707579] text-[15px] mb-[8px]" suppressHydrationWarning>
                {data ? t('dashboard.noData') : t('dashboard.loadError')}
              </div>
              {!loading && (
                <button
                  onClick={() => fetchDashboard()}
                  className="text-[#3390ec] text-[15px] font-medium"
                  suppressHydrationWarning
                >
                  {t('common.retry')}
                </button>
              )}
            </div>
          </TelegramCard>
        )}
      </div>
    </div>
  )
}

