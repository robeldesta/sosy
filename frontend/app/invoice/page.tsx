'use client'

import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { invoiceApi, Invoice } from '@/lib/api/invoice'
import { TelegramCard } from '@/components/telegram/TelegramCard'
import { TelegramListItem } from '@/components/telegram/TelegramListItem'
import { TelegramButton } from '@/components/telegram/TelegramButton'
import { BackButton } from '@/components/telegram/BackButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import { useBackButton } from '@/hooks/useBackButton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function InvoicePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useTelegramWebApp()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useBackButton()

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await invoiceApi.getInvoices()
      setInvoices(data)
    } catch (err: any) {
      console.error('Failed to load invoices:', err)
      setError(err.response?.data?.detail || t('invoice.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-[#34c759] text-white'
      case 'draft':
        return 'bg-[#707579] text-white'
      default:
        return 'bg-[#ff9500] text-white'
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] dark:bg-[#181818] pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#212121] border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="flex items-center px-[14px] py-[12px]">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-[24px]">
              {t('invoice.title')}
            </h1>
            {user?.first_name && (
              <div className="text-[14px] text-[#707579] mt-[2px]">
                {user.first_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-[14px] pt-[8px]">
        {/* Create Button */}
        <Link href="/invoice/new" className="block mb-[12px]">
          <TelegramButton variant="primary" fullWidth>
            {t('invoice.create')}
          </TelegramButton>
        </Link>

        {/* Invoice List */}
        {loading ? (
          <div className="flex justify-center items-center py-[40px]">
            <div className="text-[#707579] text-[15px]" suppressHydrationWarning>{t('common.loading')}</div>
          </div>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={loadInvoices}
            retryLabel={t('common.retry')}
          />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon="📄"
            title={t('invoice.noInvoices')}
            description={t('invoice.createFirstDesc')}
            actionLabel={t('invoice.createFirst')}
            onAction={() => router.push('/invoice/new')}
          />
        ) : (
          <div className="space-y-[8px]">
            {invoices.map((invoice) => (
              <TelegramCard key={invoice.id}>
                <TelegramListItem
                  title={invoice.invoice_number}
                  subtitle={`${invoice.customer_name || t('invoice.noCustomer')} • ${formatDate(invoice.created_at)}`}
                  rightElement={
                    <div className="flex flex-col items-end gap-[4px]">
                      <span className="text-[17px] font-medium text-[#000] dark:text-[#fff]">
                        {formatCurrency(invoice.total)}
                      </span>
                      <div className="flex items-center gap-[8px]">
                        <span className={`text-[12px] px-[6px] py-[2px] rounded-full font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                        <Link href={`/invoice/${invoice.id}`}>
                          <button className="text-[#3390ec] text-[14px] font-medium px-[8px] py-[2px] active:opacity-70">
                            {t('invoice.view')}
                          </button>
                        </Link>
                      </div>
                    </div>
                  }
                />
              </TelegramCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
