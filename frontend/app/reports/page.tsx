'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { BackButton } from '@/components/telegram/BackButton'
import { reportsApi } from '@/lib/api/reports'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { SkeletonCard } from '@/components/telegram/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'

export default function ReportsPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailySales, setDailySales] = useState<any>(null)
  const [weeklySummary, setWeeklySummary] = useState<any>(null)
  const [monthlyOverview, setMonthlyOverview] = useState<any>(null)
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([])
  const [creditAging, setCreditAging] = useState<any>(null)

  useBackButton()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setError(null)
    setLoading(true)
    try {
      const [daily, weekly, monthly, expenses, credit] = await Promise.all([
        reportsApi.getDailySales().catch(() => null),
        reportsApi.getWeeklySummary().catch(() => null),
        reportsApi.getMonthlyOverview().catch(() => null),
        reportsApi.getExpensesByCategory().catch(() => []),
        reportsApi.getCreditAging().catch(() => null),
      ])
      setDailySales(daily)
      setWeeklySummary(weekly)
      setMonthlyOverview(monthly)
      setExpensesByCategory(expenses)
      setCreditAging(credit)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('reports.loadError'))
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
              {t('reports.title')}
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
        {error ? (
          <ErrorState message={error} onRetry={loadReports} />
        ) : loading ? (
          <div className="space-y-[8px]">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Daily Sales */}
            {dailySales && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('reports.dailySales')}
                </div>
                <div className="space-y-[8px]">
                  <div className="flex justify-between items-center">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('reports.totalSales')}
                    </div>
                    <div className="text-[17px] font-bold" suppressHydrationWarning>
                      {formatCurrency(dailySales.total_sales)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('invoice.total')} {t('invoice.invoices')}
                    </div>
                    <div className="text-[15px] font-medium" suppressHydrationWarning>
                      {dailySales.total_invoices}
                    </div>
                  </div>
                </div>
              </TelegramCard>
            )}

            {/* Weekly Summary */}
            {weeklySummary && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('reports.weeklySummary')}
                </div>
                <div className="space-y-[8px]">
                  <div className="flex justify-between items-center">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('reports.totalSales')}
                    </div>
                    <div className="text-[15px] font-medium" suppressHydrationWarning>
                      {formatCurrency(weeklySummary.total_sales)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('reports.totalExpenses')}
                    </div>
                    <div className="text-[15px] font-medium text-[#ff3b30]" suppressHydrationWarning>
                      {formatCurrency(weeklySummary.total_expenses)}
                    </div>
                  </div>
                  <div className="border-t border-[#e5e5e5] dark:border-[#3a3a3a] pt-[8px] mt-[8px]">
                    <div className="flex justify-between items-center">
                      <div className="text-[17px] font-semibold" suppressHydrationWarning>
                        {t('reports.net')}
                      </div>
                      <div className={`text-[17px] font-bold ${
                        weeklySummary.net >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'
                      }`} suppressHydrationWarning>
                        {weeklySummary.net >= 0 ? '+' : ''}{formatCurrency(weeklySummary.net)}
                      </div>
                    </div>
                  </div>
                </div>
              </TelegramCard>
            )}

            {/* Monthly Overview */}
            {monthlyOverview && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('reports.monthlyOverview')} - {monthlyOverview.month}/{monthlyOverview.year}
                </div>
                <div className="space-y-[8px]">
                  <div className="flex justify-between items-center">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('reports.totalSales')}
                    </div>
                    <div className="text-[15px] font-medium" suppressHydrationWarning>
                      {formatCurrency(monthlyOverview.total_sales)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('reports.totalExpenses')}
                    </div>
                    <div className="text-[15px] font-medium text-[#ff3b30]" suppressHydrationWarning>
                      {formatCurrency(monthlyOverview.total_expenses)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('reports.profitEstimate')}
                    </div>
                    <div className={`text-[17px] font-bold ${
                      monthlyOverview.profit_estimate >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'
                    }`} suppressHydrationWarning>
                      {formatCurrency(monthlyOverview.profit_estimate)}
                    </div>
                  </div>
                </div>
              </TelegramCard>
            )}

            {/* Expenses by Category */}
            {expensesByCategory.length > 0 && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('reports.expensesByCategory')}
                </div>
                <div className="space-y-[8px]">
                  {expensesByCategory.map((item) => (
                    <div key={item.category_id || 'uncategorized'} className="flex justify-between items-center">
                      <div className="text-[15px]" suppressHydrationWarning>
                        {item.category_name}
                      </div>
                      <div className="text-[15px] font-medium text-[#ff3b30]" suppressHydrationWarning>
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </TelegramCard>
            )}

            {/* Credit Aging */}
            {creditAging && creditAging.total_outstanding > 0 && (
              <TelegramCard>
                <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                  {t('reports.creditAging')}
                </div>
                <div className="space-y-[8px]">
                  <div className="flex justify-between items-center mb-[8px]">
                    <div className="text-[15px] text-[#707579]" suppressHydrationWarning>
                      {t('credit.totalOutstanding')}
                    </div>
                    <div className="text-[17px] font-bold text-[#ff3b30]" suppressHydrationWarning>
                      {formatCurrency(creditAging.total_outstanding)}
                    </div>
                  </div>
                  {Object.entries(creditAging.aging_buckets).map(([bucket, invoices]: [string, any]) => (
                    invoices.length > 0 && (
                      <div key={bucket} className="text-[14px] text-[#707579]" suppressHydrationWarning>
                        {t(`credit.agingBuckets.${bucket}`)}: {invoices.length} {t('credit.invoiceCount')}
                      </div>
                    )
                  ))}
                </div>
              </TelegramCard>
            )}
          </>
        )}
      </div>
    </div>
  )
}

