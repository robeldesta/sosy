'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { BackButton } from '@/components/telegram/BackButton'
import { creditApi, CreditSummary } from '@/lib/api/credit'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import { SkeletonCard } from '@/components/telegram/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CreditPage() {
  const { t } = useTranslation()
  const { user } = useTelegramWebApp()
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useBackButton()

  useEffect(() => {
    loadCredit()
  }, [])

  const loadCredit = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await creditApi.getCustomerCredit()
      setSummary(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('credit.loadError'))
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
              {t('credit.title')}
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
          <ErrorState message={error} onRetry={loadCredit} />
        ) : loading ? (
          <div className="space-y-[8px]">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : summary ? (
          <>
            {/* Summary */}
            <TelegramCard>
              <div className="text-[12px] text-[#707579] mb-[4px]" suppressHydrationWarning>
                {t('credit.totalOutstanding')}
              </div>
              <div className="text-[24px] font-bold text-[#ff3b30]" suppressHydrationWarning>
                {formatCurrency(summary.total_outstanding)}
              </div>
              <div className="text-[14px] text-[#707579] mt-[4px]" suppressHydrationWarning>
                {summary.invoice_count} {t('credit.invoiceCount')}
              </div>
            </TelegramCard>

            {/* Aging Buckets */}
            {Object.entries(summary.aging_buckets).map(([bucket, invoices]) => (
              invoices.length > 0 && (
                <TelegramCard key={bucket}>
                  <div className="text-[17px] font-medium mb-[12px]" suppressHydrationWarning>
                    {t(`credit.agingBuckets.${bucket}`)}
                  </div>
                  <div className="space-y-[8px]">
                    {invoices.map((invoice) => (
                      <Link key={invoice.invoice_id} href={`/invoice/${invoice.invoice_id}`}>
                        <div className="flex justify-between items-center py-[4px]">
                          <div className="flex-1">
                            <div className="text-[15px] font-medium" suppressHydrationWarning>
                              {invoice.invoice_number}
                            </div>
                            <div className="text-[13px] text-[#707579]" suppressHydrationWarning>
                              {invoice.customer_name || invoice.customer_phone} • {t('credit.daysOld', { days: invoice.days_old })}
                            </div>
                          </div>
                          <div className="text-[15px] font-medium text-[#ff3b30]" suppressHydrationWarning>
                            {formatCurrency(invoice.outstanding)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </TelegramCard>
              )
            ))}

            {summary.invoice_count === 0 && (
              <EmptyState title={t('credit.noCredit')} />
            )}
          </>
        ) : (
          <EmptyState title={t('credit.noCredit')} />
        )}
      </div>
    </div>
  )
}

