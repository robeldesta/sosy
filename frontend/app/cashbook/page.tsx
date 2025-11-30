'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { cashbookApi, CashbookSummary } from '@/lib/api/cashbook'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { SkeletonCard } from '@/components/telegram/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CashbookPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const [summary, setSummary] = useState<CashbookSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')

  useBackButton()

  useEffect(() => {
    loadCashbook()
  }, [period])

  const loadCashbook = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await cashbookApi.getSummary(undefined, period)
      setSummary(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('cashbook.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]" suppressHydrationWarning>
              {t('cashbook.title')}
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
          {(['day', 'week', 'month'] as const).map((p) => (
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
              {t(`cashbook.period.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px] space-y-[8px]">
        {error ? (
          <ErrorState message={error} onRetry={loadCashbook} />
        ) : loading ? (
          <div className="space-y-[8px]">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-[8px]">
              <TelegramCard>
                <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                  {t('cashbook.cashIn')}
                </div>
                <div className="text-[20px] font-bold text-[#34c759]" suppressHydrationWarning>
                  {formatCurrency(summary.cash_in)}
                </div>
              </TelegramCard>
              <TelegramCard>
                <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                  {t('cashbook.cashOut')}
                </div>
                <div className="text-[20px] font-bold text-[#ff3b30]" suppressHydrationWarning>
                  {formatCurrency(summary.cash_out)}
                </div>
              </TelegramCard>
            </div>

            <TelegramCard>
              <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                {t('cashbook.netCash')}
              </div>
              <div className={`text-[24px] font-bold ${
                summary.net_cash >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'
              }`} suppressHydrationWarning>
                {summary.net_cash >= 0 ? '+' : ''}{formatCurrency(summary.net_cash)}
              </div>
            </TelegramCard>

            {/* Payment Methods Breakdown */}
            <TelegramCard>
              <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                {t('cashbook.byMethod')}
              </div>
              <div className="space-y-[8px]">
                <div className="flex justify-between items-center">
                  <div className="text-[15px]" suppressHydrationWarning>{t('payment.methods.cash')}</div>
                  <div className="text-[15px] font-medium" suppressHydrationWarning>
                    {formatCurrency(summary.cash_by_method.cash)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[15px]" suppressHydrationWarning>{t('payment.methods.telebirr')}</div>
                  <div className="text-[15px] font-medium" suppressHydrationWarning>
                    {formatCurrency(summary.cash_by_method.telebirr)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[15px]" suppressHydrationWarning>{t('payment.methods.bank')}</div>
                  <div className="text-[15px] font-medium" suppressHydrationWarning>
                    {formatCurrency(summary.cash_by_method.bank)}
                  </div>
                </div>
              </div>
            </TelegramCard>

            {/* Reconcile Button */}
            <Link href="/cashbook/reconcile">
              <TelegramButton variant="secondary" fullWidth>
                {t('cashbook.reconcile')}
              </TelegramButton>
            </Link>

            {/* Entries */}
            <TelegramCard>
              <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                {t('cashbook.entries')}
              </div>
              {summary.entries.length === 0 ? (
                <EmptyState title={t('cashbook.noEntries')} />
              ) : (
                <div className="space-y-[8px]">
                  {summary.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex justify-between items-center py-[8px] border-b border-[#e5e5e5] dark:border-[#3a3a3a] last:border-0`}
                    >
                      <div className="flex-1">
                        <div className="text-[15px] font-medium" suppressHydrationWarning>
                          {entry.description}
                        </div>
                        <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                          {formatDate(entry.entry_date)}
                          {entry.payment_method && ` • ${entry.payment_method}`}
                        </div>
                      </div>
                      <div className={`text-[15px] font-medium ${
                        entry.entry_type === 'payment_in' ? 'text-[#34c759]' : 'text-[#ff3b30]'
                      }`} suppressHydrationWarning>
                        {entry.entry_type === 'payment_in' ? '+' : '-'}{formatCurrency(Math.abs(entry.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TelegramCard>
          </>
        ) : (
          <EmptyState title={t('cashbook.noData')} />
        )}
      </div>
    </div>
  )
}

